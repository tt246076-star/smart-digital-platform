"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// This client is anonymous and stateless: it never reads or persists an auth session.
// Uploads use a one-time, path-scoped token issued by the authenticated server.
export function createStagingUploadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Storage client configuration is unavailable.");

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
