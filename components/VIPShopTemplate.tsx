"use client";

import { useMemo, useState } from "react";

type HoursDay = { open: boolean; from: string; to: string };
type VIPShop = {
  name: string;
  logo?: string;
  bio?: string;
  coverImage?: string;
  backgroundImage?: string;
  theme?: string;
  animation?: boolean;
  hours?: Record<string, HoursDay>;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  address?: string;
  mapUrl?: string;
  googleLink?: string;
  gallery?: string[];
};

const themes = {
  gold: { bg: "#17110d", cardBg: "#FDF6E3", accent: "#C9A86A", text: "#352719" },
  silver: { bg: "#17191d", cardBg: "#282b31", accent: "#9CA3AF", text: "#f1f4f8" },
  emerald: { bg: "#081b16", cardBg: "#0F2A1F", accent: "#10B981", text: "#e2f5ec" },
  ruby: { bg: "#210d12", cardBg: "#2A0F14", accent: "#EF4444", text: "#ffe8ec" },
  lavender: { bg: "#171020", cardBg: "#291a37", accent: "#A78BFA", text: "#f4eafa" },
  pink: { bg: "#27131e", cardBg: "#3b1c2c", accent: "#EC4899", text: "#ffedf6" },
  dark: { bg: "#101318", cardBg: "#1F2937", accent: "#9CA3AF", text: "#f8fafc" },
} as const;

type ThemeId = keyof typeof themes;
const dayNames: Record<string, string> = {
  saturday: "السبت", sunday: "الأحد", monday: "الإثنين",
  tuesday: "الثلاثاء", wednesday: "الأربعاء", thursday: "الخميس", friday: "الجمعة",
};
const dayOrder = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
const defaultCover = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85";
const defaultLogo = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80";

function BrandIcon({ brand }: { brand: string }) {
  if (brand === "WhatsApp") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 3.5A11.8 11.8 0 0 0 2 17.7L.5 23.5l6-1.6A11.8 11.8 0 0 0 20.5 3.5ZM12 21a9.7 9.7 0 0 1-4.9-1.3l-.4-.2-3.6 1 1-3.5-.2-.4A9.7 9.7 0 1 1 12 21Zm5.3-7.3c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7.1a8 8 0 0 1-2.3-1.4 8.5 8.5 0 0 1-1.6-2c-.2-.3 0-.5.1-.7l.5-.5c.1-.2.2-.4.3-.6s0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.3 1 2.7 1.2 2.9a11 11 0 0 0 4.3 3.8c.6.3 1.1.5 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.4s.2-1.3.1-1.4-.2-.2-.5-.4Z"/></svg>;
  if (brand === "Instagram") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2.2"/><circle cx="17.6" cy="6.6" r="1.3" fill="currentColor"/></svg>;
  if (brand === "TikTok") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.6 8.1a7.2 7.2 0 0 1-4.3-1.4v8.1a6 6 0 1 1-5.2-5.9v3.3a2.8 2.8 0 1 0 1.9 2.6V2.5h3.3a7.2 7.2 0 0 0 4.3 4.4v3.2Z"/></svg>;
  if (brand === "Facebook") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.7 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6H17V3.1c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5v2.1H7.2v3.2h2.9V21Z"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 2.8 9.4 2l2 5-2.1 1.5a15.2 15.2 0 0 0 6.2 6.2l1.5-2.1 5 2-.8 2.8a3 3 0 0 1-3.1 2.2A16.8 16.8 0 0 1 4.4 5.9a3 3 0 0 1 2.2-3.1Z"/></svg>;
}

export default function VIPShopTemplate({ shop }: { shop: VIPShop }) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const theme = themes[(shop.theme as ThemeId)] || themes.gold;
  const cover = shop.backgroundImage || shop.coverImage || defaultCover;
  const animationEnabled = shop.animation !== false;

  const status = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Africa/Algiers",
    }).formatToParts(new Date());
    const val = (type: string) => parts.find((part) => part.type === type)?.value || "";
    const day = val("weekday").toLowerCase();
    const now = Number(val("hour")) * 60 + Number(val("minute"));
    const today = shop.hours?.[day];
    if (!today?.open) {
      const todayIndex = dayOrder.indexOf(day);
      const next = dayOrder.slice(todayIndex + 1).concat(dayOrder.slice(0, todayIndex + 1)).find((key) => shop.hours?.[key]?.open);
      return { open: false, label: next ? `مغلق الآن · يفتح ${dayNames[next]} ${shop.hours?.[next]?.from || "09:00"}` : "أوقات العمل غير محددة" };
    }
    const toMinutes = (time: string) => {
      const match = /^(\d{2}):(\d{2})$/.exec(time || "");
      return match ? Number(match[1]) * 60 + Number(match[2]) : -1;
    };
    const from = toMinutes(today.from);
    const to = toMinutes(today.to);
    const open = from >= 0 && to >= 0 && (from < to ? now >= from && now < to : from > to ? now >= from || now < to : false);
    return { open, label: open ? "مفتوح الآن" : `مغلق الآن · يفتح ${today.from || "09:00"}` };
  }, [shop.hours]);

  const socials = [
    { label: "الهاتف", icon: "phone", url: shop.phone ? `tel:${shop.phone}` : "", brandClass: "phone" },
    { label: "WhatsApp", icon: "whatsapp", url: shop.whatsapp ? `https://wa.me/${shop.whatsapp.replace(/\D/g, "")}` : "", brandClass: "whatsapp" },
    { label: "Instagram", icon: "instagram", url: shop.instagram || "", brandClass: "instagram" },
    { label: "TikTok", icon: "tiktok", url: shop.tiktok || "", brandClass: "tiktok" },
    { label: "Facebook", icon: "facebook", url: shop.facebook || "", brandClass: "facebook" },
  ].filter((item) => item.url);

  async function share() {
    const data = { title: shop.name, text: shop.bio || shop.name, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(window.location.href); setShareMessage("تم نسخ رابط البطاقة"); }
    } catch {
      setShareMessage("تقدر تنسخ رابط الصفحة من شريط العنوان");
    }
  }

  const sideSocials = [socials.find((item) => item.label === "Instagram"), socials.find((item) => item.label === "WhatsApp"), socials.find((item) => item.label === "TikTok"), socials.find((item) => item.label === "Facebook")].filter((item): item is (typeof socials)[number] => Boolean(item));

  return <main className="vip-root" style={{ "--vip-bg": theme.bg, "--vip-card": theme.cardBg, "--vip-accent": theme.accent, "--vip-text": theme.text } as React.CSSProperties}>
    <div className={`vip-backdrop ${animationEnabled ? "vip-pan" : ""}`} style={{ backgroundImage: `linear-gradient(#0009,#000b),url("${cover}")` }} aria-hidden="true">
      <div className="vip-grain"><span /><span /><span /></div>
    </div>
    <div className="vip-card-shell">
      {sideSocials[0] && <a className="vip-side-icon vip-side-left vip-side-one vip-brand-instagram" href={sideSocials[0].url} target="_blank" rel="noreferrer" aria-label={sideSocials[0].label}><BrandIcon brand={sideSocials[0].label} /></a>}
      {sideSocials[1] && <a className="vip-side-icon vip-side-left vip-side-two vip-brand-whatsapp" href={sideSocials[1].url} target="_blank" rel="noreferrer" aria-label={sideSocials[1].label}><BrandIcon brand={sideSocials[1].label} /></a>}
      {sideSocials[2] && <a className="vip-side-icon vip-side-right vip-side-one vip-brand-tiktok" href={sideSocials[2].url} target="_blank" rel="noreferrer" aria-label={sideSocials[2].label}><BrandIcon brand={sideSocials[2].label} /></a>}
      {sideSocials[3] && <a className="vip-side-icon vip-side-right vip-side-two vip-brand-facebook" href={sideSocials[3].url} target="_blank" rel="noreferrer" aria-label={sideSocials[3].label}><BrandIcon brand={sideSocials[3].label} /></a>}
      <article className="vip-card">
      <div className="vip-logo-wrap"><img className="vip-logo" src={shop.logo || defaultLogo} alt={`شعار ${shop.name}`} /><span className="vip-verified" title="بطاقة VIP">✓</span></div>
      <h1 className="vip-name">{shop.name}</h1>
      {shop.bio && <p className="vip-bio">{shop.bio}</p>}
      <div className={`vip-status ${status.open ? "is-open" : "is-closed"}`}><span className="vip-dot" />{status.label}</div>

      <button className="vip-hours-button" onClick={() => setHoursOpen(!hoursOpen)} aria-expanded={hoursOpen}>
        <span className="vip-hours-symbol">◷</span><span>أوقات العمل</span><small>السبت إلى الجمعة</small><b>{hoursOpen ? "−" : "+"}</b>
      </button>
      {hoursOpen && <div className="vip-hours-list">{dayOrder.map((day) => {
        const hours = shop.hours?.[day];
        return <div key={day}><span>{dayNames[day]}</span><strong>{hours?.open ? `${hours.from} – ${hours.to}` : "مغلق"}</strong></div>;
      })}</div>}

      {shop.googleLink && <a className="vip-google" href={shop.googleLink} target="_blank" rel="noreferrer">
        <span className="vip-google-g">G</span><span className="vip-google-copy"><strong>قيّمنا على Google</strong><span className="vip-stars">★★★★★</span><small>شاركنا رأيك في تقييم Google</small></span><span className="vip-google-arrow">↗</span>
      </a>}

      {socials.length > 0 && <section className="vip-section"><h2>تواصل معنا</h2><div className="vip-socials">{socials.map((item) =>
        <a key={item.label} href={item.url} target={item.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer" aria-label={item.label}>
          <span className={`vip-social-icon vip-brand-${item.brandClass}`}><BrandIcon brand={item.label === "الهاتف" ? "phone" : item.label} /></span><small>{item.label}</small>
        </a>)}</div></section>}

      {(shop.gallery || []).filter(Boolean).length > 0 && <section className="vip-section"><h2>معرض الصور</h2><div className="vip-gallery">{(shop.gallery || []).filter(Boolean).slice(0, 4).map((src, index) =>
        <button key={src + index} onClick={() => setLightbox(src)} aria-label={`عرض الصورة ${index + 1}`}><img src={src} alt={`صورة من ${shop.name}`} loading="lazy" /></button>)}</div></section>}

      {shop.address && <a className="vip-map" href={shop.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`} target="_blank" rel="noreferrer">
        <span className="vip-map-pin">⌖</span><span className="vip-map-copy"><strong>موقعنا على الخريطة</strong><small>{shop.address}</small></span><b>↗</b>
      </a>}
      <footer className="vip-footer">بطاقة VIP · بطاقتي</footer>
    </article>
    </div>

    <button className="vip-share" onClick={share} aria-label="مشاركة البطاقة">↗</button>
    {shareMessage && <div className="vip-toast" role="status" onClick={() => setShareMessage("")}>{shareMessage} ×</div>}
    {lightbox && <div className="vip-lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}><button aria-label="إغلاق" onClick={() => setLightbox(null)}>×</button><img src={lightbox} alt={shop.name} /></div>}

    <style jsx>{`
      .vip-root{min-height:100vh;background:var(--vip-bg);color:var(--vip-text);position:relative;isolation:isolate;padding:44px 20px 92px;overflow-x:clip;overflow-y:visible;font-family:Arial,sans-serif}
      .vip-backdrop{position:fixed;inset:-4%;z-index:-2;background-size:cover;background-position:center;filter:blur(25px);transform:scale(1.1);opacity:1;background-repeat:no-repeat}
      .vip-backdrop:before{content:"";position:absolute;inset:0;background:#0009}
      .vip-pan{animation:vipPan 36s ease-in-out infinite alternate}
      @keyframes vipPan{from{background-position:42% 45%;transform:scale(1.08)}to{background-position:60% 55%;transform:scale(1.18)}}
      .vip-grain span{position:absolute;width:7px;height:7px;border-radius:50%;background:#C9A86A;opacity:.45;animation:vipGlow 3.2s ease-in-out infinite}
      .vip-grain span:nth-child(1){top:12%;left:12%}.vip-grain span:nth-child(2){top:38%;right:9%;width:4px;height:4px;animation-delay:.8s}.vip-grain span:nth-child(3){bottom:14%;left:32%;animation-delay:1.5s}
      .vip-card-shell{position:relative;width:100%;max-width:360px;margin:20px auto 0;isolation:isolate}.vip-card{position:relative;width:100%;max-width:360px;box-sizing:border-box;margin:20px auto 0;padding:76px 18px 22px;border:1px solid color-mix(in srgb,var(--vip-accent) 65%,transparent);border-radius:32px;background:color-mix(in srgb,var(--vip-card) 96%,transparent);color:var(--vip-text);box-shadow:0 28px 90px #0008;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
      .vip-side-icon{position:absolute;z-index:4;top:80px;width:48px;height:48px;display:grid;place-items:center;border-radius:50%;border:1px solid var(--vip-accent);background:#fff;color:#fff;box-shadow:0 10px 28px #0003;text-decoration:none;animation:vipFloatSide 2.5s ease-in-out infinite;transition:transform .2s,box-shadow .2s}.vip-side-icon svg{width:23px;height:23px;display:block}.vip-side-icon:hover{box-shadow:0 12px 30px #0005,0 0 16px color-mix(in srgb,var(--vip-accent) 60%,transparent)}.vip-side-left{left:-16px}.vip-side-right{right:-16px}.vip-side-two{top:144px;animation-delay:.5s}.vip-side-icon.vip-brand-instagram{background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)}.vip-side-icon.vip-brand-whatsapp{background:#25D366}.vip-side-icon.vip-brand-tiktok{background:#111}.vip-side-icon.vip-brand-facebook{background:#1877f2}@keyframes vipFloatSide{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
      .vip-logo-wrap{position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:120px;height:120px}
      .vip-logo{width:120px;height:120px;object-fit:cover;border-radius:50%;border:3px solid var(--vip-accent);box-shadow:0 8px 32px #0009;background:var(--vip-card)}
      .vip-verified{position:absolute;right:0;bottom:4px;background:#1688ff;color:#fff;border:2px solid var(--vip-card);width:27px;height:27px;border-radius:50%;display:grid;place-items:center;font-weight:900}
      .vip-name{text-align:center;font-family:Georgia,serif;font-size:29px;font-weight:700;color:var(--vip-accent);letter-spacing:.2px;overflow-wrap:anywhere}
      .vip-bio{text-align:center;font-size:13px;line-height:1.8;color:var(--vip-text);opacity:.88;margin:8px auto 15px;max-width:290px;overflow-wrap:anywhere}
      .vip-status{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 auto 16px;padding:8px 12px;border-radius:999px;width:fit-content;max-width:100%;font-size:12px;font-weight:700}.is-open{background:#123b2b;color:#8ce6b8}.is-closed{background:#4b1d21;color:#ffb5b5}.vip-dot{width:7px;height:7px;flex-shrink:0;border-radius:50%;background:currentColor;box-shadow:0 0 0 4px #ffffff10;animation:vipGlow 2.2s ease-in-out infinite}
      .vip-hours-button,.vip-map{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;border:1px solid color-mix(in srgb,var(--vip-accent) 48%,transparent);border-radius:16px;padding:12px;color:var(--vip-text);text-align:right;background:#ffffff08;text-decoration:none}
      .vip-hours-button>span:not(.vip-hours-symbol){font-weight:700;font-size:13px}.vip-hours-symbol{color:var(--vip-accent);font-size:20px}.vip-hours-button small{margin-right:auto;font-size:10px;opacity:.75}.vip-hours-button>b{color:var(--vip-accent);font-size:20px}
      .vip-hours-list{margin-top:8px;padding:10px 13px;border-radius:14px;background:#0002}.vip-hours-list div{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #ffffff12;font-size:12px}.vip-hours-list div:last-child{border:0}.vip-hours-list strong{color:var(--vip-accent)}
      .vip-google{position:relative;isolation:isolate;overflow:hidden;margin-top:15px;display:flex;align-items:center;gap:10px;background:#ffeb3b;color:#342c0b;border-radius:16px;padding:13px 12px;text-decoration:none;box-shadow:0 8px 24px #0002}
      .vip-google:after{content:"";position:absolute;z-index:-1;inset:-60% auto -60% -45%;width:28%;background:linear-gradient(90deg,transparent,#ffffffbd,transparent);transform:rotate(22deg);animation:vipShine 3.8s ease-in-out infinite;pointer-events:none}
      @keyframes vipShine{0%,35%{left:-45%}75%,100%{left:130%}}
      .vip-google-g{font-size:30px;font-weight:900;font-family:Arial;background:conic-gradient(from -45deg,#4285f4 0 25%,#34a853 25% 45%,#fbbc05 45% 68%,#ea4335 68% 82%,#4285f4 82%);color:transparent;background-clip:text;flex-shrink:0}
      .vip-google-copy{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}.vip-google-copy strong{font-size:12px}.vip-stars{font-size:16px;letter-spacing:1px;color:#9b6b00}.vip-google-copy small{font-size:10px}.vip-google-arrow{font-size:18px}
      .vip-section{margin-top:23px}.vip-section h2{font-size:14px;font-weight:800;margin-bottom:13px;color:var(--vip-text)}
      .vip-socials{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:13px 4px}.vip-socials a{min-width:0;grid-column:span 2;display:flex;flex-direction:column;align-items:center;gap:7px;text-decoration:none;color:var(--vip-text);font-size:10px}
      .vip-socials a:nth-child(4):nth-last-child(2){grid-column:2/span 2}.vip-socials a:nth-child(5):last-child{grid-column:4/span 2}
      .vip-social-icon{width:65px;height:65px;max-width:100%;box-sizing:border-box;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:21px;font-weight:800;border:2px solid var(--vip-accent);box-shadow:0 5px 18px #0003,inset 0 1px 10px #ffffff1a;backdrop-filter:blur(12px);animation:vipFloat 4s ease-in-out infinite,vipGlow 3s ease-in-out infinite}
      .vip-socials a:nth-child(2) .vip-social-icon{animation-delay:.25s,.4s}.vip-socials a:nth-child(3) .vip-social-icon{animation-delay:.5s,.8s}.vip-socials a:nth-child(4) .vip-social-icon{animation-delay:.75s,1.2s}.vip-socials a:nth-child(5) .vip-social-icon{animation-delay:1s,1.6s}
      @keyframes vipFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes vipGlow{0%,100%{box-shadow:0 5px 14px #0002,0 0 0 #c9a86a00}50%{box-shadow:0 7px 22px #0004,0 0 16px color-mix(in srgb,var(--vip-accent) 50%,transparent)}}
      .vip-socials small{font-size:10px;white-space:nowrap}.vip-social-icon svg{width:31px;height:31px;display:block;color:#fff}
      .vip-brand-whatsapp{background:#25D366}.vip-brand-instagram{background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)}.vip-brand-tiktok{background:#111}.vip-brand-facebook{background:#1877f2}.vip-brand-phone{background:#4a4a4a}
      .vip-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.vip-gallery button{padding:0;overflow:hidden;aspect-ratio:1;border:1px solid color-mix(in srgb,var(--vip-accent) 48%,transparent);border-radius:16px;background:#0002}.vip-gallery img{width:100%;height:100%;object-fit:cover;transition:transform .3s}.vip-gallery button:hover img{transform:scale(1.05)}
      .vip-map{margin-top:22px;background:var(--vip-accent);color:#21170c;border:0;font-weight:800;padding:13px}.vip-map-pin{font-size:22px}.vip-map-copy{min-width:0;display:flex;flex-direction:column;gap:3px;flex:1}.vip-map-copy strong{font-size:13px}.vip-map small{font-weight:500;font-size:10px;opacity:.85;overflow-wrap:anywhere}.vip-map>b{font-size:18px}
      .vip-footer{text-align:center;font-size:10px;opacity:.6;margin-top:22px}
      .vip-share{position:fixed;bottom:18px;right:18px;z-index:5;width:48px;height:48px;border-radius:15px;border:1px solid #ffffff50;background:#ffffff24;color:white;backdrop-filter:blur(12px);box-shadow:0 8px 24px #0005;font-size:22px;font-weight:700}
      .vip-toast{position:fixed;z-index:30;bottom:80px;left:50%;transform:translateX(-50%);padding:12px 16px;background:var(--vip-card);border:1px solid var(--vip-accent);border-radius:14px;font-size:12px;box-shadow:0 8px 30px #0008;max-width:calc(100vw - 32px)}
      .vip-lightbox{position:fixed;inset:0;z-index:20;background:#000e;display:flex;align-items:center;justify-content:center;padding:20px}.vip-lightbox img{max-width:100%;max-height:85vh;object-fit:contain;border-radius:12px}.vip-lightbox button{position:absolute;top:18px;right:20px;font-size:36px;color:white}
      @media(max-width:400px){.vip-root{padding-left:26px;padding-right:26px}.vip-card-shell,.vip-card{max-width:360px}.vip-card{padding-left:14px;padding-right:14px}.vip-side-left{left:-19px}.vip-side-right{right:-19px}.vip-side-icon{width:42px;height:42px}.vip-side-two{top:137px}.vip-socials{gap:12px 2px}.vip-social-icon{width:58px;height:58px}.vip-socials small{font-size:9px}}
      @media(prefers-reduced-motion:reduce){.vip-pan,.vip-grain span,.vip-social-icon,.vip-side-icon,.vip-dot,.vip-google:after{animation:none}}
    `}</style>
  </main>;
}
