"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cleanupLandingPageImages, cleanupPendingLandingPageImage } from "@/lib/server/storage-cleanup";
import { promoteStagedLandingImages, removePromotedLandingImages } from "@/lib/server/landing-image-staging";
import { isValidUuid, isValidWebUrl, readFormText, validateLandingPageFormData } from "@/lib/server/input-validation";

export async function updateLandingPage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: accessPlan } = await supabase.from("user_access_plans").select("plan_type, expires_at").eq("user_id", user.id).maybeSingle();
  const { data: galleryLimit } = await supabase.from("user_gallery_limits").select("normal_max_images,normal_max_image_mb").eq("user_id", user.id).maybeSingle();
  const maxGalleryImages = Math.max(0, Math.min(100, galleryLimit?.normal_max_images ?? 2));
  const maxGalleryImageMb = Math.max(0.1, Math.min(20, Number(galleryLimit?.normal_max_image_mb ?? 2)));
  const planActive = !!accessPlan && (!accessPlan.expires_at || new Date(accessPlan.expires_at).getTime() > Date.now());
  if (!planActive) redirect("/dashboard?readOnly=1");

  const submittedId = readFormText(formData, "id", 36, true);
  if (!submittedId || !isValidUuid(submittedId)) redirect("/dashboard?readOnly=1");
  const id = submittedId;
  const { data: existingPage } = await supabase.from("landing_pages").select("template,logo_url,sections").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!existingPage || (existingPage.template === "vip" && accessPlan?.plan_type !== "vip" && accessPlan?.plan_type !== "trial")) redirect("/dashboard?readOnly=1");
  const validated = validateLandingPageFormData(formData, maxGalleryImages, true);
  if (!validated) redirect(`/pages/${encodeURIComponent(id)}/edit?error=length`);

  const {
    business_name, headline, description, seo_title, seo_description,
    phone, phone2, whatsapp, logo_url, instagram_url, facebook_url,
    tiktok_url, youtube_url, custom_links, template, theme, sections,
  } = validated;

  let promoted: { value: { logo_url: string; sections: typeof sections }; uploadedPaths: string[] };
  try {
    promoted = await promoteStagedLandingImages({ logo_url, sections }, user.id, id, { maxImageBytes: maxGalleryImageMb * 1024 * 1024 });
  } catch (promotionError) {
    console.error("Landing image promotion failed:", promotionError instanceof Error ? promotionError.message : "unknown");
    redirect(`/pages/${encodeURIComponent(id)}/edit?error=save`);
  }

  const { data, error } = await supabase.from("landing_pages").update({
    business_name, headline, description, seo_title, seo_description, phone, whatsapp,
    logo_url: promoted.value.logo_url, instagram_url, facebook_url, tiktok_url, youtube_url, custom_links,
    template, theme, sections: promoted.value.sections, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("user_id", user.id).select("slug").single();

  if (error || !data) {
    await removePromotedLandingImages(promoted.uploadedPaths);
    console.error("Landing page update failed:", error?.message);
    redirect(`/pages/${encodeURIComponent(id)}/edit?error=save`);
  }

  await cleanupLandingPageImages([existingPage]);
  revalidatePath("/dashboard");
  revalidatePath(`/p/${data.slug}`);
  redirect(`/p/${data.slug}?updated=1`);
}


export async function deletePendingLandingImage(url: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || typeof url !== "string" || url.length > 2048 || !isValidWebUrl(url, true)) return { ok: false };
  const ok = await cleanupPendingLandingPageImage(url, user.id);
  return { ok };
}
