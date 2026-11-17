import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewLandingPageForm from "./NewLandingPageForm";

export const dynamic = "force-dynamic";

export default async function NewLandingPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data } = await supabase
    .from("user_gallery_limits")
    .select("normal_max_images,normal_max_image_mb")
    .eq("user_id", user.id)
    .maybeSingle();

  const initialGalleryLimit = {
    count: Math.max(0, Math.min(100, data?.normal_max_images ?? 2)),
    size: Math.max(0.1, Math.min(20, data?.normal_max_image_mb ?? 2)),
  };

  return <NewLandingPageForm initialGalleryLimit={initialGalleryLimit} />;
}
