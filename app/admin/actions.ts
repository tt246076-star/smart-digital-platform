"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function setUserPlan(formData: FormData) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");
  const adminEmail = (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase();
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


export async function deleteLandingPage(formData: FormData) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");
  if (user.email?.trim().toLowerCase() !== (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase()) redirect("/dashboard");

  const pageId = String(formData.get("page_id") || "");
  if (!pageId) redirect("/admin?error=1");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) redirect("/admin?error=1");

  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.from("landing_pages").delete().eq("id", pageId);
  if (error) {
    console.error("Admin page deletion failed:", error.message);
    redirect("/admin?error=1");
  }
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?deleted=1");
}


export async function setUserProductLimit(formData: FormData) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");
  const adminEmail = (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase();
  if (user.email?.trim().toLowerCase() !== adminEmail) redirect("/dashboard");

  const userId = String(formData.get("user_id") || "");
  const rawLimit = Number(formData.get("max_products"));
  if (!userId || !Number.isInteger(rawLimit) || rawLimit < 0 || rawLimit > 500) redirect("/admin?error=product_limit");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) redirect("/admin?error=1");
  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.from("user_product_limits").upsert({
    user_id: userId, max_products: rawLimit, updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
  if (error) {
    console.error("Admin product limit update failed:", error.message);
    redirect("/admin?error=1");
  }
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?productsaved=1");
}

export async function deleteCatalogProduct(formData: FormData) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");
  const adminEmail = (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase();
  if (user.email?.trim().toLowerCase() !== adminEmail) redirect("/dashboard");

  const pageId = String(formData.get("page_id") || "");
  const productIndex = Number(formData.get("product_index"));
  if (!pageId || !Number.isInteger(productIndex) || productIndex < 0) redirect("/admin?error=1");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) redirect("/admin?error=1");

  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: page, error: readError } = await admin.from("landing_pages").select("id, slug, sections").eq("id", pageId).maybeSingle();
  if (readError || !page) redirect("/admin?error=1");
  const sections = page.sections && typeof page.sections === "object" && !Array.isArray(page.sections) ? page.sections as Record<string, any> : {};
  const products = Array.isArray(sections.products) ? sections.products : [];
  if (productIndex >= products.length) redirect("/admin?error=1");
  products.splice(productIndex, 1);
  const { error } = await admin.from("landing_pages").update({ sections: { ...sections, products }, updated_at: new Date().toISOString() }).eq("id", pageId);
  if (error) {
    console.error("Admin product deletion failed:", error.message);
    redirect("/admin?error=1");
  }
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/p/" + page.slug);
  redirect("/admin?productdeleted=1");
}
