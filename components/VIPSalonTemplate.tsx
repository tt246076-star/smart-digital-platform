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

const palettes: Record<string, { bg: string; bg2: string; accent: string; ink: string; glass: string }> = {
  gold: { bg: "#f7e4db", bg2: "#f4cad1", accent: "#8b6637", ink: "#40272b", glass: "rgba(255,255,255,.57)" },
  silver: { bg: "#e9edf2", bg2: "#cfd7e1", accent: "#687382", ink: "#202834", glass: "rgba(255,255,255,.6)" },
  emerald: { bg: "#e4f3e9", bg2: "#bdddc9", accent: "#286445", ink: "#153c2b", glass: "rgba(255,255,255,.57)" },
  ruby: { bg: "#fff0f3", bg2: "#f6d0dc", accent: "#a73655", ink: "#5a2033", glass: "rgba(255,255,255,.57)" },
  lavender: { bg: "#f5edfb", bg2: "#e0d0f0", accent: "#75568f", ink: "#362545", glass: "rgba(255,255,255,.57)" },
  pink: { bg: "#fff0f5", bg2: "#f3c1d3", accent: "#ad4b72", ink: "#55253b", glass: "rgba(255,255,255,.58)" },
  dark: { bg: "#171821", bg2: "#302638", accent: "#dfb6c9", ink: "#fff4f8", glass: "rgba(255,255,255,.08)" },
};

const dayNames: Record<string, string> = {
  saturday: "السبت", sunday: "الأحد", monday: "الإثنين", tuesday: "الثلاثاء",
  wednesday: "الأربعاء", thursday: "الخميس", friday: "الجمعة",
};
const dayOrder = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
const fallbackCover = "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=85";
const fallbackLogo = "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=500&q=85";

function SalonIcon({ brand }: { brand: string }) {
  if (brand === "WhatsApp") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 3.5A11.8 11.8 0 0 0 2 17.7L.5 23.5l6-1.6A11.8 11.8 0 0 0 20.5 3.5ZM12 21a9.7 9.7 0 0 1-4.9-1.3l-.4-.2-3.6 1 1-3.5-.2-.4A9.7 9.7 0 1 1 12 21Zm5.3-7.3c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7.1a8 8 0 0 1-2.3-1.4 8.5 8.5 0 0 1-1.6-2c-.2-.3 0-.5.1-.7l.5-.5c.1-.2.2-.4.3-.6s0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.3 1 2.7 1.2 2.9a11 11 0 0 0 4.3 3.8c.6.3 1.1.5 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.4s.2-1.3.1-1.4-.2-.2-.5-.4Z"/></svg>;
  if (brand === "Instagram") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.1"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2.1"/><circle cx="17.6" cy="6.6" r="1.3" fill="currentColor"/></svg>;
  if (brand === "TikTok") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.6 8.1a7.2 7.2 0 0 1-4.3-1.4v8.1a6 6 0 1 1-5.2-5.9v3.3a2.8 2.8 0 1 0 1.9 2.6V2.5h3.3a7.2 7.2 0 0 0 4.3 4.4v3.2Z"/></svg>;
  if (brand === "Facebook") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.7 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6H17V3.1c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5v2.1H7.2v3.2h2.9V21Z"/></svg>;
  if (brand === "map") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
  if (brand === "Google") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.4 3-7.4ZM12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.7-4.1H3v2.6A10 10 0 0 0 12 22ZM6.3 13.9a6 6 0 0 1 0-3.8V7.5H3a10 10 0 0 0 0 9l3.3-2.6ZM12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.8 9.8 0 0 0 12 2a10 10 0 0 0-9 5.5l3.3 2.6C7.2 7.8 9.4 6 12 6Z"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 2.8 9.4 2l2 5-2.1 1.5a15.2 15.2 0 0 0 6.2 6.2l1.5-2.1 5 2-.8 2.8a3 3 0 0 1-3.1 2.2A16.8 16.8 0 0 1 4.4 5.9a3 3 0 0 1 2.2-3.1Z"/></svg>;
}

export default function VIPSalonTemplate({ shop }: { shop: VIPShop }) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const palette = palettes[shop.theme || "gold"] || palettes.gold;
  const cover = shop.backgroundImage || shop.coverImage || fallbackCover;
  const animate = shop.animation !== false;

  const status = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Africa/Algiers",
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
    const day = get("weekday").toLowerCase();
    const minute = Number(get("hour")) * 60 + Number(get("minute"));
    const today = shop.hours?.[day];
    const minutes = (time: string) => {
      const match = /^(\d{2}):(\d{2})$/.exec(time || "");
      return match ? Number(match[1]) * 60 + Number(match[2]) : -1;
    };
    if (today?.open) {
      const from = minutes(today.from), to = minutes(today.to);
      const open = from >= 0 && to >= 0 && (from < to ? minute >= from && minute < to : from > to ? minute >= from || minute < to : false);
      if (open) return { open: true, label: `مفتوح الآن · حتى ${today.to}` };
      if (from >= 0 && to >= 0 && minute < from && from < to) return { open: false, label: `مغلق الآن · يفتح اليوم ${today.from}` };
      if (from > to && minute >= to && minute < from) return { open: false, label: `مغلق الآن · يفتح اليوم ${today.from}` };
    }
    const currentIndex = dayOrder.indexOf(day);
    for (let i = 1; i <= 7; i++) {
      const nextDay = dayOrder[(Math.max(currentIndex, 0) + i) % 7];
      const nextHours = shop.hours?.[nextDay];
      if (nextHours?.open) return { open: false, label: `مغلق الآن · يفتح ${dayNames[nextDay]} ${nextHours.from || "09:00"}` };
    }
    if (today?.open && today.from) return { open: false, label: `مغلق الآن · يفتح اليوم ${today.from}` };
    return { open: false, label: "أوقات العمل غير محددة" };
  }, [shop.hours]);

  const socials = [
    { label: "Instagram", url: shop.instagram || "", color: "#E1306C" },
    { label: "WhatsApp", url: shop.whatsapp ? `https://wa.me/${shop.whatsapp.replace(/\D/g, "")}` : "", color: "#25D366" },
    { label: "TikTok", url: shop.tiktok || "", color: "#111111" },
    { label: "Facebook", url: shop.facebook || "", color: "#1877F2" },
  ].filter((item) => item.url);
  const sideSocials = socials.filter((item) => ["Instagram", "WhatsApp", "TikTok", "Facebook"].includes(item.label));
  const contactItems = [
    ...(shop.whatsapp ? [{ label: "واتساب · راسلنا", detail: shop.whatsapp, url: `https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`, brand: "WhatsApp", color: "#25D366" }] : []),
    ...(shop.phone ? [{ label: "هاتف · اتصل بنا", detail: shop.phone, url: `tel:${shop.phone}`, brand: "phone", color: "#6b7280" }] : []),
    ...(shop.address ? [{ label: "موقع المحل", detail: shop.address, url: shop.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`, brand: "map", color: "#EA4335" }] : []),
  ];
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: shop.name, text: shop.bio || shop.name, url });
      else { await navigator.clipboard.writeText(url); setToast("تم نسخ رابط البطاقة"); }
    } catch {
      setToast("يمكنك نسخ رابط البطاقة من شريط العنوان");
    }
  }

  return <main className={`salon-root ${animate ? "salon-animated" : "salon-static"}`} style={{ "--salon-bg": palette.bg, "--salon-bg2": palette.bg2, "--salon-accent": palette.accent, "--salon-ink": palette.ink, "--salon-glass": palette.glass, backgroundImage: `linear-gradient(160deg,${palette.bg},${palette.bg2})` } as React.CSSProperties}>
    <div className="salon-backdrop" aria-hidden="true" style={{ backgroundImage: `linear-gradient(180deg,#21131b35,#21131bb8),url("${cover}")` }} />
    <div className="salon-aurora" aria-hidden="true"><i /><i /><i /></div>
    <div className="salon-wrap">
      <div className="salon-shell">
        {sideSocials[0] && <a className="salon-orb salon-left salon-orb-one salon-instagram" href={sideSocials[0].url} target="_blank" rel="noreferrer" aria-label={sideSocials[0].label}><SalonIcon brand={sideSocials[0].label} /></a>}
        {sideSocials[1] && <a className="salon-orb salon-left salon-orb-two salon-whatsapp" href={sideSocials[1].url} target="_blank" rel="noreferrer" aria-label={sideSocials[1].label}><SalonIcon brand={sideSocials[1].label} /></a>}
        {sideSocials[2] && <a className="salon-orb salon-right salon-orb-one salon-tiktok" href={sideSocials[2].url} target="_blank" rel="noreferrer" aria-label={sideSocials[2].label}><SalonIcon brand={sideSocials[2].label} /></a>}
        {sideSocials[3] && <a className="salon-orb salon-right salon-orb-two salon-facebook" href={sideSocials[3].url} target="_blank" rel="noreferrer" aria-label={sideSocials[3].label}><SalonIcon brand={sideSocials[3].label} /></a>}
        <article className="salon-card">
          <div className="salon-logo"><img src={shop.logo || fallbackLogo} alt={`شعار ${shop.name}`} /><span>✦</span></div>
          <header className="salon-head">
            <span className="salon-kicker">BEAUTY · CARE · STYLE</span>
            <h1>{shop.name}</h1>
            <span className="salon-latin">{shop.name}</span>
            {shop.bio && <p>{shop.bio}</p>}
            <div className={`salon-status ${status.open ? "salon-is-open" : "salon-is-closed"}"><i />{status.label}</div>
          </header>
          <div className="salon-divider"><span>✧</span></div>
          <section className="salon-hours">
            <div className="salon-section-title"><span>أوقات العمل</span><small>WORKING HOURS</small></div>
            <button type="button" className="salon-hours-toggle" onClick={() => setHoursOpen(!hoursOpen)} aria-expanded={hoursOpen}><span>◷</span>{hoursOpen ? "إخفاء الجدول" : "عرض جدول الأسبوع"}<b>{hoursOpen ? "−" : "+"}</b></button>
            {hoursOpen && <div className="salon-hours-list">{dayOrder.map((day) => { const h = shop.hours?.[day]; return <div key={day}><span>{dayNames[day]}</span><strong>{h?.open ? `${h.from} – ${h.to}` : "مغلق"}</strong></div>; })}</div>}
          </section>
          {shop.googleLink && <a className="salon-google" href={shop.googleLink} target="_blank" rel="noreferrer"><span className="salon-google-icon"><SalonIcon brand="Google" /></span><span className="salon-google-copy"><b>قيّم تجربتك على Google</b><span className="salon-stars">★★★★★</span><small>رأيك يساعدنا على التطور دائمًا</small></span><span className="salon-arrow">↗</span></a>}
          {contactItems.length > 0 && <section className="salon-contacts"><div className="salon-section-title"><span>تواصل معنا</span><small>GET IN TOUCH</small></div><div className="salon-contact-list">{contactItems.map((item) => <a key={item.label} className="salon-contact" href={item.url} target={item.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer"><span className="salon-contact-icon" style={{ color: item.color }}><SalonIcon brand={item.brand} /></span><span className="salon-contact-copy"><b>{item.label}</b><small>{item.detail}</small></span><span className="salon-contact-arrow">↗</span></a>)}</div></section>}
          {shop.gallery?.filter(Boolean).length ? <section className="salon-gallery-section"><div className="salon-section-title"><span>من أعمالنا</span><small>OUR GALLERY</small></div><div className="salon-gallery">{shop.gallery.filter(Boolean).slice(0, 4).map((src, i) => <button key={src + i} type="button" onClick={() => setLightbox(src)} aria-label={`عرض الصورة ${i + 1}`}><img src={src} alt={`من أعمال ${shop.name}`} loading="lazy" /></button>)}</div></section> : null}
          <footer className="salon-footer"><span>✦</span><b>{shop.name}</b><small>الجمال يبدأ من العناية بالتفاصيل</small></footer>
        </article>
        {shop.googleLink && <a className="salon-google-orb" href={shop.googleLink} target="_blank" rel="noreferrer" aria-label="تقييم Google"><SalonIcon brand="Google" /><small>Google</small></a>}
      </div>
      <button type="button" className="salon-share" onClick={share} aria-label="مشاركة البطاقة"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg></button>
      {toast && <button type="button" className="salon-toast" role="status" onClick={() => setToast("")}>{toast} ×</button>}
      {lightbox && <div className="salon-lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}><button type="button" aria-label="إغلاق" onClick={() => setLightbox(null)}>×</button><img src={lightbox} alt={shop.name} /></div>}
    </div>
    <style jsx>{`
      .salon-root{position:relative;isolation:isolate;min-height:100vh;padding:90px 20px 106px;overflow-x:clip;font-family:"Tajawal",Arial,sans-serif;color:var(--salon-ink);background-size:cover;background-position:center;transition:background .4s}
      .salon-backdrop{position:fixed;inset:-5%;z-index:-2;background-position:center;background-size:cover;filter:blur(8px);transform:scale(1.08);pointer-events:none}
      .salon-aurora{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none}.salon-aurora i{position:absolute;width:50vmax;height:50vmax;border-radius:50%;filter:blur(90px);opacity:.5;background:radial-gradient(circle,var(--salon-accent),transparent 70%);animation:salonDrift 22s ease-in-out infinite alternate}.salon-aurora i:nth-child(1){top:-30vmax;left:-20vmax}.salon-aurora i:nth-child(2){right:-24vmax;bottom:-30vmax;animation-delay:-8s}.salon-aurora i:nth-child(3){left:45%;top:42%;width:32vmax;height:32vmax;opacity:.22;animation-delay:-14s}
      @keyframes salonDrift{to{transform:translate3d(5vw,-3vh,0) scale(1.16)}}
      .salon-wrap{position:relative;z-index:1;width:min(410px,100%);margin:0 auto}.salon-shell{position:relative;width:100%;margin:24px auto 0}
      .salon-card{position:relative;width:100%;box-sizing:border-box;padding:85px 22px 25px;border-radius:31px;border:1px solid color-mix(in srgb,var(--salon-accent) 43%,transparent);background:linear-gradient(165deg,color-mix(in srgb,var(--salon-glass) 98%,transparent),color-mix(in srgb,var(--salon-glass) 70%,transparent));backdrop-filter:blur(28px) saturate(155%);-webkit-backdrop-filter:blur(28px) saturate(155%);box-shadow:0 35px 100px #0003,inset 0 1px #ffffff65}
      .salon-logo{position:absolute;top:-66px;left:50%;transform:translateX(-50%);width:126px;height:126px;z-index:5}.salon-logo img{width:100%;height:100%;display:block;object-fit:cover;border-radius:50%;border:3px solid var(--salon-glass);outline:1px solid var(--salon-accent);box-shadow:0 12px 38px #0004;background:var(--salon-bg)}.salon-logo span{position:absolute;right:1px;bottom:6px;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;border:2px solid var(--salon-bg);background:var(--salon-accent);color:white;font-size:15px}
      .salon-head{text-align:center}.salon-kicker{display:block;font-size:9px;letter-spacing:.24em;color:var(--salon-accent);font-weight:800}.salon-head h1{margin:7px 0 0;font-family:"El Messiri","Tajawal",serif;font-size:clamp(27px,7vw,36px);line-height:1.32;overflow-wrap:anywhere;color:var(--salon-ink)}.salon-latin{display:block;margin-top:1px;font-family:Georgia,serif;font-size:10px;letter-spacing:.18em;text-transform:uppercase;opacity:.58;direction:ltr}.salon-head p{margin:13px auto 14px;max-width:310px;font-size:13px;line-height:1.9;overflow-wrap:anywhere;opacity:.85}.salon-status{display:inline-flex;align-items:center;gap:8px;max-width:100%;border-radius:99px;padding:8px 12px;font-size:11px;font-weight:700}.salon-status i{width:7px;height:7px;border-radius:50%;background:currentColor;flex:none}.salon-is-open{color:#17653b;background:#dff5e8}.salon-is-open i{box-shadow:0 0 0 4px #43bd7a20;animation:salonPulse 2.1s infinite}.salon-is-closed{color:#a12f48;background:#fde4e9}.salon-divider{display:flex;align-items:center;gap:12px;margin:24px 0 20px;color:var(--salon-accent)}.salon-divider:before,.salon-divider:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--salon-accent) 58%,transparent),transparent)}.salon-divider span{font-size:19px}
      .salon-section-title{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:19px 0 11px}.salon-section-title span{font-size:14px;font-weight:800}.salon-section-title small{font-family:Georgia,serif;font-size:8px;letter-spacing:.12em;color:var(--salon-accent)}
      .salon-hours-toggle{width:100%;display:flex;align-items:center;gap:9px;border:1px solid color-mix(in srgb,var(--salon-accent) 25%,transparent);border-radius:15px;padding:12px 13px;background:#ffffff45;color:var(--salon-ink);text-align:right;font:inherit;font-size:12px;font-weight:700;cursor:pointer}.salon-hours-toggle span{font-size:20px;color:var(--salon-accent)}.salon-hours-toggle b{margin-right:auto;font-size:19px;color:var(--salon-accent)}.salon-hours-list{margin-top:8px;padding:5px 13px;background:#ffffff40;border-radius:13px}.salon-hours-list div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #8b663722;font-size:12px}.salon-hours-list div:last-child{border:0}.salon-hours-list strong{color:var(--salon-accent)}
      .salon-google{position:relative;display:flex;align-items:center;gap:10px;margin-top:17px;padding:13px 12px;border:1px solid #e4c86a;border-radius:17px;background:linear-gradient(125deg,#fff4a9,#ffec6a 55%,#f8e078);color:#3d3211;text-decoration:none;box-shadow:0 12px 28px #9d7e251a;overflow:hidden}.salon-google:after{content:"";position:absolute;top:-50%;bottom:-50%;left:-45%;width:24%;background:linear-gradient(90deg,transparent,#ffffffbc,transparent);transform:skewX(-20deg);animation:salonShine 4s ease-in-out infinite}.salon-google-icon{display:grid;place-items:center;width:35px;height:35px;flex:none;color:#4285f4}.salon-google-icon svg{width:31px;height:31px}.salon-google-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px}.salon-google-copy b{font-size:12px}.salon-stars{font-size:15px;letter-spacing:2px;color:#9c7000}.salon-google-copy small{font-size:10px;opacity:.8}.salon-arrow{font-size:20px}
      .salon-contacts,.salon-gallery-section{margin-top:21px}.salon-contact-list{display:flex;flex-direction:column;gap:8px}.salon-contact{display:flex;align-items:center;gap:10px;padding:10px 11px;border-radius:15px;border:1px solid color-mix(in srgb,var(--salon-accent) 15%,transparent);background:#ffffff40;color:var(--salon-ink);text-decoration:none;min-width:0;transition:transform .25s,border-color .25s}.salon-contact:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--salon-accent) 50%,transparent)}.salon-contact-icon{display:grid;place-items:center;flex:none;width:37px;height:37px;border-radius:12px;background:#ffffffa0}.salon-contact-icon svg{width:20px;height:20px}.salon-contact-copy{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}.salon-contact-copy b{font-size:11px}.salon-contact-copy small{font-size:11px;line-height:1.5;overflow-wrap:anywhere;opacity:.75}.salon-contact-arrow{font-size:17px;color:var(--salon-accent)}
      .salon-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.salon-gallery button{padding:0;border:1px solid color-mix(in srgb,var(--salon-accent) 45%,transparent);border-radius:15px;overflow:hidden;aspect-ratio:1;background:#ffffff50;cursor:pointer}.salon-gallery img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .35s}.salon-gallery button:hover img{transform:scale(1.06)}.salon-footer{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:25px;padding-top:18px;border-top:1px solid color-mix(in srgb,var(--salon-accent) 20%,transparent);text-align:center}.salon-footer span{color:var(--salon-accent);font-size:19px}.salon-footer b{font-family:"El Messiri",serif;font-size:14px}.salon-footer small{font-size:10px;opacity:.58}
      .salon-orb{position:absolute;z-index:7;top:108px;width:61px;height:61px;display:grid;place-items:center;border-radius:50%;border:1px solid color-mix(in srgb,var(--salon-accent) 65%,white);box-shadow:0 12px 28px #0003,inset 0 1px #ffffff65;color:white;text-decoration:none;animation:salonFloat 3s ease-in-out infinite;transition:transform .2s}.salon-orb svg{display:block;width:27px;height:27px}.salon-left{left:-12px}.salon-right{right:-12px}.salon-orb-two{top:182px;animation-delay:.65s}.salon-instagram{background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)}.salon-whatsapp{background:#25d366}.salon-tiktok{background:#111}.salon-facebook{background:#1877f2}
      .salon-google-orb{position:absolute;z-index:8;left:50%;bottom:-40px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;width:76px;height:76px;border:1px solid #f3db7a;border-radius:50%;color:#4285f4;background:linear-gradient(145deg,#fff7c8,#f5dc68);box-shadow:0 14px 32px #0004,0 0 0 6px #f6df681a;text-decoration:none}.salon-google-orb svg{width:30px;height:30px}.salon-google-orb small{font-size:9px;font-weight:800;color:#4a3b0f}
      @keyframes salonFloat{0%,100%{translate:0 0}50%{translate:0 -9px}}@keyframes salonPulse{0%,100%{box-shadow:0 0 0 3px #43bd7a18}50%{box-shadow:0 0 0 7px #43bd7a08}}@keyframes salonShine{0%,38%{left:-45%}78%,100%{left:130%}}
      .salon-share{position:fixed;z-index:10;right:18px;bottom:18px;width:47px;height:47px;display:grid;place-items:center;border:1px solid #ffffff80;border-radius:50%;background:#ffffff52;color:var(--salon-ink);box-shadow:0 8px 25px #0002;backdrop-filter:blur(15px);cursor:pointer}.salon-share svg{width:21px;height:21px}.salon-toast{position:fixed;z-index:30;bottom:78px;left:50%;transform:translateX(-50%);max-width:calc(100vw - 30px);border:1px solid var(--salon-accent);border-radius:999px;background:var(--salon-bg);color:var(--salon-ink);padding:11px 16px;font:inherit;font-size:12px;box-shadow:0 10px 30px #0003;cursor:pointer}.salon-lightbox{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;padding:20px;background:#000d}.salon-lightbox img{max-width:100%;max-height:85vh;object-fit:contain;border-radius:14px}.salon-lightbox button{position:absolute;top:15px;right:20px;border:0;background:transparent;color:white;font-size:36px;cursor:pointer}
      @media(max-width:440px){.salon-root{padding-left:26px;padding-right:26px}.salon-orb{width:49px;height:49px}.salon-orb svg{width:22px;height:22px}.salon-left{left:-19px}.salon-right{right:-19px}.salon-orb-two{top:172px}.salon-card{padding-left:17px;padding-right:17px}}
      @media(max-width:340px){.salon-root{padding-left:28px;padding-right:28px}.salon-orb{width:42px;height:42px}.salon-orb-two{top:164px}.salon-google{gap:6px;padding-left:8px;padding-right:8px}.salon-google-copy small{font-size:9px}}
      .salon-static .salon-aurora i,.salon-static .salon-orb,.salon-static .salon-is-open i,.salon-static .salon-google:after{animation:none}
      @media(prefers-reduced-motion:reduce){.salon-aurora i,.salon-orb,.salon-is-open i,.salon-google:after{animation:none}.salon-contact,.salon-gallery img{transition:none}}
    `}</style>
  </main>;
}
