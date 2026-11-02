"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function cleanUrl(value: FormDataEntryValue | null) {
  const input = String(value || "").trim();
  if (!input) return "";
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export async function createLandingPage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: accessPlan } = await supabase.from("user_access_plans")
    .select("plan_type, expires_at, max_pages").eq("user_id", user.id).maybeSingle();
  const planActive = !!accessPlan && (!accessPlan.expires_at || new Date(accessPlan.expires_at).getTime() > Date.now());
  if (!planActive || accessPlan.plan_type === "trial" || (accessPlan.max_pages ?? 0) < 1) redirect("/pages/new?error=trial");

  const { count: currentPages, error: countError } = await supabase.from("landing_pages")
    .select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const { data: pageLimit } = await supabase.from("user_page_limits").select("max_pages").eq("user_id", user.id).maybeSingle();
  const { data: galleryLimit } = await supabase.from("user_gallery_limits").select("normal_max_images").eq("user_id", user.id).maybeSingle();
  const maxGalleryImages = Math.max(0, Math.min(100, galleryLimit?.normal_max_images ?? 2));
  const maxPages = Math.min(pageLimit?.max_pages ?? 1, accessPlan?.max_pages ?? 0);
  if (countError || (currentPages ?? 0) >= maxPages) redirect("/pages/new?error=limit");

  const business_name = String(formData.get("business_name") || "").trim();
  const headline = String(formData.get("headline") || "").trim();
  const seo_title = String(formData.get("seo_title") || "").trim().slice(0, 60);
  const seo_description = String(formData.get("seo_description") || "").trim().slice(0, 160);
  const description = String(formData.get("description") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const logo_url = cleanUrl(formData.get("logo_url"));
  const instagram_url = cleanUrl(formData.get("instagram_url"));
  const facebook_url = cleanUrl(formData.get("facebook_url"));
  const tiktok_url = cleanUrl(formData.get("tiktok_url"));
  const youtube_url = cleanUrl(formData.get("youtube_url"));
  const customLabel = String(formData.get("custom_label") || "").trim().slice(0, 40);
  const customUrl = cleanUrl(formData.get("custom_url"));
  const custom_links = customLabel && customUrl ? [{ label: customLabel, url: customUrl }] : [];
  const allowedTemplates = ["profile","aurora","store","minimal","bold","beauty","agency","restaurant","portfolio"]
  const allowedThemes = ["violet","ocean","sunset","emerald","rose","midnight","gold","mint","berry","slate"];
  const requestedTemplate = String(formData.get("template") || "aurora");
  const requestedTheme = String(formData.get("theme") || "violet");
  const template = allowedTemplates.includes(requestedTemplate) ? requestedTemplate : "aurora";
  const theme = allowedThemes.includes(requestedTheme) ? requestedTheme : "violet";

  const cleanSectionUrl = (value: unknown) => {
    try { const url = new URL(String(value || "")); return ["https:","http:"].includes(url.protocol) ? url.toString() : ""; }
    catch { return ""; }
  };
  let submittedSections: Record<string, any> = {};
  try {
    const parsed = JSON.parse(String(formData.get("sections") || "{}"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) submittedSections = parsed;
  } catch { submittedSections = {}; }
  const cleanGalleryUrl = (value: unknown) => cleanSectionUrl(value);
  const gallery = Array.isArray(submittedSections.gallery) ? submittedSections.gallery.slice(0, maxGalleryImages).map(cleanGalleryUrl).filter(Boolean) : [];
  if (Array.isArray(submittedSections.gallery) && submittedSections.gallery.length > maxGalleryImages) redirect("/pages/new?error=gallery_limit");

  const sections = {
    address: String(submittedSections.address || "").trim().slice(0,200),
    map_url: cleanSectionUrl(submittedSections.map_url),
    google_review_url: cleanSectionUrl(submittedSections.google_review_url),
    hours: String(submittedSections.hours || "").trim().slice(0,1000),
    card_color: /^#[0-9a-fA-F]{6}$/.test(String(submittedSections.card_color || "")) ? String(submittedSections.card_color) : "#ffffff",
    accent_color: /^#[0-9a-fA-F]{6}$/.test(String(submittedSections.accent_color || "")) ? String(submittedSections.accent_color) : "",
    panel_color: /^#[0-9a-fA-F]{6}$/.test(String(submittedSections.panel_color || "")) ? String(submittedSections.panel_color) : "#f8fafc",
    page_background_color: /^#[0-9a-fA-F]{6}$/.test(String(submittedSections.page_background_color || "")) ? String(submittedSections.page_background_color) : "#ffffff",
    text_color: /^#[0-9a-fA-F]{6}$/.test(String(submittedSections.text_color || "")) ? String(submittedSections.text_color) : "#111827",
    button_color: /^#[0-9a-fA-F]{6}$/.test(String(submittedSections.button_color || "")) ? String(submittedSections.button_color) : "#334155",
    theme_primary: /^#[0-9a-fA-F]{6}$/.test(String(submittedSections.theme_primary || "")) ? String(submittedSections.theme_primary) : "",
    theme_mode: ["light","dark"].includes(String(submittedSections.theme_mode || "")) ? String(submittedSections.theme_mode) : "",
    round_image_url: cleanSectionUrl(submittedSections.round_image_url),
    cover_image_url: cleanSectionUrl(submittedSections.cover_image_url),
    gallery,
  };

  if (!business_name || business_name.length > 100) redirect("/pages/new?error=name");
  if (headline.length > 140 || description.length > 1000 || phone.length > 30 || whatsapp.length > 30) redirect("/pages/new?error=length");

  const slug = `${business_name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 35) || "page"}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase.from("landing_pages").insert({
    user_id: user.id, slug, business_name, headline, description, seo_title, seo_description, phone, whatsapp, logo_url,
    instagram_url, facebook_url, tiktok_url, youtube_url, custom_links, template, theme,
    sections, is_published: true,
  }).select("id").single();

  if (error || !data) {
    console.error("Landing page creation failed:", error?.message);
    redirect("/pages/new?error=save");
  }
  revalidatePath("/dashboard");
  redirect("/dashboard?created=1");
}
