import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPageAnalytics from "@/components/LandingPageAnalytics";

const themes: Record<string, { main: string; soft: string; dark: string; gradient: string }> = {
  violet: { main: "#7c3aed", soft: "#f5f3ff", dark: "#1e1b4b", gradient: "linear-gradient(120deg,#7c3aed,#312e81)" },
  ocean: { main: "#0284c7", soft: "#f0f9ff", dark: "#082f49", gradient: "linear-gradient(120deg,#0284c7,#0f172a)" },
  sunset: { main: "#ea580c", soft: "#fff7ed", dark: "#431407", gradient: "linear-gradient(120deg,#f97316,#be123c)" },
  emerald: { main: "#059669", soft: "#ecfdf5", dark: "#022c22", gradient: "linear-gradient(120deg,#059669,#064e3b)" },
  rose: { main: "#e11d48", soft: "#fff1f2", dark: "#4c0519", gradient: "linear-gradient(120deg,#e11d48,#881337)" },
};

function socialLinks(page: any) {
  return [
    { label: "WhatsApp", url: page.whatsapp ? `https://wa.me/${page.whatsapp.replace(/\D/g, "")}` : "" },
    { label: "Instagram", url: page.instagram_url }, { label: "Facebook", url: page.facebook_url },
    { label: "TikTok", url: page.tiktok_url }, { label: "YouTube", url: page.youtube_url },
    ...(Array.isArray(page.custom_links) ? page.custom_links : []),
  ].filter((link) => link.url);
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: page } = await supabase.from("landing_pages")
    .select("business_name, headline, seo_title, seo_description, description")
    .eq("slug", params.slug).eq("is_published", true).maybeSingle();
  if (!page) return { title: "صفحة غير موجودة | بطاقاتي" };
  const title = page.seo_title?.trim() || page.headline?.trim() || page.business_name;
  const description = page.seo_description?.trim() || page.description?.trim() || `تعرّف على ${page.business_name} وتواصل معنا عبر بطاقاتي.`;
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function PublicLandingPage({ params, searchParams }: {
  params: { slug: string }; searchParams?: { updated?: string };
}) {
  const supabase = await createClient();
  const { data: page } = await supabase.from("landing_pages")
    .select("id, business_name, headline, description, phone, whatsapp, logo_url, instagram_url, facebook_url, tiktok_url, youtube_url, custom_links, is_published, template, theme, seo_title, seo_description")
    .eq("slug", params.slug).eq("is_published", true).maybeSingle();
  if (!page) notFound();

  const links = socialLinks(page);
  const theme = themes[page.theme || "violet"] || themes.violet;
  const template = page.template || "aurora";
  const isMinimal = template === "minimal";
  const isBold = template === "bold";
  const isStore = template === "store";

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-16" style={{ background: isBold ? theme.dark : theme.soft }}>
      <LandingPageAnalytics slug={params.slug} />
      {!isMinimal && <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: theme.main }} />}
      {!isMinimal && <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: theme.main }} />}
      <div className={`relative mx-auto overflow-hidden ${isStore ? "max-w-3xl rounded-2xl" : "max-w-2xl rounded-[2rem]"} ${isBold ? "border-2 shadow-2xl" : "border shadow-xl"}`} style={{ borderColor: theme.main + "35", background: "#fff", animation: "landingEnter .65s ease-out both" }}>
        <div className="h-2" style={{ background: isMinimal ? theme.main : theme.gradient }} />
        <section className={`px-6 pb-9 pt-10 text-center sm:px-12 sm:pb-12 ${isStore ? "sm:pt-8" : "sm:pt-12"}`}>
          {page.logo_url ? <img src={page.logo_url} alt={page.business_name} className={`mx-auto mb-5 object-cover shadow-md ${isStore ? "h-20 w-20 rounded-xl" : "h-24 w-24 rounded-3xl"}`} /> :
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl text-4xl font-black text-white shadow-lg" style={{ background: theme.gradient }}>{page.business_name.slice(0, 1)}</div>}
          <p className="text-xs font-black tracking-[0.18em]" style={{ color: theme.main }}>{isStore ? "متجر رسمي" : "أهلًا بكم في"}</p>
          <h1 className={`mt-3 font-black tracking-tight ${isBold ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"}`} style={{ color: isBold ? theme.dark : theme.dark }}>{page.business_name}</h1>
          {page.headline && <p className="mx-auto mt-4 max-w-xl text-lg font-extrabold leading-8 sm:text-xl" style={{ color: theme.main }}>{page.headline}</p>}
          {page.description && <p className="mx-auto mt-5 max-w-xl whitespace-pre-wrap text-sm leading-8 text-slate-600 sm:text-base">{page.description}</p>}
          {page.phone && <a data-track-event="contact" href={`tel:${page.phone}`} className="mt-7 inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 font-black text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-auto sm:min-w-64" style={{ background: theme.gradient }}>اتصل بنا · {page.phone}</a>}
          {links.length > 0 && <div className={`mx-auto mt-4 grid max-w-lg gap-3 ${isStore ? "sm:grid-cols-2" : "grid-cols-1"}`}>
            {links.map((link: { label: string; url: string }, index: number) => <a data-track-event="contact" key={`${link.label}-${index}`} href={link.url} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-2xl border px-5 py-4 text-right text-sm font-extrabold transition duration-300 hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: theme.main + "30", color: theme.dark, background: index === 0 ? theme.soft : "#fff" }}><span>{link.label}</span><span className="transition-transform group-hover:-translate-x-1" style={{ color: theme.main }}>↗</span></a>)}
          </div>}
          <div className="mx-auto mt-8 h-px max-w-xs" style={{ background: theme.main + "25" }} />
          <p className="mt-5 text-xs font-medium text-slate-400">صُنعت هذه الصفحة باستخدام بطاقاتي ✦</p>
        </section>
      </div>
      <style>{`@keyframes landingEnter { from { opacity: 0; transform: translateY(18px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } } @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`}</style>
    </main>
  );
}
