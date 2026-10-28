"use client";

import { useMemo, useState } from "react";

type HoursDay = { open: boolean; from: string; to: string };
type VIPShop = {
  name: string; logo?: string; bio?: string; coverImage?: string; hours?: Record<string, HoursDay>;
  phone?: string; whatsapp?: string; instagram?: string; tiktok?: string; facebook?: string;
  address?: string; mapUrl?: string; googleLink?: string; gallery?: string[];
};
const themes = [
  { id: "light", name: "Light", bg: "#f5f1e9", cardBg: "#fffdf8", accent: "#a77a32", text: "#30271d" },
  { id: "gold", name: "Gold", bg: "#17110d", cardBg: "#2D1E14", accent: "#C9A86A", text: "#f6ead7" },
  { id: "silver", name: "Silver", bg: "#17191d", cardBg: "#282b31", accent: "#c4cbd4", text: "#f1f4f8" },
  { id: "emerald", name: "Emerald", bg: "#081b16", cardBg: "#102b22", accent: "#65c7a0", text: "#e2f5ec" },
  { id: "ruby", name: "Ruby", bg: "#210d12", cardBg: "#35151d", accent: "#ef8999", text: "#ffe8ec" },
  { id: "amethyst", name: "Amethyst", bg: "#171020", cardBg: "#291a37", accent: "#c6a0f6", text: "#f4eafa" },
  { id: "lavender", name: "Lavender", bg: "#eee9f7", cardBg: "#fffaff", accent: "#8e75b9", text: "#342a45" },
  { id: "pink", name: "Pink", bg: "#27131e", cardBg: "#3b1c2c", accent: "#f2a0c7", text: "#ffedf6" },
];
const dayNames: Record<string,string> = { saturday: "السبت", sunday: "الأحد", monday: "الإثنين", tuesday: "الثلاثاء", wednesday: "الأربعاء", thursday: "الخميس", friday: "الجمعة" };
const dayOrder = ["saturday","sunday","monday","tuesday","wednesday","thursday","friday"];

export default function VIPShopTemplate({ shop }: { shop: VIPShop }) {
  const [themeId, setThemeId] = useState("gold");
  const [themeOpen, setThemeOpen] = useState(false);
  const [animation, setAnimation] = useState(true);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  const theme = themes.find((x) => x.id === themeId) || themes[1];
  const status = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-GB", { weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Africa/Algiers" }).formatToParts(new Date());
    const val = (type: string) => parts.find((x) => x.type === type)?.value || "";
    const day = val("weekday").toLowerCase();
    const now = Number(val("hour")) * 60 + Number(val("minute"));
    const h = shop.hours?.[day];
    if (!h?.open) {
      const next = dayOrder.map((key, i) => ({key, i})).find(({key, i}) => i > dayOrder.indexOf(day) && shop.hours?.[key]?.open) || dayOrder.map((key, i) => ({key, i})).find(({key}) => shop.hours?.[key]?.open);
      return { open: false, label: next ? `مغلق الآن · يفتح ${dayNames[next.key]} ${shop.hours?.[next.key]?.from || "09:00"}` : "أوقات العمل غير محددة" };
    }
    const mins = (time: string) => { const m = /^(\\d{2}):(\\d{2})$/.exec(time || ""); return m ? Number(m[1])*60+Number(m[2]) : -1; };
    const from = mins(h.from), to = mins(h.to);
    const open = from >= 0 && to >= 0 && (from < to ? now >= from && now < to : from > to ? now >= from || now < to : false);
    return { open, label: open ? "مفتوح الآن" : `مغلق الآن · يفتح ${h.from || "09:00"}` };
  }, [shop.hours]);
  const gallery = (shop.gallery || []).filter(Boolean).slice(0,4);
  const socials = [
    { label: "الهاتف", icon: "☎", url: shop.phone ? `tel:${shop.phone}` : "", color: "#80663c" },
    { label: "WhatsApp", icon: "◉", url: shop.whatsapp ? `https://wa.me/${shop.whatsapp.replace(/\\D/g,"")}` : "", color: "#20b96a" },
    { label: "Instagram", icon: "◎", url: shop.instagram || "", color: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)" },
    { label: "TikTok", icon: "♪", url: shop.tiktok || "", color: "#111111" },
    { label: "Facebook", icon: "f", url: shop.facebook || "", color: "#1877f2" },
  ].filter((x) => x.url);
  async function share() {
    const data = { title: shop.name, text: shop.bio || shop.name, url: window.location.href };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(window.location.href); setShareMessage("تم نسخ رابط البطاقة"); } }
    catch { setShareMessage("تقدر تنسخ رابط الصفحة من شريط العنوان"); }
  }
  async function install() {
    const promptEvent = (window as any).__pwaInstallPrompt;
    if (promptEvent) { await promptEvent.prompt(); return; }
    setShareMessage("من قائمة المتصفح اختار «إضافة إلى الشاشة الرئيسية»");
  }

  return <main className="vip-root" style={{"--vip-bg":theme.bg,"--vip-card":theme.cardBg,"--vip-accent":theme.accent,"--vip-text":theme.text} as React.CSSProperties}>
    <div className={`vip-backdrop ${animation ? "vip-pan" : ""}`} style={{backgroundImage:`linear-gradient(#0009,#000b),url("${shop.coverImage || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85"}")`}} />
    <article className="vip-card">
      <div className="vip-logo-wrap"><img className="vip-logo" src={shop.logo || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80"} alt={shop.name}/><span className="vip-verified" title="بطاقة موثقة">✓</span></div>
      <h1 className="vip-name">{shop.name}</h1>
      {shop.bio && <p className="vip-bio">{shop.bio}</p>}
      <div className={`vip-status ${status.open ? "is-open" : "is-closed"}`}><span className="vip-dot"/>{status.label}</div>
      <button className="vip-hours-button" onClick={() => setHoursOpen(!hoursOpen)} aria-expanded={hoursOpen}>◷ <span>أوقات العمل</span><small>السبت إلى الخميس · الجمعة</small><b>{hoursOpen ? "−" : "+"}</b></button>
      {hoursOpen && <div className="vip-hours-list">{dayOrder.map((day) => { const h=shop.hours?.[day]; return <div key={day}><span>{dayNames[day]}</span><strong>{h?.open ? `${h.from} – ${h.to}` : "مغلق"}</strong></div>; })}</div>}
      <a className="vip-google" href={shop.googleLink || "#"} target={shop.googleLink ? "_blank" : undefined} rel="noreferrer" onClick={(e) => { if (!shop.googleLink) e.preventDefault(); }}><span className="vip-google-g">G</span><span className="vip-google-copy"><strong>قيّمنا على Google</strong><span className="vip-stars">★★★★★</span><small>{shop.googleLink ? "شاركنا رأيك في تقييم Google" : "أضف رابط تقييم Google من إعدادات البطاقة"}</small></span><span className="vip-google-arrow">↗</span></a>
      <section className="vip-section"><h2>تواصل معنا</h2><div className="vip-socials">{socials.map((item) => <a key={item.label} href={item.url} target={item.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer"><span className={`vip-social-icon vip-brand-${item.label.toLowerCase()}`} style={{background:item.color}}>{item.label === "WhatsApp" ? <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 3.5A11.8 11.8 0 0 0 2 17.7L.5 23.5l6-1.6A11.8 11.8 0 0 0 20.5 3.5ZM12 21a9.7 9.7 0 0 1-4.9-1.3l-.4-.2-3.6 1 1-3.5-.2-.4A9.7 9.7 0 1 1 12 21Zm5.3-7.3c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7.1a8 8 0 0 1-2.3-1.4 8.5 8.5 0 0 1-1.6-2c-.2-.3 0-.5.1-.7l.5-.5c.1-.2.2-.4.3-.6s0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.3 1 2.7 1.2 2.9a11 11 0 0 0 4.3 3.8c.6.3 1.1.5 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.4s.2-1.3.1-1.4-.2-.2-.5-.4Z"/></svg> : item.label === "Instagram" ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2.2"/><circle cx="17.6" cy="6.6" r="1.3" fill="currentColor"/></svg> : item.label === "TikTok" ? <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.6 8.1a7.2 7.2 0 0 1-4.3-1.4v8.1a6 6 0 1 1-5.2-5.9v3.3a2.8 2.8 0 1 0 1.9 2.6V2.5h3.3a7.2 7.2 0 0 0 4.3 4.4v3.2Z"/></svg> : item.label === "Facebook" ? <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.7 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6H17V3.1c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5v2.1H7.2v3.2h2.9V21Z"/></svg> : item.label === "الهاتف" ? <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 2.8 9.4 2l2 5-2.1 1.5a15.2 15.2 0 0 0 6.2 6.2l1.5-2.1 5 2-.8 2.8a3 3 0 0 1-3.1 2.2A16.8 16.8 0 0 1 4.4 5.9a3 3 0 0 1 2.2-3.1Z"/></svg> : item.icon}</span><small>{item.label}</small></a>)}</div></section>
      {gallery.length > 0 && <section className="vip-section"><h2>معرض الصور <span>▧</span></h2><div className="vip-gallery">{gallery.map((src,i)=><button key={src+i} onClick={()=>setLightbox(src)} aria-label={`عرض الصورة ${i+1}`}><img src={src} alt={`صورة من ${shop.name}`}/></button>)}</div></section>}
      {shop.address && <a className="vip-map" href={shop.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`} target="_blank" rel="noreferrer">⌖ <span>اعثر علينا على الخريطة</span><small>{shop.address}</small><b>↗</b></a>}
      <footer className="vip-footer">بطاقة VIP · بطاقتي</footer>
    </article>
    <div className="vip-floating vip-floating-right"><button onClick={share} aria-label="مشاركة">↗</button><button onClick={install} aria-label="تثبيت البطاقة">＋</button></div>
    <div className="vip-floating vip-floating-left"><button onClick={()=>setThemeOpen(true)} aria-label="تغيير المظهر">◐</button><button onClick={()=>setAnimation(!animation)} aria-label="تشغيل أو إيقاف الحركة">{animation ? "✦" : "◇"}</button></div>
    {shareMessage && <div className="vip-toast" role="status" onClick={()=>setShareMessage("")}>{shareMessage} ×</div>}
    {themeOpen && <div className="vip-modal-backdrop" onClick={()=>setThemeOpen(false)}><section className="vip-theme-modal" onClick={(e)=>e.stopPropagation()}><div className="vip-modal-grabber"/><div className="vip-modal-heading"><h2>اختر المظهر</h2><button onClick={()=>setThemeOpen(false)}>✕</button></div><div className="vip-theme-grid">{themes.map((t)=><button key={t.id} onClick={()=>setThemeId(t.id)} className={themeId===t.id ? "vip-theme-option selected" : "vip-theme-option"}><span style={{background:t.bg,borderColor:t.accent}}><i style={{background:t.accent}}/><i style={{background:t.cardBg}}/></span><strong>{t.name}</strong><small>{themeId===t.id ? "✓ مختار" : "اختيار"}</small></button>)}</div><label className="vip-animation-toggle"><input type="checkbox" checked={animation} onChange={(e)=>setAnimation(e.target.checked)}/> تشغيل حركة الخلفية</label><button className="vip-theme-done" onClick={()=>setThemeOpen(false)}>تم</button></section></div>}
    {lightbox && <div className="vip-lightbox" role="dialog" aria-modal="true" onClick={()=>setLightbox(null)}><button aria-label="إغلاق" onClick={()=>setLightbox(null)}>×</button><img src={lightbox} alt={shop.name}/></div>}
    <style jsx>{`
      .vip-root{min-height:100vh;background:var(--vip-bg);color:var(--vip-text);position:relative;isolation:isolate;padding:44px 16px 110px;overflow:hidden;font-family:Arial,sans-serif}
      .vip-backdrop{position:fixed;inset:-4%;z-index:-2;background-size:cover;background-position:center;filter:blur(25px);transform:scale(1.08);opacity:1}.vip-pan{animation:vipPan 34s ease-in-out infinite alternate}@keyframes vipPan{from{background-position:42% 45%;transform:scale(1.08)}to{background-position:60% 55%;transform:scale(1.18)}}
      .vip-card{position:relative;width:100%;max-width:340px;box-sizing:border-box;margin:18px auto 0;padding:76px 18px 20px;border:1px solid var(--vip-accent);border-radius:32px;background:color-mix(in srgb,var(--vip-card) 95%,transparent);box-shadow:0 28px 90px #0007;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
      .vip-logo-wrap{position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:120px;height:120px}.vip-logo{width:120px;height:120px;object-fit:cover;border-radius:50%;border:3px solid var(--vip-accent);box-shadow:0 8px 32px #0008;background:var(--vip-card)}.vip-verified{position:absolute;right:0;bottom:4px;background:#1688ff;color:white;border:2px solid var(--vip-card);width:27px;height:27px;border-radius:50%;display:grid;place-items:center;font-weight:900}
      .vip-name{text-align:center;font-family:Georgia,serif;font-size:32px;font-weight:700;color:var(--vip-accent);letter-spacing:.2px}.vip-bio{text-align:center;font-size:13px;line-height:1.8;color:var(--vip-text);opacity:.85;margin:7px auto 15px;max-width:310px}
      .vip-status{display:flex;align-items:center;justify-content:center;gap:8px;margin:0 auto 16px;padding:8px 12px;border-radius:999px;width:fit-content;font-size:12px;font-weight:700}.is-open{background:#123b2b;color:#8ce6b8}.is-closed{background:#4b1d21;color:#ffb5b5}.vip-dot{width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 0 4px #ffffff10}
      .vip-hours-button,.vip-map{display:flex;align-items:center;gap:10px;width:100%;border:1px solid color-mix(in srgb,var(--vip-accent) 48%,transparent);border-radius:16px;padding:12px;color:var(--vip-text);text-align:right;background:#ffffff08}.vip-hours-button>span{font-weight:700;font-size:13px}.vip-hours-button small{margin-right:auto;font-size:10px;opacity:.75}.vip-hours-button>b{color:var(--vip-accent);font-size:20px}.vip-hours-list{margin-top:8px;padding:10px 13px;border-radius:14px;background:#0002}.vip-hours-list div{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #ffffff12;font-size:12px}.vip-hours-list div:last-child{border:0}.vip-hours-list strong{color:var(--vip-accent)}
      .vip-google{position:relative;overflow:hidden;margin-top:15px;display:flex;align-items:center;gap:12px;background:#ffeb3b;color:#342c0b;border-radius:16px;padding:13px 14px;text-decoration:none;box-shadow:0 8px 24px #0002}.vip-google:after{content:"";position:absolute;inset:-60% auto -60% -45%;width:28%;background:linear-gradient(90deg,transparent,#ffffffa8,transparent);transform:rotate(22deg);animation:vipShine 3.8s ease-in-out infinite;pointer-events:none}@keyframes vipShine{0%,35%{left:-45%}75%,100%{left:130%}}.vip-google-g{font-size:30px;font-weight:900;font-family:Arial;background:conic-gradient(from -45deg,#4285f4 0 25%,#34a853 25% 45%,#fbbc05 45% 68%,#ea4335 68% 82%,#4285f4 82%);color:transparent;background-clip:text}.vip-google-copy{display:flex;flex-direction:column;gap:3px;flex:1}.vip-google-copy strong{font-size:13px}.vip-stars{font-size:17px;letter-spacing:2px;color:#9b6b00}.vip-google-copy small{font-size:10px}.vip-google-arrow{font-size:18px}
      .vip-section{margin-top:23px}.vip-section h2{font-size:14px;font-weight:800;margin-bottom:13px;display:flex;align-items:center;gap:7px}.vip-section h2 span{color:var(--vip-accent)}.vip-socials{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:13px 4px}.vip-socials a{min-width:0;grid-column:span 2;display:flex;flex-direction:column;align-items:center;gap:7px;text-decoration:none;color:var(--vip-text);font-size:10px}.vip-socials a:nth-child(4):nth-last-child(2){grid-column:2/span 2}.vip-socials a:nth-child(5):last-child{grid-column:4/span 2}.vip-social-icon{width:65px;height:65px;border:1px solid var(--vip-accent);border-radius:50%;display:grid;place-items:center;color:white;font-size:21px;font-weight:800;background-color:#ffffff14!important;border:2px solid var(--vip-accent);box-shadow:0 5px 18px #0003,inset 0 1px 10px #ffffff1a;backdrop-filter:blur(12px);animation:vipFloat 4s ease-in-out infinite,vipGlow 3s ease-in-out infinite}.vip-socials a:nth-child(2) .vip-social-icon{animation-delay:.25s,.4s}.vip-socials a:nth-child(3) .vip-social-icon{animation-delay:.5s,.8s}.vip-socials a:nth-child(4) .vip-social-icon{animation-delay:.75s,1.2s}.vip-socials a:nth-child(5) .vip-social-icon{animation-delay:1s,1.6s}@keyframes vipFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes vipGlow{0%,100%{box-shadow:0 5px 14px #0002,0 0 0 #c9a86a00}50%{box-shadow:0 7px 22px #0004,0 0 16px color-mix(in srgb,var(--vip-accent) 50%,transparent)}}.vip-socials small{font-size:10px;white-space:nowrap}.vip-social-icon svg{width:31px;height:31px;display:block;color:#fff}.vip-brand-whatsapp{background:#20b96a!important}.vip-brand-instagram{background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)!important}.vip-brand-tiktok{background:#111!important}.vip-brand-facebook{background:#1877f2!important}.vip-brand-الهاتف{background:#80663c!important}
      .vip-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.vip-gallery button{padding:0;overflow:hidden;aspect-ratio:1;border:1px solid var(--vip-accent);border-radius:16px;background:#0002}.vip-gallery img{width:100%;height:100%;object-fit:cover;transition:transform .3s}.vip-gallery button:hover img{transform:scale(1.05)}
      .vip-map{margin-top:22px;background:var(--vip-accent);color:#21170c;border:0;text-decoration:none;font-weight:800;padding:14px}.vip-map span{font-size:13px}.vip-map small{font-weight:500;font-size:10px;opacity:.85;margin-right:auto}.vip-map b{font-size:18px}.vip-footer{text-align:center;font-size:10px;opacity:.6;margin-top:22px}
      .vip-floating{position:fixed;bottom:18px;z-index:5;display:flex;gap:8px}.vip-floating-right{right:18px}.vip-floating-left{left:18px}.vip-floating button{width:48px;height:48px;border-radius:14px;border:1px solid var(--vip-accent);background:var(--vip-card);color:var(--vip-accent);box-shadow:0 8px 24px #0005;font-size:22px;font-weight:700}
      .vip-modal-backdrop{position:fixed;inset:0;z-index:10;background:#0009;display:flex;align-items:flex-end;justify-content:center}.vip-theme-modal{width:100%;max-width:520px;background:var(--vip-card);color:var(--vip-text);border:1px solid var(--vip-accent);border-radius:26px 26px 0 0;padding:14px 20px 28px;box-shadow:0 -18px 70px #0007;animation:vipSlide .25s ease-out}@keyframes vipSlide{from{transform:translateY(40px);opacity:.5}to{transform:translateY(0);opacity:1}}.vip-modal-grabber{width:42px;height:4px;border-radius:8px;background:var(--vip-accent);opacity:.55;margin:0 auto 18px}.vip-modal-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.vip-modal-heading h2{font-size:19px;font-weight:800}.vip-modal-heading button{font-size:20px}.vip-theme-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.vip-theme-option{display:flex;align-items:center;flex-direction:column;gap:5px;font-size:11px}.vip-theme-option>span{height:46px;width:100%;border:2px solid;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:4px}.vip-theme-option i{width:13px;height:20px;border-radius:4px;display:block}.vip-theme-option.selected strong{color:var(--vip-accent)}.vip-theme-option small{font-size:9px;opacity:.7}.vip-animation-toggle{display:flex;align-items:center;gap:10px;margin-top:20px;font-size:13px}.vip-animation-toggle input{accent-color:var(--vip-accent);width:17px;height:17px}.vip-theme-done{margin-top:18px;width:100%;padding:13px;border-radius:13px;background:var(--vip-accent);color:#20170c;font-weight:800}
      .vip-lightbox{position:fixed;inset:0;z-index:20;background:#000e;display:flex;align-items:center;justify-content:center;padding:20px}.vip-lightbox img{max-width:100%;max-height:85vh;object-fit:contain;border-radius:12px}.vip-lightbox button{position:absolute;top:18px;right:20px;font-size:36px;color:white}.vip-toast{position:fixed;z-index:30;bottom:80px;left:50%;transform:translateX(-50%);padding:12px 16px;background:var(--vip-card);border:1px solid var(--vip-accent);border-radius:14px;font-size:12px;box-shadow:0 8px 30px #0008}
      @media(max-width:380px){.vip-card{max-width:340px;padding-left:14px;padding-right:14px}.vip-google{gap:8px}.vip-google-copy strong{font-size:12px}.vip-social-icon{width:58px;height:58px}.vip-socials{gap:12px 2px}.vip-socials small{font-size:9px}}
      @media(prefers-reduced-motion:reduce){.vip-pan,.vip-theme-modal,.vip-social-icon,.vip-google:after{animation:none}}
    `}</style>
  </main>;
}
