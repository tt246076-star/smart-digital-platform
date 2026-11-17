"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { cleanupLandingPageImagesForDeletion } from "@/lib/server/storage-cleanup";
import { hasOnlyFormFields, isValidUuid, parseFormNumber, readFormText } from "@/lib/server/input-validation";

export async function setUserPlan(formData: FormData) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) redirect("/dashboard");

  if (!hasOnlyFormFields(formData, ["user_id", "plan_type"])) redirect("/admin?error=1");
  const userId = readFormText(formData, "user_id", 36, true) || "";
  const planType = readFormText(formData, "plan_type", 16, true) || "";
  if (!isValidUuid(userId) || !["trial", "customer", "vip"].includes(planType)) redirect("/admin?error=1");

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

  if (!hasOnlyFormFields(formData, ["page_id"])) redirect("/admin?error=1");
  const pageId = readFormText(formData, "page_id", 36, true) || "";
  if (!isValidUuid(pageId)) redirect("/admin?error=1");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) redirect("/admin?error=1");

  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: pageToDelete, error: lookupError } = await admin.from("landing_pages").select("id,logo_url,sections").eq("id", pageId).maybeSingle();
  if (lookupError || !pageToDelete) {
    if (lookupError) console.error("Admin page lookup before deletion failed:", lookupError.message);
    redirect("/admin?error=1");
  }

  // Remove only page-owned images. Shared images stay in Storage.
  // If the reference scan or Storage removal fails, keep the page record intact.
  const imagesDeleted = await cleanupLandingPageImagesForDeletion(pageId, [pageToDelete]);
  if (!imagesDeleted) redirect("/admin/pages?error=images");

  const { data: deletedPage, error } = await admin.from("landing_pages").delete().eq("id", pageId).select("id").maybeSingle();
  if (error || !deletedPage) {
    console.error("Admin page deletion failed:", error?.message || "No page row was deleted.");
    redirect("/admin/pages?error=1");
  }
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
  if (!hasOnlyFormFields(formData, ["user_id", "gallery_type", "max_images", "max_image_mb"])) redirect("/admin?error=gallery_limit");
  const userId = readFormText(formData, "user_id", 36, true) || "";
  const galleryType = readFormText(formData, "gallery_type", 10, true) || "";
  const maxImagesRaw = readFormText(formData, "max_images", 3, true) || "";
  const maxImageMbRaw = readFormText(formData, "max_image_mb", 5, true) || "";
  const maxImages = parseFormNumber(maxImagesRaw, { integer: true, min: 0, max: 100 });
  const maxImageMb = parseFormNumber(maxImageMbRaw, { min: 0.1, max: 20 });
  if (!isValidUuid(userId) || !["normal","vip"].includes(galleryType) || maxImages === null || maxImageMb === null) redirect("/admin?error=gallery_limit");
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

  if (!hasOnlyFormFields(formData, ["user_id", "normal_max_pages", "vip_max_pages"])) redirect("/admin?error=page_limits");
  const userId = readFormText(formData, "user_id", 36, true) || "";
  const normalMaxRaw = readFormText(formData, "normal_max_pages", 3, true) || "";
  const vipMaxRaw = readFormText(formData, "vip_max_pages", 3, true) || "";
  const normalMaxPages = parseFormNumber(normalMaxRaw, { integer: true, min: 0, max: 100 });
  const vipMaxPages = parseFormNumber(vipMaxRaw, { integer: true, min: 0, max: 100 });
  if (!isValidUuid(userId) || normalMaxPages === null || vipMaxPages === null) redirect("/admin?error=page_limits");

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
