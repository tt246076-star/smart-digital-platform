import { createClient } from "@supabase/supabase-js";

type StorageBucket = "landing-logos" | "store-products";

function createStorageAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

function getStorageObjectPath(value: unknown, bucket: StorageBucket): string | null {
  if (typeof value !== "string" || !value) return null;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) return null;
  try {
    const parsed = new URL(value);
    if (parsed.origin !== new URL(projectUrl).origin) return null;
    const prefix = `/storage/v1/object/public/${bucket}/`;
    if (!parsed.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(parsed.pathname.slice(prefix.length));
    const segments = path.split("/");
    if (!path || path.startsWith("/") || path.includes(String.fromCharCode(92)) ||
        segments.some((part) => !part || part === "." || part === "..")) return null;
    return path;
  } catch { return null; }
}

function collectStorageObjectPaths(value: unknown, bucket: StorageBucket, output: Set<string>) {
  if (typeof value === "string") {
    const path = getStorageObjectPath(value, bucket);
    if (path) output.add(path);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStorageObjectPaths(item, bucket, output);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) collectStorageObjectPaths(item, bucket, output);
  }
}

async function getReferencedObjectPaths(admin: any, bucket: StorageBucket, excludedPageId?: string): Promise<Set<string> | null> {
  const referenced = new Set<string>();
  const pageSize = 500;
  const sources = bucket === "landing-logos"
    ? [{ table: "landing_pages", columns: "id,logo_url,sections" }, { table: "store_orders", columns: "items" }]
    : [{ table: "storefront_products", columns: "image_url" }, { table: "store_orders", columns: "items" }];

  for (const source of sources) {
    for (let offset = 0; ; offset += pageSize) {
      let query = admin.from(source.table).select(source.columns).order("id").range(offset, offset + pageSize - 1);
      if (source.table === "landing_pages" && excludedPageId) query = query.neq("id", excludedPageId);
      const { data, error } = await query;
      if (error || !Array.isArray(data)) {
        console.error("Storage cleanup reference scan failed:", error?.message || source.table);
        return null;
      }
      for (const row of data) collectStorageObjectPaths(row, bucket, referenced);
      if (data.length < pageSize) break;
    }
  }
  return referenced;
}

async function cleanupUnreferencedStorageObjects(bucket: StorageBucket, values: unknown[], excludedPageId?: string): Promise<boolean> {
  try {
    const admin = createStorageAdminClient();
    if (!admin) {
      console.warn("Storage cleanup skipped: server storage credentials are not configured.");
      return false;
    }
    const candidates = new Set<string>();
    for (const value of values) collectStorageObjectPaths(value, bucket, candidates);
    if (!candidates.size) return true;

    // Never delete files unless every relevant reference table was scanned successfully.
    // For an admin page deletion, exclude only that page while checking all other references.
    const referenced = await getReferencedObjectPaths(admin, bucket, excludedPageId);
    if (!referenced) return false;
    const unused = [...candidates].filter((path) => !referenced.has(path));
    for (let index = 0; index < unused.length; index += 1000) {
      const batch = unused.slice(index, index + 1000);
      const { error } = await admin.storage.from(bucket).remove(batch);
      if (error) {
        console.error(`Storage cleanup failed for ${bucket}:`, error.message);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error(`Storage cleanup failed for ${bucket}:`, error);
    return false;
  }
}

export async function cleanupLandingPageImages(values: unknown[]) {
  await cleanupUnreferencedStorageObjects("landing-logos", values);
}

export async function cleanupLandingPageImagesForDeletion(pageId: string, values: unknown[]): Promise<boolean> {
  if (!pageId) return false;
  return cleanupUnreferencedStorageObjects("landing-logos", values, pageId);
}

export async function cleanupStoreProductImages(values: unknown[]) {
  await cleanupUnreferencedStorageObjects("store-products", values);
}
