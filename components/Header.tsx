import Link from "next/link";
import { SITE } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import SiteHeaderControls from "@/components/SiteHeaderControls";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.email?.trim().toLowerCase() === "tt246076@gmail.com";

  return (
    <header className="site-main-header">
      <div className="site-main-header-inner" dir="rtl">
        <SiteHeaderControls isLoggedIn={!!user} isAdmin={isAdmin} />
        <Link href={user ? "/dashboard" : "/"} className="site-brand" aria-label={SITE.name}>
          <img src="/brand/bitakaty-mark.svg" alt="" className="site-brand-mark" />
          <span>{SITE.name}</span>
        </Link>
        <span className="site-header-balance" aria-hidden="true" />
      </div>
    </header>
  );
}
