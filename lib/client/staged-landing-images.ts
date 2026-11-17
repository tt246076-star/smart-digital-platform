"use client";

import { csrfHeaders } from "@/lib/client/csrf";
import { createStagingUploadClient } from "@/lib/supabase/storage-client";

const BUCKET = "landing-logos-staging";
const STAGING_PREFIX = "staging://";
const MAX_FILE_BYTES = 20 * 1024 * 1024;

type ApiResult = {
  path?: string;
  token?: string;
  signedUrl?: string;
  error?: string;
};

async function callStagingApi(payload: Record<string, unknown>): Promise<ApiResult> {
  const response = await fetch("/api/storage/staged-landing-image", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(await csrfHeaders()),
    },
    body: JSON.stringify(payload),
  });

  const result: unknown = await response.json().catch(() => null);
  if (!response.ok || !result || typeof result !== "object") {
    const message = result && typeof result === "object" && "error" in result &&
      typeof (result as { error?: unknown }).error === "string"
      ? (result as { error: string }).error
      : "تعذر تنفيذ عملية رفع الصورة.";
    throw new Error(message);
  }
  return result as ApiResult;
}

export async function uploadStagedLandingImage(file: File): Promise<{ value: string; previewUrl: string }> {
  if (!file || !file.type.startsWith("image/") || file.size < 1 || file.size > MAX_FILE_BYTES) {
    throw new Error("نوع الصورة أو حجمها غير صالح.");
  }

  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase() || "jpg";
  const created = await callStagingApi({
    action: "create",
    contentType: file.type,
    size: file.size,
    extension,
  });

  if (typeof created.path !== "string" || typeof created.token !== "string") {
    throw new Error("تعذر تجهيز رابط رفع آمن.");
  }

  const storage = createStagingUploadClient();
  const { error } = await storage.storage.from(BUCKET).uploadToSignedUrl(
    created.path,
    created.token,
    file,
    { contentType: file.type },
  );
  if (error) {
    await callStagingApi({ action: "delete", path: created.path }).catch(() => undefined);
    throw new Error("تعذر رفع الصورة إلى التخزين.");
  }

  try {
    const preview = await callStagingApi({ action: "preview", path: created.path });
    if (typeof preview.signedUrl !== "string" || !preview.signedUrl.startsWith("https://")) {
      throw new Error("تعذر تجهيز معاينة الصورة.");
    }
    return {
      value: STAGING_PREFIX + created.path,
      previewUrl: preview.signedUrl,
    };
  } catch (error) {
    await callStagingApi({ action: "delete", path: created.path }).catch(() => undefined);
    throw error;
  }
}

export async function discardStagedLandingImage(value: string): Promise<void> {
  if (typeof value !== "string" || !value.startsWith(STAGING_PREFIX)) return;
  await callStagingApi({ action: "delete", path: value.slice(STAGING_PREFIX.length) });
}
