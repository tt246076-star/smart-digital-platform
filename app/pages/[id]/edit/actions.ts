"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function safeUrl(value: FormDataEntryValue | null) {
  const input = String(value || "").trim();
  if (!input) return "";
  try {
    const url = new URL(input);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export async function updateLandingPage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const id = String(formData.get("id") || "");
  const business_name = String(formData.get("business_name") || "").trim();
  const headline = String(formData.get("headline") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const seo_title = String(formData.get("seo_title") || "").trim().slice(0, 60);
  const seo_description = String(formData.get("seo_description") || "").trim().slice(0, 160);
  const phone = String(formData.get("phone") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const logo_url = safeUrl(formData.get("logo_url"));
  const instagram_url = safeUrl(formData.get("instagram_url"));
  const facebook_url = safeUrl(formData.get("facebook_url"));
  const tiktok_url = safeUrl(formData.get("tiktok_url"));
  const youtube_url = safeUrl(formData.get("youtube_url"));
  const customLabel = String(formData.get("custom_label") || "").trim().slice(0, 40);
  const customUrl = safeUrl(formData.get("custom_url"));
  const custom_links = customLabel && customUrl ? [{ label: customLabel, url: customUrl }] : [];
  const requestedTemplate = String(formData.get("template") || "aurora");
  const requestedTheme = String(formData.get("theme") || "violet");
  const template = ["aurora", "store", "minimal", "bold"].includes(requestedTemplate) ? requestedTemplate : "aurora";
  const theme = ["violet", "ocean", "sunset", "emerald", "rose"].includes(requestedTheme) ? requestedTheme : "violet";

  if (!id || !business_name || business_name.length > 100) redirect(`/pages/${encodeURIComponent(id)}/edit?error=name`);
  if (headline.length > 140 || description.length > 1000 || phone.length > 30 || whatsapp.length > 30) {
    redirect(`/pages/${encodeURIComponent(id)}/edit?error=length`);
  }

  const { data, error } = await supabase.from("landing_pages").update({
    business_name, headline, description, seo_title, seo_description, phone, whatsapp, logo_url,
    instagram_url, facebook_url, tiktok_url, youtube_url, custom_links,
    template, theme, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("user_id", user.id).select("slug").single();

  if (error || !data) {
    console.error("Landing page update failed:", error?.message);
    redirect(`/pages/${encodeURIComponent(id)}/edit?error=save`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/p/${data.slug}`);
  redirect(`/p/${data.slug}?updated=1`);
}
