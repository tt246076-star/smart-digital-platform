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


function readableSurface(hex: string, whiteRatio = 0.9) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "#ffffff";
  const n = hex.slice(1);
  const channels = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  const mixed = channels.map((c) => Math.round(c * (1 - whiteRatio) + 255 * whiteRatio));
  return "#" + mixed.map((c) => c.toString(16).padStart(2, "0")).join("");
}

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

function BrandMark({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    facebook: "M24 12a12 12 0 1 0-13.875 11.85v-8.38H7.08V12h3.045V9.35c0-3.005 1.79-4.665 4.53-4.665 1.31 0 2.68.235 2.68.235v2.95h-1.51c-1.49 0-1.955.925-1.955 1.875V12h3.325l-.53 3.47h-2.795v8.38A12.003 12.003 0 0 0 24 12",
    whatsapp: "M20.52 3.48A11.85 11.85 0 0 0 12.08 0C5.5 0 .15 5.34.15 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.28-1.65a11.9 11.9 0 0 0 5.8 1.48h.01C18.66 23.83 24 18.49 24 11.91c0-3.18-1.24-6.17-3.48-8.43ZM12.09 21.8a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.73.98.99-3.64-.24-.38a9.84 9.84 0 0 1-1.51-5.25c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.14 1.03 7.01 2.91a9.86 9.86 0 0 1 2.9 7.02c0 5.47-4.45 9.87-9.93 9.87Zm5.44-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z",
    instagram: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7Zm5 2.3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 2.2a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Zm5.7-3.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z",
    tiktok: "M19.6 6.4a5.7 5.7 0 0 1-3.5-1.2v8.2a6.3 6.3 0 1 1-5.4-6.2v3.4a3 3 0 1 0 2.1 2.8V0h3.4a5.7 5.7 0 0 0 3.4 3.4v3Z",
    youtube: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"
  };
  const bg: Record<string,string> = { facebook:"#1877F2", whatsapp:"#25D366", instagram:"linear-gradient(135deg,#833AB4 0%,#FD1D1D 55%,#FCAF45 100%)", tiktok:"#101010", youtube:"#FF0033" };
  return <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-200 group-hover:scale-105" style={{background:bg[kind] || "#64748b"}}>
    {paths[kind] ? <svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true" fill="currentColor"><path d={paths[kind]}/></svg> : <svg viewBox="0 0 24 24" width="25" height="25" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2h4a4 4 0 0 1 4 4v4M10 22H6a4 4 0 0 1-4-4v-4M22 2 12 12M2 22l7-7"/></svg>}
  </span>;
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
    address?: string; map_url?: string; hours?: string; card_color?: string; accent_color?: string; panel_color?: string; round_image_url?: string; cover_image_url?: string;
    products?: { name: string; price: string; image_url: string; description: string }[];
  };
  const products = Array.isArray(sections.products) ? sections.products : [];
  const basePalette = palettes[page.theme || "violet"] || palettes.violet;
  const customAccent = /^#[0-9a-fA-F]{6}$/.test(sections.accent_color || "") ? sections.accent_color! : basePalette.accent;
  const selectedPanel = /^#[0-9a-fA-F]{6}$/.test(sections.panel_color || "") ? sections.panel_color! : "#f8fafc";
  const customPanel = readableSurface(selectedPanel, 0.9);
  const palette = { ...basePalette, accent: customAccent, tint: customPanel, gradient: `linear-gradient(135deg,${customAccent},${basePalette.accent})` };
  const selectedCardBackground = /^#[0-9a-fA-F]{6}$/.test(sections.card_color || "") ? sections.card_color! : "#ffffff";
  const cardBackground = selectedCardBackground;
  const cardText = (() => { const h = selectedCardBackground.slice(1); const rgb = [0,2,4].map(i => parseInt(h.slice(i,i+2),16)); const luminance = rgb.map(v => { const x=v/255; return x<=0.04045?x/12.92:Math.pow((x+0.055)/1.055,2.4); }).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0); return luminance > 0.42 ? "#172033" : "#ffffff"; })();
  const cardMuted = cardText === "#ffffff" ? "#e2e8f0" : "#475569";
  const template = page.template || "aurora";
  const isRestaurant = template === "restaurant";
  const isStore = template === "store" || isRestaurant;
  const displayImage = sections.round_image_url || page.logo_url;
  const hasContact = !!(page.phone || links.length);
  let weeklyHours: Record<string, {open:boolean;from:string;to:string}> | null = null;
  try {
    const parsed = sections.hours ? JSON.parse(sections.hours) : null;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) weeklyHours = parsed;
  } catch {}
  const algiersNow = new Date();
  const algiersParts = new Intl.DateTimeFormat("en-GB", { weekday:"long", hour:"2-digit", minute:"2-digit", hourCycle:"h23", timeZone:"Africa/Algiers" }).formatToParts(algiersNow);
  const part = (type:string) => algiersParts.find((x) => x.type === type)?.value || "";
  const todayKey = part("weekday").toLowerCase();
  const todayHours = weeklyHours?.[todayKey];
  const currentMinute = Number(part("hour")) * 60 + Number(part("minute"));
  const minutesOf = (time:string) => {
    const match = /^(\d{2}):(\d{2})$/.exec(time || "");
    return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
  };
  const dayKeys = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const todayIndex = dayKeys.indexOf(todayKey);
  const previousKey = dayKeys[(todayIndex + 6) % 7];
  const todayStart = todayHours ? minutesOf(todayHours.from) : NaN;
  const todayEnd = todayHours ? minutesOf(todayHours.to) : NaN;
  const previousHours = weeklyHours?.[previousKey];
  const previousStart = previousHours ? minutesOf(previousHours.from) : NaN;
  const previousEnd = previousHours ? minutesOf(previousHours.to) : NaN;
  const openToday = !!todayHours?.open && Number.isFinite(todayStart) && Number.isFinite(todayEnd) && (todayStart === todayEnd ? false : todayStart < todayEnd ? currentMinute >= todayStart && currentMinute < todayEnd : currentMinute >= todayStart);
  const openFromYesterday = !!previousHours?.open && Number.isFinite(previousStart) && Number.isFinite(previousEnd) && previousStart > previousEnd && currentMinute < previousEnd;
  const isOpenNow = !!weeklyHours && (openToday || openFromYesterday);
  const todayStatus = weeklyHours ? (isOpenNow ? "مفتوح الآن" : "مغلق الآن") : "";

  return (
    <main dir="rtl" className="min-h-screen bg-[#f3f5fa] px-3 py-5 text-slate-800 sm:px-6 sm:py-8">
      <LandingPageAnalytics slug={params.slug} />
      <div className="mx-auto max-w-6xl">
        <nav className="mb-5 flex items-center justify-between px-1">
          <a href="/" className="flex items-center gap-2.5 text-sm font-black text-slate-700"><span className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-sm" style={{background:palette.gradient}}>ب</span> بطاقاتي</a>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"><svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M10 1.5 12.4 3l2.8-.1 1.1 2.6 2.2 1.7-.8 2.7.8 2.7-2.2 1.7-1.1 2.6-2.8-.1L10 18.5l-2.4-1.5-2.8.1-1.1-2.6-2.2-1.7.8-2.7-.8-2.7 2.2-1.7 1.1-2.6 2.8.1L10 1.5Zm-1.1 11.8 5-5-1.2-1.2-3.8 3.8-1.7-1.7L6 10.4l2.9 2.9Z"/></svg>على منصة بطاقتي</span>
        </nav>

        <article className="overflow-hidden rounded-[2rem] border shadow-[0_24px_80px_rgba(15,23,42,.09)]" style={{backgroundColor: cardBackground, color: cardText, borderColor: customAccent + "35"}}>
          <header className="relative">
            {sections.cover_image_url ? <div className="relative h-56 sm:h-80">
              <img src={sections.cover_image_url} alt={`غلاف ${page.business_name}`} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
            </div> : <div className="h-16 sm:h-24" style={{background:`radial-gradient(circle at 15% 20%, #ffffffaa, transparent 25%), ${palette.gradient}`}} />}
            <div className="relative px-5 pb-6 sm:px-10 sm:pb-9">
              <div className="-mt-10 flex flex-col items-center gap-3 sm:-mt-12 sm:flex-row sm:items-end sm:gap-4">
                {displayImage ? <img src={displayImage} alt={page.business_name} className="h-20 w-20 rounded-2xl border-4 border-white bg-white object-cover shadow-xl sm:h-24 sm:w-24" /> :
                  <div className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-white text-3xl font-black text-white shadow-xl sm:h-24 sm:w-24" style={{background:palette.gradient}}>{page.business_name.slice(0,1)}</div>}
                <div className="min-w-0 flex-1 pb-1 text-center sm:text-right">
                  <div className="mb-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold" style={{background:palette.tint,color:palette.accent}}>{isRestaurant ? "مطعم ومأكولات" : isStore ? "المتجر الرسمي" : "مرحبًا بكم"}</div>
                  <h1 className="text-2xl font-black leading-tight sm:text-3xl" style={{color:cardText}}>{page.business_name}</h1>
                  {page.headline && <p className="mt-2 text-sm font-medium leading-7 sm:text-base" style={{color:cardMuted}}>{page.headline}</p>}
                </div>
                {page.phone && <a href={`tel:${page.phone}`} data-track-event="contact" className="inline-flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5" style={{background:palette.gradient}}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.35 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.35 1.84.58 2.8.7A2 2 0 0 1 22 16.92Z"/></svg> اتصل الآن</a>}
              </div>
            </div>
          </header>

          {hasContact && <section className="border-y px-5 py-5 sm:px-10" style={{backgroundColor: customPanel, borderColor: customAccent + "30"}}>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {page.phone && <a href={`tel:${page.phone}`} data-track-event="contact" className="flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{backgroundColor:customPanel,borderColor:customAccent+"35"}}><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.35 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.35 1.84.58 2.8.7A2 2 0 0 1 22 16.92Z"/></svg></span><span className="text-right"><strong className="block text-sm text-slate-900">الهاتف</strong><small dir="ltr" className="mt-1 block text-slate-500">{page.phone}</small></span></a>}
              {links.map((link: {label:string;url:string;kind?:string},i:number)=><a key={link.label+i} data-track-event="contact" href={link.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{backgroundColor:customPanel,borderColor:customAccent+"35"}}><BrandMark kind={link.kind || "custom"}/><span className="text-sm font-extrabold text-slate-700">{link.label}</span></a>)}
            </div>
          </section>}

          <div className="grid gap-5 px-4 py-5 sm:px-7 sm:py-6 lg:grid-cols-[minmax(0,1fr)_230px] lg:gap-6">
            <div className="min-w-0">
              {page.description && <section className="mb-9"><div className="mb-3 flex items-center gap-3"><span className="h-8 w-1.5 rounded-full" style={{background:palette.accent}}/><h2 className="text-xl font-black" style={{color:cardText}}>من نحن</h2></div><p className="whitespace-pre-wrap text-sm leading-8 sm:text-base" style={{color:cardMuted}}>{page.description}</p></section>}
              <section>
                <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-black" style={{color:palette.accent}}>{isRestaurant ? "من قائمتنا" : "تعرّف على ما نقدّمه"}</p><h2 className="mt-1 text-2xl font-black" style={{color:cardText}}>{isRestaurant ? "قائمة الطعام" : isStore ? "المنتجات" : "خدماتنا وأعمالنا"}</h2></div>{products.length>0 && <span className="rounded-full px-3 py-1.5 text-xs font-black" style={{background:palette.tint,color:palette.accent}}>{products.length} {products.length===1?"عنصر":"عناصر"}</span>}</div>
                {products.length ? <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                  {products.map((product,i)=><article key={i} className="group overflow-hidden rounded-3xl border transition duration-300 hover:-translate-y-1 hover:shadow-xl" style={{backgroundColor:customPanel,borderColor:customAccent+"35"}}>
                    <div className="relative aspect-[4/3] overflow-hidden" style={{background:palette.tint}}>
                      {product.image_url ? <img src={product.image_url} alt={product.name||"صورة المنتج"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : <div className="grid h-full place-items-center text-4xl" style={{color:palette.accent}}>{isRestaurant?"🍽️":"✦"}</div>}
                      {product.price && <span className="absolute bottom-3 right-3 rounded-xl bg-white px-3 py-2 text-xs font-black shadow-lg" style={{color:palette.accent}}>{product.price} دج</span>}
                    </div>
                    <div className="p-3.5 sm:p-5">{product.name && <h3 className="line-clamp-2 font-black leading-6 text-slate-900">{product.name}</h3>}{product.description && <p className="mt-2 line-clamp-3 text-xs leading-6 sm:text-sm" style={{color:cardMuted}}>{product.description}</p>}
                      {page.phone && <a href={`tel:${page.phone}`} data-track-event="contact" className="mt-4 flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black text-white sm:text-sm" style={{background:palette.gradient}}><span>☎</span> {isRestaurant?"اتصل للطلب":"اسأل عن المنتج"}</a>}
                    </div>
                  </article>)}
                </div> : <div className="rounded-3xl border border-dashed px-5 py-10 text-center" style={{backgroundColor:customPanel,borderColor:customAccent+"55"}}><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-2xl" style={{background:palette.tint,color:palette.accent}}>✦</span><h3 className="mt-4 font-black" style={{color:cardText}}>مرحبًا بكم في {page.business_name}</h3><p className="mt-2 text-sm leading-7" style={{color:cardMuted}}>تواصلوا معنا لمعرفة المزيد عن منتجاتنا وخدماتنا.</p></div>}
              </section>
            </div>

            <aside className="space-y-4">
              {sections.address && <section className="rounded-3xl border p-5" style={{backgroundColor:customPanel,borderColor:customAccent+"35"}}><span className="grid h-11 w-11 place-items-center rounded-xl text-xl" style={{background:palette.tint,color:palette.accent}}>⌖</span><h2 className="mt-4 font-black" style={{color:cardText}}>زورونا</h2><p className="mt-2 text-sm leading-7" style={{color:cardMuted}}>{sections.address}</p>{sections.map_url && <a href={sections.map_url} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-black" style={{borderColor:palette.accent,color:palette.accent}}>افتح الموقع على الخريطة ↗</a>}</section>}
              {sections.hours && <section className="rounded-2xl border p-4 shadow-sm" style={{backgroundColor:customPanel,borderColor:customAccent+"35"}}><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-lg text-amber-700">◷</span><h2 className="font-black" style={{color:cardText}}>أوقات العمل</h2></div>{todayStatus && <span aria-live="polite" className={`rounded-full px-2.5 py-1 text-[11px] font-black ${isOpenNow?"bg-emerald-100 text-emerald-700":"bg-rose-100 text-rose-700"}`}>{todayStatus}</span>}</div><details className="mt-3"><summary className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-extrabold" style={{backgroundColor:customPanel,color:cardText}}>عرض جدول الأسبوع <span className="float-left">⌄</span></summary><div className="mt-2 space-y-1.5">{weeklyHours ? Object.entries({sunday:"الأحد",monday:"الإثنين",tuesday:"الثلاثاء",wednesday:"الأربعاء",thursday:"الخميس",friday:"الجمعة",saturday:"السبت"}).map(([key,label])=>{const h=weeklyHours?.[key];return <div key={key} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-xs" style={{backgroundColor:customPanel}}><span className="font-bold" style={{color:cardText}}>{label}</span><span className={h?.open?"font-bold text-emerald-700":"font-bold text-slate-400"}>{h?.open?`${h.from} – ${h.to}`:"مغلق"}</span></div>}) : <p className="whitespace-pre-wrap text-sm leading-7" style={{color:cardMuted}}>{sections.hours}</p>}</div></details></section>}
              <section className="rounded-3xl p-5 text-white" style={{background:palette.gradient,color:"#ffffff"}}><p className="text-xs font-bold text-white/75">يسعدنا تواصلكم</p><h2 className="mt-2 text-xl font-black">هل تحتاج إلى مساعدة؟</h2><p className="mt-2 text-sm leading-6 text-white/85">تواصل معنا مباشرة وسنكون سعداء بخدمتك.</p>{page.phone && <a href={`tel:${page.phone}`} data-track-event="contact" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black" style={{color:palette.accent}}>☎ اتصل بنا</a>}{page.whatsapp && <a href={`https://wa.me/${page.whatsapp.replace(/\\D/g,"")}`} data-track-event="contact" className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-black text-white">◉ واتساب</a>}</section>
            </aside>
          </div>
        </article>

        <footer className="flex flex-col items-center justify-between gap-2 px-2 py-6 text-xs text-slate-400 sm:flex-row"><span>© {new Date().getFullYear()} {page.business_name}</span><a href="/" className="rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5">تم إنشاء بواسطة منصة بطاقتي</a></footer>
      </div>
    </main>
  );
}
