import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPageAnalytics from "@/components/LandingPageAnalytics";

const palettes: Record<string, { accent: string; tint: string; ink: string; gradient: string }> = {
  violet: { accent: "#6d4aff", tint: "#f0ecff", ink: "#25164f", gradient: "linear-gradient(135deg,#8b5cf6,#5b35d5)" },
  ocean: { accent: "#087eaa", tint: "#e7f7fc", ink: "#103746", gradient: "linear-gradient(135deg,#19a7ce,#087eaa)" },
  sunset: { accent: "#e76b36", tint: "#fff1e9", ink: "#512714", gradient: "linear-gradient(135deg,#fb923c,#e34c43)" },
  emerald: { accent: "#16805d", tint: "#e7f7ef", ink: "#143b2c", gradient: "linear-gradient(135deg,#34b879,#087f5b)" },
  rose: { accent: "#d94678", tint: "#fff0f5", ink: "#55172e", gradient: "linear-gradient(135deg,#f472b6,#c02665)" },
  midnight: { accent: "#475569", tint: "#eef2f7", ink: "#172033", gradient: "linear-gradient(135deg,#64748b,#334155)" },
  gold: { accent: "#a97716", tint: "#fff8e5", ink: "#44300c", gradient: "linear-gradient(135deg,#e8bd56,#a97716)" },
  mint: { accent: "#0f9488", tint: "#e6faf6", ink: "#123f3b", gradient: "linear-gradient(135deg,#5eead4,#0f9488)" },
  berry: { accent: "#9333a8", tint: "#faedff", ink: "#42134c", gradient: "linear-gradient(135deg,#c084fc,#9333a8)" },
  slate: { accent: "#475569", tint: "#f1f5f9", ink: "#1e293b", gradient: "linear-gradient(135deg,#94a3b8,#475569)" },
};

function socialLinks(page: any) {
  return [
    { label: "WhatsApp", url: page.whatsapp ? `https://wa.me/${page.whatsapp.replace(/\\D/g, "")}` : "", kind: "whatsapp" },
    { label: "Facebook", url: page.facebook_url, kind: "facebook" },
    { label: "Instagram", url: page.instagram_url, kind: "instagram" },
    { label: "TikTok", url: page.tiktok_url, kind: "tiktok" },
    { label: "YouTube", url: page.youtube_url, kind: "youtube" },
    ...(Array.isArray(page.custom_links) ? page.custom_links.map((x: any) => ({ ...x, kind: "custom" })) : []),
  ].filter((link) => link.url);
}

function SocialIcon({ kind }: { kind: string }) {
  const common = "flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white shadow-sm";
  if (kind === "facebook") return <span className={common} style={{ background: "#1877F2" }}>f</span>;
  if (kind === "whatsapp") return <span className={common} style={{ background: "#25D366" }}>◉</span>;
  if (kind === "instagram") return <span className={common} style={{ background: "linear-gradient(135deg,#833AB4,#FD1D1D,#FCAF45)" }}>◎</span>;
  if (kind === "tiktok") return <span className={common} style={{ background: "#111827" }}>♪</span>;
  if (kind === "youtube") return <span className={common} style={{ background: "#FF0033" }}>▶</span>;
  return <span className={common} style={{ background: "#64748b" }}>↗</span>;
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

export default async function PublicLandingPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: page } = await supabase.from("landing_pages")
    .select("id, business_name, headline, description, phone, whatsapp, logo_url, instagram_url, facebook_url, tiktok_url, youtube_url, custom_links, is_published, template, theme, seo_title, seo_description, sections")
    .eq("slug", params.slug).eq("is_published", true).maybeSingle();
  if (!page) notFound();

  const links = socialLinks(page);
  const sections = (page.sections && typeof page.sections === "object" ? page.sections : {}) as {
    address?: string; map_url?: string; hours?: string; round_image_url?: string; cover_image_url?: string;
    products?: { name: string; price: string; image_url: string; description: string }[];
  };
  const products = Array.isArray(sections.products) ? sections.products : [];
  const palette = palettes[page.theme || "violet"] || palettes.violet;
  const template = page.template || "aurora";
  const isRestaurant = template === "restaurant";
  const isStore = template === "store" || isRestaurant;
  const displayImage = sections.round_image_url || page.logo_url;
  const hasContact = !!(page.phone || links.length);

  return (
    <main dir="rtl" className="min-h-screen bg-[#f3f5fa] px-3 py-5 text-slate-800 sm:px-6 sm:py-8">
      <LandingPageAnalytics slug={params.slug} />
      <div className="mx-auto max-w-6xl">
        <nav className="mb-5 flex items-center justify-between px-1">
          <a href="/" className="flex items-center gap-2.5 text-sm font-black text-slate-700"><span className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm" style={{background:palette.gradient}}>ب</span> بطاقاتي</a>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500">الصفحة الرسمية</span>
        </nav>

        <article className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,.09)]">
          <header className="relative">
            {sections.cover_image_url ? <div className="relative h-56 sm:h-80">
              <img src={sections.cover_image_url} alt={`غلاف ${page.business_name}`} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
            </div> : <div className="h-24 sm:h-36" style={{background:`radial-gradient(circle at 15% 20%, #ffffffaa, transparent 25%), ${palette.gradient}`}} />}
            <div className="relative px-5 pb-6 sm:px-10 sm:pb-9">
              <div className="-mt-14 flex flex-col items-center gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
                {displayImage ? <img src={displayImage} alt={page.business_name} className="h-28 w-28 rounded-[1.7rem] border-[5px] border-white bg-white object-cover shadow-xl sm:h-36 sm:w-36" /> :
                  <div className="grid h-28 w-28 place-items-center rounded-[1.7rem] border-[5px] border-white text-4xl font-black text-white shadow-xl sm:h-36 sm:w-36" style={{background:palette.gradient}}>{page.business_name.slice(0,1)}</div>}
                <div className="min-w-0 flex-1 pb-1 text-center sm:text-right">
                  <div className="mb-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold" style={{background:palette.tint,color:palette.accent}}>{isRestaurant ? "مطعم ومأكولات" : isStore ? "المتجر الرسمي" : "مرحبًا بكم"}</div>
                  <h1 className="text-3xl font-black leading-tight text-slate-950 sm:text-4xl">{page.business_name}</h1>
                  {page.headline && <p className="mt-2 text-sm font-medium leading-7 text-slate-500 sm:text-base">{page.headline}</p>}
                </div>
                {page.phone && <a href={`tel:${page.phone}`} data-track-event="contact" className="inline-flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5" style={{background:palette.gradient}}><span className="text-xl">☎</span> اتصل الآن</a>}
              </div>
            </div>
          </header>

          {hasContact && <section className="border-y border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-10">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              {page.phone && <a href={`tel:${page.phone}`} data-track-event="contact" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-2xl text-emerald-700">☎</span><span className="text-right"><strong className="block text-sm text-slate-900">الهاتف</strong><small dir="ltr" className="mt-1 block text-slate-500">{page.phone}</small></span></a>}
              {links.map((link: {label:string;url:string;kind?:string},i:number)=><a key={link.label+i} data-track-event="contact" href={link.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><SocialIcon kind={link.kind || "custom"}/><span className="text-sm font-extrabold text-slate-700">{link.label}</span></a>)}
            </div>
          </section>}

          <div className="grid gap-8 px-5 py-7 sm:px-10 sm:py-10 lg:grid-cols-[minmax(0,1fr)_270px] lg:gap-10">
            <div className="min-w-0">
              {page.description && <section className="mb-9"><div className="mb-3 flex items-center gap-3"><span className="h-8 w-1.5 rounded-full" style={{background:palette.accent}}/><h2 className="text-xl font-black text-slate-950">من نحن</h2></div><p className="whitespace-pre-wrap text-sm leading-8 text-slate-600 sm:text-base">{page.description}</p></section>}
              <section>
                <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-black" style={{color:palette.accent}}>{isRestaurant ? "من قائمتنا" : "تعرّف على ما نقدّمه"}</p><h2 className="mt-1 text-2xl font-black text-slate-950">{isRestaurant ? "قائمة الطعام" : isStore ? "المنتجات" : "خدماتنا وأعمالنا"}</h2></div>{products.length>0 && <span className="rounded-full px-3 py-1.5 text-xs font-black" style={{background:palette.tint,color:palette.accent}}>{products.length} {products.length===1?"عنصر":"عناصر"}</span>}</div>
                {products.length ? <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                  {products.map((product,i)=><article key={i} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative aspect-[4/3] overflow-hidden" style={{background:palette.tint}}>
                      {product.image_url ? <img src={product.image_url} alt={product.name||"صورة المنتج"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : <div className="grid h-full place-items-center text-4xl" style={{color:palette.accent}}>{isRestaurant?"🍽️":"✦"}</div>}
                      {product.price && <span className="absolute bottom-3 right-3 rounded-xl bg-white px-3 py-2 text-xs font-black shadow-lg" style={{color:palette.accent}}>{product.price} دج</span>}
                    </div>
                    <div className="p-3.5 sm:p-5">{product.name && <h3 className="line-clamp-2 font-black leading-6 text-slate-900">{product.name}</h3>}{product.description && <p className="mt-2 line-clamp-3 text-xs leading-6 text-slate-500 sm:text-sm">{product.description}</p>}
                      {page.phone && <a href={`tel:${page.phone}`} data-track-event="contact" className="mt-4 flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black text-white sm:text-sm" style={{background:palette.gradient}}><span>☎</span> {isRestaurant?"اتصل للطلب":"اسأل عن المنتج"}</a>}
                    </div>
                  </article>)}
                </div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-2xl" style={{background:palette.tint,color:palette.accent}}>✦</span><h3 className="mt-4 font-black text-slate-900">مرحبًا بكم في {page.business_name}</h3><p className="mt-2 text-sm leading-7 text-slate-500">تواصلوا معنا لمعرفة المزيد عن منتجاتنا وخدماتنا.</p></div>}
              </section>
            </div>

            <aside className="space-y-4">
              {sections.address && <section className="rounded-3xl border border-slate-200 bg-white p-5"><span className="grid h-11 w-11 place-items-center rounded-xl text-xl" style={{background:palette.tint,color:palette.accent}}>⌖</span><h2 className="mt-4 font-black text-slate-900">زورونا</h2><p className="mt-2 text-sm leading-7 text-slate-600">{sections.address}</p>{sections.map_url && <a href={sections.map_url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-black" style={{borderColor:palette.accent,color:palette.accent}}>افتح الموقع على الخريطة ↗</a>}</section>}
              {sections.hours && <section className="rounded-3xl border border-slate-200 bg-white p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-xl text-amber-700">◷</span><h2 className="mt-4 font-black text-slate-900">أوقات العمل</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{sections.hours}</p></section>}
              <section className="rounded-3xl p-5 text-white" style={{background:palette.gradient}}><p className="text-xs font-bold text-white/75">يسعدنا تواصلكم</p><h2 className="mt-2 text-xl font-black">هل تحتاج إلى مساعدة؟</h2><p className="mt-2 text-sm leading-6 text-white/85">تواصل معنا مباشرة وسنكون سعداء بخدمتك.</p>{page.phone && <a href={`tel:${page.phone}`} data-track-event="contact" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black" style={{color:palette.accent}}>☎ اتصل بنا</a>}{page.whatsapp && <a href={`https://wa.me/${page.whatsapp.replace(/\\D/g,"")}`} data-track-event="contact" className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-black text-white">◉ واتساب</a>}</section>
            </aside>
          </div>
        </article>

        <footer className="flex flex-col items-center justify-between gap-2 px-2 py-6 text-xs text-slate-400 sm:flex-row"><span>© {new Date().getFullYear()} {page.business_name}</span><a href="/" className="font-bold transition hover:text-slate-600">صفحة منشأة عبر بطاقاتي</a></footer>
      </div>
    </main>
  );
}
