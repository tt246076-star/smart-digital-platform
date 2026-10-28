import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VIPShopTemplate from "@/components/VIPShopTemplate";
import VIPSalonTemplate from "@/components/VIPSalonTemplate";

export default async function PublicVIPPage({params}:{params:{slug:string}}) {
  const supabase = await createClient();
  const {data:page} = await supabase.from("landing_pages").select("slug,sections,is_published").eq("slug",params.slug).eq("is_published",true).maybeSingle();
  const sections = page?.sections && typeof page.sections === "object" ? page.sections as Record<string,any> : {};
  if (!page || !sections.vip_card) notFound();
  return sections.vip_card.layout === "salon" ? <VIPSalonTemplate shop={sections.vip_card} /> : <VIPShopTemplate shop={sections.vip_card} />;
}
