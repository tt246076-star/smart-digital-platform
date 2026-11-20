import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { cleanupPendingLandingPageImage } from "@/lib/server/storage-cleanup";
import { normalizeSupportedImage } from "@/lib/server/upload-validation";
import {
  hasOnlyKeys,
  hasNoQueryParams,
  isValidUuid,
  readBoundedJson,
  readJsonText,
} from "@/lib/server/input-validation";

export const dynamic = "force-dynamic";

const BUCKET = "landing-logos-staging";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MEBIBYTE = 1024 * 1024;
const MAX_ACCOUNT_STAGING_BYTES = 250 * MEBIBYTE;

type ImageQuota = {
  maxPendingFiles: number;
  maxPendingBytes: number;
  maxPerHour: number;
  maxImageBytes: number;
};

function reply(body: Record<string, unknown>, status = 200, extraHeaders: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function isOwnedStagingPath(path: string, userId: string, extension?: "tmp") {
  if (!isValidUuid(userId) || path.length > 160 || !path.startsWith(userId + "/")) return false;
  const filePattern = extension === "tmp"
    ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.]tmp$/i
    : /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}[.](?:tmp|jpg|png|webp|gif)$/i;
  return filePattern.test(path.slice(userId.length + 1));
}

async function getImageQuota(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<ImageQuota | null> {
  const { data, error } = await supabase
    .from("user_gallery_limits")
    .select("normal_max_images,max_images,normal_max_image_mb,max_image_mb")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Staged image quota lookup failed:", error.message);
    return null;
  }

  const normalImagesRaw = Number(data?.normal_max_images ?? 2);
  const vipImagesRaw = Number(data?.max_images ?? 2);
  const normalMbRaw = Number(data?.normal_max_image_mb ?? 2);
  const vipMbRaw = Number(data?.max_image_mb ?? 2);

  const normalImages = Number.isFinite(normalImagesRaw) ? Math.max(0, Math.min(100, Math.floor(normalImagesRaw))) : 2;
  const vipImages = Number.isFinite(vipImagesRaw) ? Math.max(0, Math.min(100, Math.floor(vipImagesRaw))) : 2;
  const normalMb = Number.isFinite(normalMbRaw) ? Math.max(0.1, Math.min(20, normalMbRaw)) : 2;
  const vipMb = Number.isFinite(vipMbRaw) ? Math.max(0.1, Math.min(20, vipMbRaw)) : 2;

  // One page's configured gallery plus room for logo, cover, background/profile images.
  const maxPendingFiles = Math.max(4, Math.min(104, Math.max(normalImages, vipImages) + 4));
  const maxImageBytes = Math.min(MAX_FILE_BYTES, Math.floor(Math.max(normalMb, vipMb) * MEBIBYTE));

  return {
    maxPendingFiles,
    maxPendingBytes: Math.min(maxPendingFiles * MAX_FILE_BYTES, MAX_ACCOUNT_STAGING_BYTES),
    maxPerHour: Math.max(20, Math.min(400, maxPendingFiles * 2)),
    maxImageBytes,
  };
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function releaseReservation(admin: ReturnType<typeof getAdminClient>, userId: string, path: string) {
  if (!admin) return;
  const { error } = await admin.rpc("release_staged_image_upload", {
    p_user_id: userId,
    p_object_path: path,
  });
  if (error) console.warn("Staged image reservation release deferred:", error.message);
}

export async function POST(request: Request) {
  if (!hasNoQueryParams(request)) return reply({ error: "الطلب غير صالح." }, 400);

  const parsed = await readBoundedJson(request, 2048);
  if (!parsed.ok) return reply({ error: "بيانات رفع الصورة غير صالحة." }, 400);

  const body = parsed.value;
  const action = readJsonText(body.action, 16, true);
  if (!action) return reply({ error: "الطلب غير صالح." }, 400);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return reply({ error: "سجّل الدخول أولًا." }, 401);

  const admin = getAdminClient();
  if (!admin) return reply({ error: "خدمة رفع الصور غير متاحة حاليًا." }, 503);

  if (action === "create") {
    if (!hasOnlyKeys(body, ["action", "size"])) return reply({ error: "بيانات رفع الصورة غير صالحة." }, 400);

    const size = body.size;
    if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 1 || size > MAX_FILE_BYTES) {
      return reply({ error: "حجم الصورة غير صالح أو يتجاوز 20 ميغابايت." }, 413);
    }

    const quota = await getImageQuota(supabase, user.id);
    if (!quota) return reply({ error: "تعذر التحقق من حدود رفع الصور." }, 503);
    if (size > quota.maxImageBytes) return reply({ error: "الصورة تتجاوز الحد الذي حدده المدير لهذا الحساب." }, 413);

    // Count already-uploaded private staging objects as well as outstanding URL reservations.
    const { data: stagedFiles, error: listError } = await supabase.storage.from(BUCKET).list(user.id, {
      limit: quota.maxPendingFiles + 1,
      offset: 0,
    });
    if (listError || !Array.isArray(stagedFiles)) {
      console.error("Staged image quota listing failed:", listError?.message || "invalid storage listing");
      return reply({ error: "تعذر التحقق من مساحة الصور المؤقتة. حاول لاحقًا." }, 503);
    }

    const stagedObjects = stagedFiles.filter((item) => item.id !== null);
    const stagedBytes = stagedObjects.reduce((total, item) => {
      const metadata = item.metadata && typeof item.metadata === "object"
        ? item.metadata as Record<string, unknown>
        : {};
      const storedSize = Number(metadata.size ?? metadata.contentLength);
      return total + (Number.isFinite(storedSize) && storedSize >= 0 ? storedSize : quota.maxImageBytes);
    }, 0);

    if (stagedObjects.length >= quota.maxPendingFiles || stagedBytes + size > quota.maxPendingBytes) {
      return reply(
        { error: "وصلت إلى الحد المؤقت للصور. احفظ الصفحة أو أزل الصور غير المستخدمة ثم حاول مجددًا." },
        429,
        { "Retry-After": "3600" },
      );
    }

    const path = user.id + "/" + randomUUID() + ".tmp";
    const { data: reserved, error: reserveError } = await admin.rpc("reserve_staged_image_upload", {
      p_user_id: user.id,
      p_object_path: path,
      // Signed upload tokens do not bind their actual byte length; reserve the bucket maximum to prevent client size spoofing.
      p_size_bytes: MAX_FILE_BYTES,
      p_max_pending_count: quota.maxPendingFiles,
      p_max_pending_bytes: quota.maxPendingBytes,
      p_max_per_hour: quota.maxPerHour,
    });

    if (reserveError || typeof reserved !== "boolean") {
      console.error("Staged image reservation failed:", reserveError?.message || "invalid RPC result");
      return reply({ error: "تعذر حجز مساحة رفع آمنة." }, 503);
    }
    if (!reserved) {
      return reply(
        { error: "وصلت إلى الحد المؤقت لروابط رفع الصور. حاول لاحقًا." },
        429,
        { "Retry-After": "3600" },
      );
    }

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: false });
    if (error || !data?.token) {
      await releaseReservation(admin, user.id, path);
      console.error("Staged image upload token creation failed.");
      return reply({ error: "تعذر تجهيز رفع الصورة. حاول مجددًا." }, 503);
    }

    return reply({ path, token: data.token });
  }

  if (action === "preview" || action === "delete") {
    if (!hasOnlyKeys(body, ["action", "path"])) return reply({ error: "بيانات الصورة غير صالحة." }, 400);

    const path = readJsonText(body.path, 160, true);
    if (!path || !isOwnedStagingPath(path, user.id, action === "preview" ? "tmp" : undefined)) {
      return reply({ error: "مسار الصورة غير صالح." }, 400);
    }

    if (action === "preview") {
      // Claim the original .tmp reservation once; this prevents concurrent/replayed previews.
      const { data: claimed, error: claimError } = await admin.rpc("claim_staged_image_upload", {
        p_user_id: user.id,
        p_object_path: path,
      });
      if (claimError || claimed !== true) {
        return reply({ error: "انتهت صلاحية رابط المعاينة أو استُخدم من قبل. ارفع الصورة من جديد." }, 409);
      }

      const { data: file, error: downloadError } = await supabase.storage.from(BUCKET).download(path);
      if (downloadError || !file || file.size < 1 || file.size > MAX_FILE_BYTES) {
        await supabase.storage.from(BUCKET).remove([path]);
        return reply({ error: "الملف غير صالح أو يتجاوز الحجم المسموح." }, 415);
      }

      const quota = await getImageQuota(supabase, user.id);
      if (!quota || file.size > quota.maxImageBytes) {
        await supabase.storage.from(BUCKET).remove([path]);
        return reply({ error: "تعذر التحقق من حد حجم الصورة أو أن الصورة تتجاوزه." }, quota ? 413 : 503);
      }

      const normalized = await normalizeSupportedImage(
        new Uint8Array(await file.arrayBuffer()),
        quota.maxImageBytes,
      );
      if (!normalized) {
        await supabase.storage.from(BUCKET).remove([path]);
        return reply({ error: "مرفوض: الصورة تالفة أو غير مدعومة أو أبعادها/حجمها أكبر من المسموح." }, 415);
      }

      const finalPath = user.id + "/" + randomUUID() + "." + normalized.extension;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(
        finalPath,
        Buffer.from(normalized.bytes),
        {
          contentType: normalized.mime,
          upsert: false,
          cacheControl: "3600",
        },
      );

      if (uploadError) {
        await supabase.storage.from(BUCKET).remove([path]);
        console.error("Sanitized staging image upload failed:", uploadError.message);
        return reply({ error: "تعذر اعتماد الصورة بعد فحصها." }, 503);
      }

      const { error: sourceRemovalError } = await supabase.storage.from(BUCKET).remove([path]);
      if (sourceRemovalError) {
        await supabase.storage.from(BUCKET).remove([finalPath]);
        console.error("Original staged upload removal failed:", sourceRemovalError.message);
        return reply({ error: "تعذر إنهاء معالجة الصورة. حاول رفعها مجددًا." }, 503);
      }

      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(finalPath, 3600);
      if (error || !data?.signedUrl) {
        await supabase.storage.from(BUCKET).remove([finalPath]);
        return reply({ error: "تعذر تجهيز معاينة الصورة." }, 503);
      }

      return reply({
        path: finalPath,
        signedUrl: data.signedUrl,
        image: { width: normalized.width, height: normalized.height, frames: normalized.frames },
      });
    }

    const removed = await cleanupPendingLandingPageImage("staging://" + path, user.id);
    await releaseReservation(admin, user.id, path);
    if (!removed) return reply({ error: "تعذر حذف الصورة المؤقتة." }, 503);
    return reply({ ok: true });
  }

  return reply({ error: "العملية المطلوبة غير مدعومة." }, 400);
}
