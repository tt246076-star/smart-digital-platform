"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSiteLanguage, type SiteLanguage } from "@/components/GlobalLanguageProvider";

function MenuIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>; }
function EyeIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>; }
function MoonIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.7 8.7 0 1 0 20.5 14.2Z"/></svg>; }
function GlobeIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.7 2.4 4 5.4 4 9s-1.3 6.6-4 9c-2.7-2.4-4-5.4-4-9s1.3-6.6 4-9Z"/></svg>; }
function GearIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1 1.9-2 3.4-2.2-.5a8 8 0 0 1-1.8 1l-.7 2.1h-4l-.7-2.1a8 8 0 0 1-1.8-1l-2.2.5-2-3.4 1.1-1.9A8 8 0 0 1 4 12c0-.7.1-1.4.3-2L3.2 8.1l2-3.4 2.2.5a8 8 0 0 1 1.8-1L10 2h4l.7 2.1a8 8 0 0 1 1.8 1l2.2-.5 2 3.4L19.6 10c.2.6.4 1.3.4 2s-.2 1.4-.6 3Z"/></svg>; }

const languageNames: Record<SiteLanguage, { native: string; english: string; flag: string }> = {
  ar: { native: "العربية", english: "Arabic", flag: "🇩🇿" },
  fr: { native: "Français", english: "French", flag: "🇫🇷" },
  en: { native: "English", english: "English", flag: "🇬🇧" },
};

export default function SiteHeaderControls({ isLoggedIn, isAdmin }: { isLoggedIn: boolean; isAdmin: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [preview, setPreview] = useState(false);
  const { language, setLanguage } = useSiteLanguage();

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("bitaqati-theme");
      const savedPreview = window.localStorage.getItem("bitaqati-preview") === "1";
      const isDark = savedTheme === "dark";
      setDark(isDark);
      setPreview(savedPreview);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.classList.toggle("site-preview-mode", savedPreview);
    } catch {}
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { window.localStorage.setItem("bitaqati-theme", next ? "dark" : "light"); } catch {}
  }
  function togglePreview() {
    const next = !preview;
    setPreview(next);
    document.documentElement.classList.toggle("site-preview-mode", next);
    try { window.localStorage.setItem("bitaqati-preview", next ? "1" : "0"); } catch {}
  }

  const links = [
    ["/", "الرئيسية", "⌂"],
    ["/#features", "المميزات", "✧"],
    ["/#how", "كيفية الاستخدام", "?"],
    ["/#pricing", "المنتجات والأسعار", "▣"],
    ["/#gallery", "جرّب البروفايل", "♙"],
    ["/#faq", "تواصل معنا", "☎"],
  ];

  function changeLanguage(value: SiteLanguage) {
    setLanguage(value);
    setLanguageOpen(false);
  }

  return <>
    <div className="site-header-controls" dir="ltr">
      <button type="button" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة" title="القائمة" className="site-header-icon site-menu-button"><MenuIcon /></button>
      <button type="button" onClick={togglePreview} aria-label="معاينة الواجهة" title="معاينة الواجهة" aria-pressed={preview} className={`site-header-icon site-tool-button ${preview ? "is-active" : ""}`}><EyeIcon /></button>
      <button type="button" onClick={toggleTheme} aria-label="الوضع الداكن" title="الوضع الداكن" aria-pressed={dark} className={`site-header-icon site-tool-button ${dark ? "is-active" : ""}`}><MoonIcon /></button>
      <button type="button" onClick={() => setLanguageOpen(true)} aria-label="اختيار اللغة" title="اختيار اللغة" className="site-header-icon site-tool-button site-language-button"><GlobeIcon /></button>
      {isLoggedIn && <Link href="/settings" aria-label="الإعدادات" title="الإعدادات" className="site-header-icon site-tool-button"><GearIcon /></Link>}
    </div>

    {menuOpen && <div className="site-overlay" dir={language === "ar" ? "rtl" : "ltr"}>
      <button type="button" className="site-overlay-backdrop" aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)} />
      <aside className={`site-drawer ${language === "ar" ? "drawer-right" : "drawer-left"}`} role="dialog" aria-modal="true" aria-label="القائمة الرئيسية">
        <div className="site-drawer-heading"><div className="site-drawer-brand"><img src="/brand/bitakaty-mark.svg" alt="" /><span>بطاقتي</span></div><button type="button" className="site-close-button" onClick={() => setMenuOpen(false)} aria-label="إغلاق">×</button></div>
        <button type="button" className="site-drawer-language" onClick={() => { setMenuOpen(false); setLanguageOpen(true); }}><GlobeIcon /><span>اللغة / Language</span><strong>{languageNames[language].flag}</strong></button>
        <nav className="site-drawer-links">{links.map(([href, label, icon]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}><span className="site-drawer-link-icon">{icon}</span><span>{label}</span><span className="site-drawer-arrow">‹</span></Link>)}
          {isLoggedIn && <Link href="/dashboard" onClick={() => setMenuOpen(false)}><span className="site-drawer-link-icon">♙</span><span>لوحة التحكم</span><span className="site-drawer-arrow">‹</span></Link>}
          {isAdmin && <Link href="/admin/store" onClick={() => setMenuOpen(false)}><span className="site-drawer-link-icon">▤</span><span>إدارة المنتجات والطلبات</span><span className="site-drawer-arrow">‹</span></Link>}
          {!isLoggedIn && <Link href="/login" onClick={() => setMenuOpen(false)}><span className="site-drawer-link-icon">⇥</span><span>تسجيل الدخول</span><span className="site-drawer-arrow">‹</span></Link>}
          {!isLoggedIn && <Link href="/signup" onClick={() => setMenuOpen(false)}><span className="site-drawer-link-icon">＋</span><span>إنشاء حساب</span><span className="site-drawer-arrow">‹</span></Link>}
          {isLoggedIn && <Link href="/settings" onClick={() => setMenuOpen(false)}><span className="site-drawer-link-icon">⚙</span><span>الإعدادات</span><span className="site-drawer-arrow">‹</span></Link>}
        </nav>
        <Link href="/#pricing" onClick={() => setMenuOpen(false)} className="site-drawer-cta">اطلب بطاقتك الآن <span>▣</span></Link>
        <a href="https://wa.me/213557829036" target="_blank" rel="noreferrer" className="site-drawer-whatsapp">تواصل معنا عبر واتساب</a>
        <p className="site-drawer-footer">بطاقتي · NFC · QR</p>
      </aside>
    </div>}

    {languageOpen && <div className="site-language-overlay" dir={language === "ar" ? "rtl" : "ltr"}>
      <button type="button" className="site-overlay-backdrop" aria-label="إغلاق اختيار اللغة" onClick={() => setLanguageOpen(false)} />
      <section role="dialog" aria-modal="true" aria-labelledby="site-language-title" className="site-language-dialog">
        <div className="site-language-heading"><div><p className="site-language-kicker">LANGUAGE / LANGUE</p><h2 id="site-language-title">اختر اللغة</h2></div><button type="button" onClick={() => setLanguageOpen(false)} aria-label="إغلاق" className="site-close-button">×</button></div>
        {(["ar", "fr", "en"] as SiteLanguage[]).map(code => <button type="button" key={code} onClick={() => changeLanguage(code)} className={`site-language-option ${language === code ? "selected" : ""}`}>
          <span className="site-language-flag">{languageNames[code].flag}</span><span className="site-language-label"><strong>{languageNames[code].native}</strong><small>{languageNames[code].english}</small></span><span className="site-language-check">{language === code ? "✓" : ""}</span>
        </button>)}
      </section>
    </div>}
  </>;
}
