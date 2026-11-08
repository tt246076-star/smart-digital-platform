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
  // Scan every known public-data location that can retain a Storage URL.
  // Keep this list aligned with the schema when new image-bearing fields are added.
  const commonSources = [
    { table: "landing_pages", columns: "id,logo_url,sections,custom_links" },
    { table: "store_orders", columns: "items" },
    { table: "platform_orders", columns: "items" },
    { table: "profiles", columns: "avatar_url" },
    { table: "delivery_shipments", columns: "latest_payload,office_map_url" },
    { table: "delivery_shipment_events", columns: "payload" },
    { table: "links", columns: "url" },
  ];
  const sources = bucket === "landing-logos"
    ? commonSources
    : [...commonSources, { table: "storefront_products", columns: "image_url" }];

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


// Delete a just-uploaded image only from the authenticated user's scoped new/ area.
// The reference scan remains the final authority: referenced files are never removed.
export async function cleanupPendingLandingPageImage(url: string, userId: string): Promise<boolean> {
  if (!userId) return false;
  const path = getStorageObjectPath(url, "landing-logos");
  if (!path || !path.startsWith(`new/${userId}/`)) return false;
  return cleanupUnreferencedStorageObjects("landing-logos", [url]);
}

// Remove stale, unreferenced images from both public image buckets after a
// 1-hour grace period. Listing and reference scans must all succeed before
// the first object is deleted.
async function listStaleStorageObjects(
  admin: any,
  bucketName: StorageBucket,
  cutoff: number,
): Promise<Set<string> | null> {
  const bucket = admin.storage.from(bucketName);
  const candidates = new Set<string>();
  const limit = 100;

  async function scanFolder(folder: string, depth = 0): Promise<boolean> {
    // Abort rather than silently skip unusually deep paths.
    if (depth > 10) {
      console.error("Storage cleanup listing exceeded maximum folder depth:", bucketName, folder);
      return false;
    }

    for (let offset = 0; ; offset += limit) {
      const { data, error } = await bucket.list(folder, {
        limit,
        offset,
        sortBy: { column: "created_at", order: "asc" },
      });
      if (error || !Array.isArray(data)) {
        console.error("Storage cleanup listing failed:", bucketName, error?.message || folder);
        return false;
      }

      for (const item of data) {
        if (item.id === null) {
          const child = folder ? `${folder}/${item.name}` : item.name;
          if (!(await scanFolder(child, depth + 1))) return false;
          continue;
        }

        const createdAt = item.created_at ? new Date(item.created_at).getTime() : NaN;
        // Unknown timestamps are deliberately retained.
        if (!Number.isFinite(createdAt) || createdAt >= cutoff) continue;

        const path = folder ? `${folder}/${item.name}` : item.name;
        candidates.add(bucket.getPublicUrl(path).data.publicUrl);
      }

      if (data.length < limit) break;
    }
    return true;
  }

  if (!(await scanFolder(""))) return null;
  return candidates;
}

export async function cleanupStalePendingLandingPageImages(): Promise<{ ok: boolean; candidates: number }> {
  const admin = createStorageAdminClient();
  if (!admin) return { ok: false, candidates: 0 };

  const cutoff = Date.now() - 60 * 60 * 1000;
  const buckets: StorageBucket[] = ["landing-logos", "store-products"];
  const candidatesByBucket = new Map<StorageBucket, Set<string>>();

  // Complete every Storage listing first. A listing error aborts all deletion.
  for (const bucket of buckets) {
    const candidates = await listStaleStorageObjects(admin, bucket, cutoff);
    if (!candidates) return { ok: false, candidates: 0 };
    candidatesByBucket.set(bucket, candidates);
  }

  // Complete every database reference scan before deleting from either bucket.
  const referencedByBucket = new Map<StorageBucket, Set<string>>();
  for (const bucket of buckets) {
    const referenced = await getReferencedObjectPaths(admin, bucket);
    if (!referenced) return { ok: false, candidates: 0 };
    referencedByBucket.set(bucket, referenced);
  }

  const candidateCount = [...candidatesByBucket.values()].reduce((sum, set) => sum + set.size, 0);

  // Only after all listings and all reference scans succeeded may deletion begin.
  for (const bucket of buckets) {
    const candidates = candidatesByBucket.get(bucket)!;
    const referenced = referencedByBucket.get(bucket)!;
    const paths = [...candidates]
      .map((url) => getStorageObjectPath(url, bucket))
      .filter((path): path is string => Boolean(path && !referenced.has(path)));

    for (let index = 0; index < paths.length; index += 1000) {
      const { error } = await admin.storage.from(bucket).remove(paths.slice(index, index + 1000));
      if (error) {
        console.error(`Storage cleanup failed for ${bucket}:`, error.message);
        return { ok: false, candidates: candidateCount };
      }
    }
  }

  return { ok: true, candidates: candidateCount };
}
