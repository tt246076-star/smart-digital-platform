"import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPageAnalytics from "@/components/LandingPageAnalytics";

const themes: Record<string, { main: string; soft: string; dark: string; gradient: string }> = {
  violet: { main: "#d6b15e", soft: "#15130f", dark: "#f7f0df", gradient: "linear-gradient(135deg,#f2d58a,#a77a25)" },
  ocean: { main: "#d6b15e", soft: "#15130f", dark: "#f7f0df", gradient: "linear-gradient(135deg,#f2d58a,#a77a25)" },
  sunset: { main: "#d6b15e", soft: "#15130f", dark: "#f7f0df", gradient: "linear-gradient(135deg,#f2d58a,#a77a25)" },
  emerald: { main: "#d6b15e", soft: "#15130f", dark: "#f7f0df", gradient: "linear-gradient(135deg,#f2d58a,#a77a25)" },
  rose: { main: "#d6b15e", soft: "#15130f", dark: "#f7f0df", gradient: "linear-gradient(135deg,#f2d58a,#a77a25)" },
  midnight: { main: "#d6b15e", soft: "#15130f", dark: "#f7f0df", gradient: "linear-gradient(135deg,#f2d58a,#a77a25)" },
  gold: { main: "#d6b15e", soft: "#15130f", dark: "#f7f0df", gradient: "linear-gradient(135deg,#f2d58a,#a77a25)" },
  mint: { main: "#d6b15e", soft: "#15130f", dark: "#f7f0df", gradient: "linear-gradient(135deg,#f2d58a,#a77a25)" },
  berry: { main: "#d6b15e", soft: "#15130f", dark: "#f7f0df", gradient: "linear-gradient(135deg,#f2d58a,#a77a25)" },
  slate: { main: "#d6b15e", soft: "#15130f", dark: "#f7f0df", gradient: "linear-gradient(135deg,#f2d58a,#a77a25)" },
};

function socialLinks(page: any) {
  return [
    { label: "WhatsApp", url: page.whatsapp ? `https://wa.me/${page.whatsapp.replace(/\\D/g, "")}` : "" },
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

export default async function PublicLandingPage({ params }: {
  params: { slug: string }; searchParams?: { updated?: string };
}) {
  const supabase = await createClient();
  const { data: page } = await supabase.from("landing_pages")
    .select("id, business_name, headline, description, phone, whatsapp, logo_url, instagram_url, facebook_url, tiktok_url, youtube_url, custom_links, is_published, template, theme, seo_title, seo_description, sections")
    .eq("slug", params.slug).eq("is_published", true).maybeSingle();
  if (!page) notFound();

  const links = socialLinks(page);
  const sections = (page.sections && typeof page.sections === "object" ? page.sections : {}) as {address?:string;map_url?:string;hours?:string;round_image_url?:string;cover_image_url?:string;products?:{name:string;price:string;image_url:string;description:string}[]};
  const products = Array.isArray(sections.products) ? sections.products : [];
  const theme = themes[page.theme || "gold"] || themes.gold;
  const isStore = page.template === "store" || page.template === "restaurant";

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-[#090909] px-4 py-8 text-[#f7f0df] sm:px-6 sm:py-14">
      <LandingPageAnalytics slug={params.slug} />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-[#b88932]/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[#b88932]/10 blur-3xl" />
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-[#c6a45a]/35 bg-[#10100f] shadow-[0_30px_100px_rgba(0,0,0,.55)]">
        <div className="h-1.5 bg-gradient-to-l from-[#f4df9b] via-[#c6a45a] to-[#72501b]" />
        {sections.cover_image_url && <div className="relative h-48 sm:h-72"><img src={sections.cover_image_url} alt={page.business_name + " صورة الغلاف"} className="h-full w-full object-cover opacity-90" /><div className="absolute inset-0 bg-gradient-to-t from-[#10100f] via-transparent to-black/10" /></div>}
        <section className="px-5 pb-8 pt-8 text-center sm:px-12 sm:pb-12 sm:pt-10">
          <div className="mx-auto mb-6 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-[#c6a45a]/70" />
            <span className="text-[10px] font-black tracking-[.35em] text-[#d9bd76]">بطاقاتي · B I T A Q A T I</span>
            <span className="h-px w-10 bg-[#c6a45a]/70" />
          </div>
          {sections.round_image_url ? <img src={sections.round_image_url} alt={page.business_name} className="mx-auto mb-5 h-28 w-28 rounded-full border-2 border-[#d9bd76] object-cover p-1 shadow-[0_0_35px_rgba(198,164,90,.15)]" /> : page.logo_url ? <img src={page.logo_url} alt={page.business_name} className="mx-auto mb-5 h-24 w-24 rounded-2xl border border-[#c6a45a]/50 bg-black object-cover p-1 shadow-lg" /> :
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-2xl border border-[#d9bd76]/70 bg-gradient-to-br from-[#f2d58a] to-[#8d6523] text-4xl font-black text-[#17120a] shadow-[0_0_40px_rgba(198,164,90,.15)]">{page.business_name.slice(0, 1)}</div>}
          <p className="text-xs font-bold tracking-[.15em] text-[#c6a45a]">{isStore ? "المتجر الرسمي" : "مرحبًا بكم"}</p>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#fff8e8] sm:text-5xl">{page.business_name}</h1>
          {page.headline && <p className="mx-auto mt-4 max-w-xl text-base font-bold leading-8 text-[#d9bd76] sm:text-xl">{page.headline}</p>}
          {page.description && <p className="mx-auto mt-5 max-w-xl whitespace-pre-wrap text-sm leading-8 text-[#c7c0b1] sm:text-base">{page.description}</p>}
          {page.phone && <a data-track-event="contact" href={`tel:${page.phone}`} className="mt-7 inline-flex w-full items-center justify-center rounded-xl border border-[#f4df9b] bg-gradient-to-l from-[#f2d58a] to-[#b88932] px-6 py-4 font-black text-[#17120a] shadow-[0_8px_30px_rgba(184,137,50,.18)] transition hover:-translate-y-0.5 hover:brightness-110 sm:w-auto sm:min-w-64">اتصل بنا <span className="mx-2 text-lg">☎</span>{page.phone}</a>}
          {links.length > 0 && <div className="mx-auto mt-5 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            {links.map((link: { label: string; url: string }, index: number) => {
              const label = link.label.toLowerCase();
              const icon = label.includes("whatsapp") ? "◉" : label.includes("instagram") ? "◎" : label.includes("facebook") ? "f" : label.includes("tiktok") ? "♪" : label.includes("youtube") ? "▶" : label.includes("اتصل") ? "☎" : "↗";
              return <a data-track-event="contact" key={`${link.label}-${index}`} href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.label} className="group flex items-center gap-3 rounded-xl border border-[#c6a45a]/25 bg-[#171613] px-4 py-3.5 text-right text-sm font-bold text-[#f6edda] transition duration-300 hover:-translate-y-0.5 hover:border-[#d9bd76] hover:bg-[#211d14]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#c6a45a]/50 bg-[#c6a45a]/10 text-lg font-black text-[#e2c575]">{icon}</span>
                <span className="flex-1">{link.label}</span><span className="text-[#c6a45a] transition-transform group-hover:-translate-x-1">↗</span>
              </a>;
            })}
          </div>}
          {sections.address && <section className="mx-auto mt-7 max-w-xl rounded-xl border border-[#c6a45a]/25 bg-[#171613] p-5 text-right">
            <h2 className="font-black text-[#e2c575]">📍 عنوان المحل</h2><p className="mt-2 text-sm leading-7 text-[#c7c0b1]">{sections.address}</p>
            {sections.map_url && <a href={sections.map_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-lg bg-[#c6a45a] px-4 py-2 text-sm font-black text-[#17120a]">🗺️ افتح الموقع على الخريطة</a>}
          </section>}
          {sections.hours && <section className="mx-auto mt-4 max-w-xl rounded-xl border border-[#c6a45a]/25 p-5 text-right">
            <h2 className="font-black text-[#e2c575]">🕒 أوقات العمل</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#c7c0b1]">{sections.hours}</p>
          </section>}
          {products.length > 0 && <section className="mx-auto mt-9 max-w-3xl text-right">
            <div className="mb-5 flex items-center gap-3"><span className="h-px flex-1 bg-[#c6a45a]/25" /><h2 className="whitespace-nowrap text-xl font-black text-[#f4df9b] sm:text-2xl">كتالوج المنتجات</h2><span className="h-px flex-1 bg-[#c6a45a]/25" /></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((product,i)=><article key={i} className="overflow-hidden rounded-xl border border-[#c6a45a]/25 bg-[#171613] text-right transition hover:-translate-y-1 hover:border-[#d9bd76]/70 hover:shadow-[0_15px_40px_rgba(0,0,0,.25)]">
              {product.image_url ? <img src={product.image_url} alt={product.name || "صورة المنتج"} className="h-44 w-full object-cover" /> : <div className="flex h-36 items-center justify-center bg-[#211d14] text-4xl">🛍️</div>}
              <div className="p-4">{product.name && <h3 className="font-black text-[#fff8e8]">{product.name}</h3>}{product.description && <p className="mt-2 text-sm leading-6 text-[#c7c0b1]">{product.description}</p>}{product.price && <p className="mt-3 text-lg font-black text-[#e2c575]">{product.price} دج</p>}
              {page.phone && <a href={`tel:${page.phone}`} className="mt-3 inline-flex w-full justify-center rounded-lg bg-gradient-to-l from-[#f2d58a] to-[#b88932] px-4 py-3 text-sm font-black text-[#17120a]">اطلب / استفسر</a>}</div>
            </article>)}</div>
          </section>}
          <div className="mx-auto mt-9 h-px max-w-xs bg-gradient-to-l from-transparent via-[#c6a45a]/50 to-transparent" />
          <p className="mt-5 text-xs font-medium text-[#8f8778]">صُنعت هذه الصفحة باستخدام <span className="font-bold text-[#c6a45a]">بطاقاتي</span> ✦</p>
        </section>
      </div>
      <p className="relative mt-5 text-center text-[10px] tracking-widest text-[#746b5a]">ELEGANCE IN EVERY DETAIL</p>
      <style>{`@media (prefers-reduced-motion: no-preference) { main > div:nth-of-type(3) { animation: cardEnter .7s ease-out both; } } @keyframes cardEnter { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } } @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`}</style>
    </main>
  );
}
