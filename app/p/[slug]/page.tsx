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
    { label: "واتساب", url: page.whatsapp ? `https://wa.me/${page.whatsapp.replace(/\\D/g, "")}` : "", kind: "whatsapp" },
    { label: "إنستغرام", url: page.instagram_url, kind: "instagram" },
    { label: "فيسبوك", url: page.facebook_url, kind: "facebook" },
    { label: "تيك توك", url: page.tiktok_url, kind: "tiktok" },
    { label: "يوتيوب", url: page.youtube_url, kind: "youtube" },
    ...(Array.isArray(page.custom_links) ? page.custom_links.map((x: any) => ({ ...x, kind: "custom" })) : []),
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
  const isBeauty = template === "beauty";
  const isMinimal = template === "minimal";
  const isBold = template === "bold";
  const isStore = template === "store" || isRestaurant;
  const displayImage = sections.round_image_url || page.logo_url;

  return (
    <main dir="rtl" className="min-h-screen bg-[#f5f7fb] px-3 py-4 text-slate-800 sm:px-6 sm:py-8" style={{ ["--brand" as any]: palette.accent, ["--brand-tint" as any]: palette.tint, ["--brand-ink" as any]: palette.ink }}>
      <LandingPageAnalytics slug={params.slug} />
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 flex items-center justify-between px-1">
          <a href="/" className="flex items-center gap-2 text-sm font-black text-slate-700"><span className="flex h-8 w-8 items-center justify-center rounded-xl text-sm text-white" style={{ background: palette.gradient }}>ب</span> بطاقاتي</a>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500">الصفحة الرسمية للنشاط</span>
        </header>

        <div className={`overflow-hidden border border-slate-200/80 bg-white shadow-[0_18px_70px_rgba(15,23,42,.08)] ${isMinimal ? "rounded-2xl" : "rounded-[1.75rem] sm:rounded-[2rem]"}`}>
          <section className="relative">
            {sections.cover_image_url ? (
              <div className={`relative overflow-hidden ${isRestaurant ? "h-56 sm:h-80" : "h-44 sm:h-64"}`}>
                <img src={sections.cover_image_url} alt={`غلاف ${page.business_name}`} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-5 right-5 left-5 sm:bottom-7 sm:right-8 sm:left-8">
                  <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-bold" style={{ color: palette.accent }}>{isRestaurant ? "قائمة المحل ومعلوماته" : isBeauty ? "الجمال يبدأ من هنا" : isStore ? "تسوّق واكتشف" : "مرحبًا بكم"}</span>
                  <h1 className="mt-3 text-2xl font-black text-white drop-shadow sm:text-4xl">{page.business_name}</h1>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden px-5 pb-7 pt-8 sm:px-10 sm:pb-10 sm:pt-10" style={{ background: isBold ? palette.gradient : palette.tint }}>
                {!isMinimal && <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-20 h-48 w-48 rounded-full border-[28px] border-white/30" />}
                <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-right">
                  {displayImage ? <img src={displayImage} alt={page.business_name} className="h-24 w-24 shrink-0 rounded-2xl border-4 border-white bg-white object-cover shadow-md sm:h-28 sm:w-28" /> :
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white text-4xl font-black text-white shadow-md sm:h-28 sm:w-28" style={{ background: palette.gradient }}>{page.business_name.slice(0, 1)}</div>}
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold" style={{ color: palette.accent }}>{isRestaurant ? "مطعم ومأكولات" : isBeauty ? "جمال وعناية" : isStore ? "المتجر الرسمي" : template === "agency" ? "خدمات احترافية" : "أهلًا وسهلًا بكم"}</span>
                    <h1 className={`mt-3 font-black leading-tight ${isBold ? "text-3xl text-white sm:text-5xl" : "text-3xl text-slate-900 sm:text-4xl"}`}>{page.business_name}</h1>
                    {page.headline && <p className={`mt-2 text-sm font-semibold leading-7 sm:text-base ${isBold ? "text-white/90" : "text-slate-600"}`}>{page.headline}</p>}
                  </div>
                </div>
              </div>
            )}
          </section>

          <div className="grid gap-8 px-4 py-6 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
            <div className="min-w-0">
              {page.description && <section className="mb-7">
                <h2 className="mb-2 flex items-center gap-2 text-lg font-black text-slate-900"><span className="h-5 w-1.5 rounded-full" style={{ background: palette.accent }} />نبذة عنّا</h2>
                <p className="whitespace-pre-wrap text-sm leading-8 text-slate-600 sm:text-base">{page.description}</p>
              </section>}

              {products.length > 0 && <section>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div><p className="text-xs font-bold" style={{ color: palette.accent }}>{isRestaurant ? "ماذا نقدّم؟" : "اختياراتنا لكم"}</p><h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">{isRestaurant ? "القائمة" : isStore ? "منتجات المحل" : "المنتجات والخدمات"}</h2></div>
                  <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ color: palette.accent, background: palette.tint }}>{products.length} {products.length === 1 ? "عنصر" : "عناصر"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {products.map((product, i) => <article key={i} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden" style={{ background: palette.tint }}>
                      {product.image_url ? <img src={product.image_url} alt={product.name || "صورة المنتج"} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]" /> : <div className="flex h-full items-center justify-center text-4xl" style={{ color: palette.accent }}>{isRestaurant ? "🍽️" : "🛍️"}</div>}
                      {product.price && <span className="absolute bottom-2 right-2 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-black shadow-sm" style={{ color: palette.accent }}>{product.price} دج</span>}
                    </div>
                    <div className="p-3 sm:p-4">
                      {product.name && <h3 className="line-clamp-2 font-black leading-6 text-slate-900">{product.name}</h3>}
                      {product.description && <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">{product.description}</p>}
                      {page.phone && <a data-track-event="contact" href={`tel:${page.phone}`} className="mt-3 flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-black text-white transition hover:opacity-90 sm:text-sm" style={{ background: palette.gradient }}>{isRestaurant ? "اتصل للطلب" : "استفسر عن المنتج"}</a>}
                      {!page.phone && page.whatsapp && <a data-track-event="contact" href={`https://wa.me/${page.whatsapp.replace(/\\D/g, "")}`} className="mt-3 flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-black text-white" style={{ background: palette.gradient }}>اطلب عبر واتساب</a>}
                    </div>
                  </article>)}
                </div>
              </section>}

              {products.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: palette.tint }}>✦</div>
                <h2 className="mt-3 font-black text-slate-800">{isRestaurant ? "أهلًا بكم في مطعمنا" : "يسعدنا تواصلكم معنا"}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">تواصلوا معنا لمعرفة المزيد عن خدماتنا.</p>
              </div>}
            </div>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <h2 className="mb-4 text-base font-black text-slate-900">تواصل معنا</h2>
                <div className="space-y-2.5">
                  {page.phone && <a data-track-event="contact" href={`tel:${page.phone}`} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-black text-white" style={{ background: palette.gradient }}><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-lg">☎</span><span>اتصال هاتفي<small className="block mt-0.5 font-medium text-white/80" dir="ltr">{page.phone}</small></span></a>}
                  {links.map((link: { label: string; url: string; kind?: string }, i: number) => <a data-track-event="contact" key={`${link.label}-${i}`} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-white">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg text-base font-black" style={{ background: palette.tint, color: palette.accent }}>{link.kind === "whatsapp" ? "◉" : link.kind === "instagram" ? "◎" : link.kind === "facebook" ? "f" : link.kind === "tiktok" ? "♪" : link.kind === "youtube" ? "▶" : "↗"}</span><span className="flex-1">{link.label}</span><span className="text-slate-400">↗</span>
                  </a>)}
                </div>
              </section>

              {sections.address && <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <h2 className="mb-2 flex items-center gap-2 font-black text-slate-900"><span style={{ color: palette.accent }}>⌖</span> عنوان المحل</h2>
                <p className="text-sm leading-7 text-slate-600">{sections.address}</p>
                {sections.map_url && <a href={sections.map_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-black" style={{ borderColor: palette.accent, color: palette.accent }}>افتح الخريطة ↗</a>}
              </section>}

              {sections.hours && <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <h2 className="mb-3 flex items-center gap-2 font-black text-slate-900"><span style={{ color: palette.accent }}>◷</span> أوقات العمل</h2>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{sections.hours}</p>
              </section>}
            </aside>
          </div>
        </div>

        <footer className="flex flex-col items-center justify-between gap-2 px-2 py-5 text-xs text-slate-400 sm:flex-row">
          <span>© {new Date().getFullYear()} {page.business_name}</span>
          <a href="/" className="font-bold transition hover:text-slate-600">صفحة منشأة عبر بطاقاتي</a>
        </footer>
      </div>
    </main>
  );
}
