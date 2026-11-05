import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function getPublicAccessPlan(userId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey || !userId) return null;

  const admin = createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin
    .from("user_access_plans")
    .select("plan_type, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Public landing access-plan lookup failed:", error.message);
    return null;
  }

  return data;
}
