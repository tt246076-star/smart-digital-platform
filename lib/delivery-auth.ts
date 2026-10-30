import "server-only";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export const DELIVERY_ADMIN_EMAIL = "tt246076@gmail.com";

export async function isDeliveryAdmin(): Promise<boolean> {
  const supabase = await createSessionClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return !error && user?.email?.trim().toLowerCase() === DELIVERY_ADMIN_EMAIL;
}

export function createDeliveryDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase server credentials are not configured");
  }

  return createSupabaseAdmin(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
