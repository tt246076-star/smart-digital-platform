"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function setUserPlan(formData: FormData) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");
  const adminEmail = "tt246076@gmail.com";
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) redirect("/dashboard");

  const userId = String(formData.get("user_id") || "");
  const planType = String(formData.get("plan_type") || "");
  if (!userId || !["trial", "customer", "special"].includes(planType)) redirect("/admin?error=1");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) redirect("/admin?error=1");
  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const values = planType === "trial"
    ? { plan_type: "trial", expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), max_pages: 0, advanced_features: false, updated_at: new Date().toISOString() }
    : planType === "customer"
      ? { plan_type: "customer", expires_at: null, max_pages: 1, advanced_features: false, updated_at: new Date().toISOString() }
      : { plan_type: "special", expires_at: null, max_pages: 5, advanced_features: true, updated_at: new Date().toISOString() };

  const { error } = await admin.from("user_access_plans").upsert({ user_id: userId, ...values }, { onConflict: "user_id" });
  if (error) {
    console.error("Admin plan update failed:", error.message);
    redirect("/admin?error=1");
  }
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?saved=1");
}
