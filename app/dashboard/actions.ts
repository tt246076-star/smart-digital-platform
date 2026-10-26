"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function duplicateLandingPage(formData: FormData) {
  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  if (!id) redirect("/dashboard");
  const { data: accessPlan } = await supabase.from("user_access_plans").select("plan_type, expires_at, max_pages").eq("user_id", user.id).maybeSingle();
  const planActive = !!accessPlan && (!accessPlan.expires_at || new Date(accessPlan.expires_at).getTime() > Date.now());
  if (!planActive || accessPlan.plan_type === "trial" || (accessPlan.max_pages ?? 0) < 1) redirect("/dashboard?duplicateLimit=1");
  const { count: currentPages, error: countError } = await supabase
    .from("landing_pages").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const { data: pageLimit } = await supabase.from("user_page_limits").select("max_pages").eq("user_id", user.id).maybeSingle();
  const maxPages = Math.min(pageLimit?.max_pages ?? 1, accessPlan?.max_pages ?? 0);
  if (countError || (currentPages ?? 0) >= maxPages) redirect("/dashboard?duplicateLimit=1");

  const { data: source } = await supabase.from("landing_pages")
    .select("business_name, headline, description, phone, whatsapp, logo_url, instagram_url, facebook_url, tiktok_url, youtube_url, custom_links, template, theme, seo_title, seo_description, sections")
    .eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!source) redirect("/dashboard?duplicateError=1");

  const newSlug = `${source.business_name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "page"}-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await supabase.from("landing_pages").insert({
    ...source,
    user_id: user.id,
    slug: newSlug,
    business_name: `${source.business_name} - نسخة`.slice(0, 100),
    is_published: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("Duplicate landing page failed:", error.message);
    redirect("/dashboard?duplicateError=1");
  }
  revalidatePath("/dashboard");
  redirect("/dashboard?duplicated=1");
}
