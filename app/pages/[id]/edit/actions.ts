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

export async function updateLandingPage(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const business_name = String(formData.get("business_name") || "").trim();
  const headline = String(formData.get("headline") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();

  if (!business_name || business_name.length > 100) redirect(`/pages/${id}/edit?error=name`);
  if (headline.length > 140 || description.length > 1000 || phone.length > 30 || whatsapp.length > 30) {
    redirect(`/pages/${id}/edit?error=length`);
  }

  const { data: existing, error: lookupError } = await supabase
    .from("landing_pages")
    .select("slug")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (lookupError || !existing) redirect("/dashboard");

  const { error } = await supabase
    .from("landing_pages")
    .update({
      business_name,
      headline,
      description,
      phone,
      whatsapp,
      logo_url: safeUrl(formData.get("logo_url")),
      instagram_url: safeUrl(formData.get("instagram_url")),
      facebook_url: safeUrl(formData.get("facebook_url")),
      tiktok_url: safeUrl(formData.get("tiktok_url")),
      youtube_url: safeUrl(formData.get("youtube_url")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Landing page update failed:", error.message);
    redirect(`/pages/${id}/edit?error=save`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/p/${existing.slug}`);
  redirect(`/p/${existing.slug}?updated=1`);
}
