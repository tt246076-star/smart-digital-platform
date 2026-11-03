import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VIPShopTemplate from "@/components/VIPShopTemplate";
import VIPSalonTemplate from "@/components/VIPSalonTemplate";

export default async function PublicVIPPage({params}:{params:Promise<{slug:string}>}) {
 const {slug} = await params;
  const supabase = await createClient();
  const {data:page} = await supabase.from("landing_pages").select("slug,user_id,sections,is_published").eq("slug",slug).eq("is_published",true).maybeSingle();
  const sections = page?.sections && typeof page.sections === "object" ? page.sections as Record<string,any> : {};
  if (!page || !sections.vip_card) notFound();
  const {data:plan} = await supabase.from("user_access_plans").select("plan_type,expires_at").eq("user_id",page.user_id).maybeSingle();
  if (!plan || !["trial","vip"].includes(plan.plan_type) || (plan.expires_at && new Date(plan.expires_at).getTime() <= Date.now())) notFound();
  return sections.vip_card.layout === "salon" ? <VIPSalonTemplate shop={sections.vip_card} /> : <VIPShopTemplate shop={sections.vip_card} />;
}
