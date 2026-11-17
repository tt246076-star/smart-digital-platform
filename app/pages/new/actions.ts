"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { promoteStagedLandingImages, removePromotedLandingImages } from "@/lib/server/landing-image-staging";
import { validateLandingPageFormData } from "@/lib/server/input-validation";

export async function createLandingPage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: accessPlan } = await supabase.from("user_access_plans")
    .select("plan_type, expires_at").eq("user_id", user.id).maybeSingle();
  const planActive = !!accessPlan && (!accessPlan.expires_at || new Date(accessPlan.expires_at).getTime() > Date.now());
  if (!planActive) redirect("/pages/new?error=trial");

  const { count: currentPages, error: countError } = await supabase.from("landing_pages")
    .select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("template", "vip");
  const { data: pageTypeLimit, error: pageTypeLimitError } = await supabase.from("user_page_type_limits").select("normal_max_pages").eq("user_id", user.id).maybeSingle();
  const { data: galleryLimit } = await supabase.from("user_gallery_limits").select("normal_max_images,normal_max_image_mb").eq("user_id", user.id).maybeSingle();
  const maxGalleryImages = Math.max(0, Math.min(100, galleryLimit?.normal_max_images ?? 2));
  const maxGalleryImageMb = Math.max(0.1, Math.min(20, Number(galleryLimit?.normal_max_image_mb ?? 2)));
  const maxNormalPages = accessPlan.plan_type === "trial" ? 1 : pageTypeLimit?.normal_max_pages ?? 1;
  if (countError || pageTypeLimitError || (currentPages ?? 0) >= maxNormalPages) redirect("/pages/new?error=limit");

  const validated = validateLandingPageFormData(formData, maxGalleryImages, false);
  if (!validated) redirect("/pages/new?error=length");

  const {
    business_name, headline, description, seo_title, seo_description,
    phone, phone2, whatsapp, logo_url, instagram_url, facebook_url,
    tiktok_url, youtube_url, custom_links, template, theme, sections,
  } = validated;

  const slug = `${business_name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 35) || "page"}-${crypto.randomUUID().slice(0, 8)}`;
  const pageId = crypto.randomUUID();
  let promoted: { value: { logo_url: string; sections: typeof sections }; uploadedPaths: string[] };
  try {
    promoted = await promoteStagedLandingImages({ logo_url, sections }, user.id, pageId, { maxImageBytes: maxGalleryImageMb * 1024 * 1024 });
  } catch (promotionError) {
    console.error("Landing image promotion failed:", promotionError instanceof Error ? promotionError.message : "unknown");
    redirect("/pages/new?error=save");
  }

  const { data, error } = await supabase.from("landing_pages").insert({
    id: pageId,
    user_id: user.id, slug, business_name, headline, description, seo_title, seo_description, phone, whatsapp, logo_url: promoted.value.logo_url,
    instagram_url, facebook_url, tiktok_url, youtube_url, custom_links, template, theme,
    sections: promoted.value.sections, is_published: true,
  }).select("id").single();

  if (error || !data) {
    await removePromotedLandingImages(promoted.uploadedPaths);
    console.error("Landing page creation failed:", error?.message);
    redirect("/pages/new?error=save");
  }
  revalidatePath("/dashboard");
  redirect("/dashboard?created=1");
}
