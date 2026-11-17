import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cleanupPendingLandingPageImage } from "@/lib/server/storage-cleanup";
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

function reply(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function isOwnedStagingPath(path: string, userId: string): boolean {
  if (!isValidUuid(userId) || path.length > 160 || !path.startsWith(userId + "/")) return false;
  const fileName = path.slice(userId.length + 1);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{2,8}$/i.test(fileName);
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

  if (action === "create") {
    if (!hasOnlyKeys(body, ["action", "contentType", "size", "extension"])) {
      return reply({ error: "بيانات رفع الصورة غير صالحة." }, 400);
    }

    const contentType = readJsonText(body.contentType, 100, true);
    const extension = readJsonText(body.extension, 8, true)?.toLowerCase() || "";
    const size = body.size;
    if (
      !contentType ||
      !/^image\/[a-z0-9.+-]+$/i.test(contentType) ||
      !/^[a-z0-9]{2,8}$/.test(extension) ||
      typeof size !== "number" ||
      !Number.isSafeInteger(size) ||
      size < 1 ||
      size > MAX_FILE_BYTES
    ) {
      return reply({ error: "نوع الصورة أو حجمها غير صالح." }, 400);
    }

    const path = user.id + "/" + randomUUID() + "." + extension;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: false });
    if (error || !data?.token) {
      console.error("Staged image upload token creation failed.");
      return reply({ error: "تعذر تجهيز رفع الصورة. حاول مجددًا." }, 503);
    }

    return reply({ path, token: data.token });
  }

  if (action === "preview" || action === "delete") {
    if (!hasOnlyKeys(body, ["action", "path"])) {
      return reply({ error: "بيانات الصورة غير صالحة." }, 400);
    }

    const path = readJsonText(body.path, 160, true);
    if (!path || !isOwnedStagingPath(path, user.id)) {
      return reply({ error: "مسار الصورة غير صالح." }, 400);
    }

    if (action === "preview") {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
      if (error || !data?.signedUrl) return reply({ error: "تعذر تجهيز معاينة الصورة." }, 404);
      return reply({ signedUrl: data.signedUrl });
    }

    const removed = await cleanupPendingLandingPageImage("staging://" + path, user.id);
    if (!removed) return reply({ error: "تعذر حذف الصورة المؤقتة." }, 503);
    return reply({ ok: true });
  }

  return reply({ error: "العملية المطلوبة غير مدعومة." }, 400);
}
