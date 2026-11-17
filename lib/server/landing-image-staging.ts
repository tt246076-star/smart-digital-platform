import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { detectSupportedImage } from "@/lib/server/upload-validation";

const STAGING_PREFIX = "staging://";
const STAGING_BUCKET = "landing-logos-staging";
const PUBLIC_BUCKET = "landing-logos";

function createStorageAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Storage server configuration is unavailable.");
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isStagedLandingImage(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(STAGING_PREFIX);
}

function getStagingPath(value: string, userId: string): string {
  if (!isStagedLandingImage(value)) throw new Error("Invalid staging image reference.");
  const path = value.slice(STAGING_PREFIX.length);
  const parts = path.split("/");
  if (
    parts.length !== 2 ||
    parts[0] !== userId ||
    !parts[1] ||
    parts[1] === "." ||
    parts[1] === ".." ||
    path.includes("\\") ||
    /[?#]/.test(path)
  ) {
    throw new Error("Invalid staging image path.");
  }
  return path;
}

export async function removePromotedLandingImages(paths: string[]) {
  if (!paths.length) return;
  try {
    const admin = createStorageAdminClient();
    const { error } = await admin.storage.from(PUBLIC_BUCKET).remove(paths);
    if (error) console.error("Promoted landing image rollback failed:", error.message);
  } catch (error) {
    console.error("Promoted landing image rollback failed:", error);
  }
}

/**
 * Replaces staging:// references anywhere in a value (including nested VIP gallery
 * data) with public URLs, after copying each owner-scoped object to its page folder.
 */
export async function promoteStagedLandingImages<T>(
  input: T,
  userId: string,
  pageId: string,
): Promise<{ value: T; uploadedPaths: string[] }> {
  if (!userId || !/^[0-9a-f-]{36}$/i.test(pageId)) {
    throw new Error("Invalid owner or page identifier.");
  }

  const admin = createStorageAdminClient();
  const uploadedPaths: string[] = [];

  async function visit(value: unknown): Promise<unknown> {
    if (isStagedLandingImage(value)) {
      const stagingPath = getStagingPath(value, userId);
      const { data: file, error: downloadError } = await admin.storage
        .from(STAGING_BUCKET)
        .download(stagingPath);
      if (downloadError || !file) {
        throw new Error("Could not retrieve a staged image.");
      }

      const buffer = await file.arrayBuffer();
      const detected = detectSupportedImage(new Uint8Array(buffer));
      if (!detected || buffer.byteLength < 1 || buffer.byteLength > 5 * 1024 * 1024) throw new Error("Rejected unsupported or oversized staged image.");
      const destination = `${pageId}/${crypto.randomUUID()}.${detected.extension}`;
      const { error: uploadError } = await admin.storage.from(PUBLIC_BUCKET).upload(
        destination, new Blob([buffer], { type: detected.mime }),
        { upsert: false, contentType: detected.mime, cacheControl: "31536000" },
      );
      if (uploadError) {
        throw new Error("Could not publish a staged image.");
      }

      uploadedPaths.push(destination);
      // Best-effort immediate staging cleanup; the hourly cleanup job is the fallback.
      const { error: removeError } = await admin.storage.from(STAGING_BUCKET).remove([stagingPath]);
      if (removeError) console.warn("Staging image cleanup deferred to scheduled cleanup.");
      return admin.storage.from(PUBLIC_BUCKET).getPublicUrl(destination).data.publicUrl;
    }

    if (Array.isArray(value)) return Promise.all(value.map(visit));
    if (value && typeof value === "object") {
      const entries = await Promise.all(
        Object.entries(value as Record<string, unknown>).map(async ([key, item]) => [key, await visit(item)] as const),
      );
      return Object.fromEntries(entries);
    }
    return value;
  }

  try {
    const promoted = await visit(input);
    return { value: promoted as T, uploadedPaths };
  } catch (error) {
    await removePromotedLandingImages(uploadedPaths);
    throw error;
  }
}
