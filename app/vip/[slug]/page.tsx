import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VIPShopTemplate from "@/components/VIPShopTemplate";

export default async function PublicVIPPage({params}:{params:{slug:string}}) {
  const supabase = await createClient();
  const {data:page} = await supabase.from("landing_pages").select("slug,sections,is_published").eq("slug",params.slug).eq("is_published",true).maybeSingle();
  const sections = page?.sections && typeof page.sections === "object" ? page.sections as Record<string,any> : {};
  if (!page || !sections.vip_card) notFound();
  return <VIPShopTemplate shop={sections.vip_card} />;
}
