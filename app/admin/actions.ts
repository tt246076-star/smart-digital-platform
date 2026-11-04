"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { cleanupLandingPageImages } from "@/lib/server/storage-cleanup";

export async function setUserPlan(formData: FormData) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) redirect("/dashboard");

  const userId = String(formData.get("user_id") || "");
  const planType = String(formData.get("plan_type") || "");
  if (!userId || !["trial", "customer", "vip"].includes(planType)) redirect("/admin?error=1");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) redirect("/admin?error=1");
  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const values = planType === "trial"
    ? { plan_type: "trial", expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), max_pages: 2, advanced_features: true, updated_at: new Date().toISOString() }
    : planType === "customer"
      ? { plan_type: "customer", expires_at: null, max_pages: 100, advanced_features: false, updated_at: new Date().toISOString() }
      : { plan_type: "vip", expires_at: null, max_pages: 100, advanced_features: true, updated_at: new Date().toISOString() };

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
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) redirect("/admin?error=config");
  if (user.email?.trim().toLowerCase() !== adminEmail) redirect("/dashboard");

  const pageId = String(formData.get("page_id") || "");
  if (!pageId) redirect("/admin?error=1");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) redirect("/admin?error=1");

  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: pageToDelete, error: lookupError } = await admin.from("landing_pages").select("logo_url,sections").eq("id", pageId).maybeSingle();
  if (lookupError) redirect("/admin?error=1");
  const { error } = await admin.from("landing_pages").delete().eq("id", pageId);
  if (error) {
    console.error("Admin page deletion failed:", error.message);
    redirect("/admin?error=1");
  }
  await cleanupLandingPageImages([pageToDelete]);
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?deleted=1");
}


export async function setUserGalleryLimit(formData: FormData) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) redirect("/admin?error=config");
  if (user.email?.trim().toLowerCase() !== adminEmail) redirect("/dashboard");
  const userId = String(formData.get("user_id") || "");
  const galleryType = String(formData.get("gallery_type") || "");
  const maxImages = Number(formData.get("max_images"));
  const maxImageMb = Number(formData.get("max_image_mb"));
  if (!userId || !["normal","vip"].includes(galleryType) || !Number.isInteger(maxImages) || maxImages < 0 || maxImages > 100 || !Number.isFinite(maxImageMb) || maxImageMb < 0.1 || maxImageMb > 20) redirect("/admin?error=gallery_limit");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) redirect("/admin?error=1");
  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const values = galleryType === "vip"
    ? { max_images: maxImages, max_image_mb: maxImageMb }
    : { normal_max_images: maxImages, normal_max_image_mb: maxImageMb };
  const { error } = await admin.from("user_gallery_limits").upsert({ user_id: userId, ...values, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) { console.error("Admin gallery limit update failed:", error.message); redirect("/admin?error=1"); }
  revalidatePath("/admin"); revalidatePath("/vip/new"); revalidatePath("/pages/new"); revalidatePath("/dashboard");
  redirect("/admin?gallerysaved=1");
}


export async function setUserPageTypeLimits(formData: FormData) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || user.email?.trim().toLowerCase() !== adminEmail) redirect("/dashboard");

  const userId = String(formData.get("user_id") || "");
  const normalMaxPages = Number(formData.get("normal_max_pages"));
  const vipMaxPages = Number(formData.get("vip_max_pages"));
  if (!userId || !Number.isInteger(normalMaxPages) || normalMaxPages < 0 || normalMaxPages > 100 ||
      !Number.isInteger(vipMaxPages) || vipMaxPages < 0 || vipMaxPages > 100) redirect("/admin?error=page_limits");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) redirect("/admin?error=1");
  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.from("user_page_type_limits").upsert({
    user_id: userId,
    normal_max_pages: normalMaxPages,
    vip_max_pages: vipMaxPages,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) {
    console.error("Admin page type limit update failed:", error.message);
    redirect("/admin?error=page_limits");
  }
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/pages/new");
  revalidatePath("/vip/new");
  redirect("/admin?pagesaved=1");
}
