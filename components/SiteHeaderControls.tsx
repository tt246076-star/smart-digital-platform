"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

function MenuIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>; }
function MoonIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.7 8.7 0 1 0 20.5 14.2Z"/></svg>; }
function GearIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1 1.9-2 3.4-2.2-.5a8 8 0 0 1-1.8 1l-.7 2.1h-4l-.7-2.1a8 8 0 0 1-1.8-1l-2.2.5-2-3.4 1.1-1.9A8 8 0 0 1 4 12c0-.7.1-1.4.3-2L3.2 8.1l2-3.4 2.2.5a8 8 0 0 1 1.8-1L10 2h4l.7 2.1a8 8 0 0 1 1.8 1l2.2-.5 2 3.4L19.6 10c.2.6.4 1.3.4 2s-.2 1.4-.6 3Z"/></svg>; }

export default function SiteHeaderControls({ isLoggedIn, isAdmin }: { isLoggedIn: boolean; isAdmin: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("bitaqati-theme") || "dark";
      const isDark = savedTheme === "dark";
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.classList.toggle("light-mode", !isDark);
    } catch {}
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.classList.toggle("light-mode", !next);
    try { window.localStorage.setItem("bitaqati-theme", next ? "dark" : "light"); } catch {}
  }


  const links = [
    ["/", "الرئيسية", "⌂"],
    ["/#features", "المميزات", "✧"],
    ["/#how", "كيفية الاستخدام", "?"],
    ["/#pricing", "المنتجات والأسعار", "▣"],
    ["/#gallery", "جرّب البروفايل", "♙"],
    ["/#faq", "تواصل معنا", "☎"],
  ];



  return <>
    <div className="site-header-controls" dir="ltr">
      <button type="button" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة" title="القائمة" className="site-header-icon site-menu-button"><MenuIcon /></button>
      <button type="button" onClick={toggleTheme} aria-label="الوضع الداكن" title="الوضع الداكن" aria-pressed={dark} className={`site-header-icon site-tool-button site-theme-toggle ${dark ? "is-active" : ""}`}><MoonIcon /></button>
      <Link href={isLoggedIn ? "/settings" : "/login"} aria-label="الإعدادات" title="الإعدادات" className="site-header-icon site-tool-button site-settings-toggle"><GearIcon /></Link>
    </div>

    {menuOpen && typeof document !== "undefined" ? createPortal(<div className="site-overlay" dir={language === "ar" ? "rtl" : "ltr"} style={{ position: "fixed", inset: 0, zIndex: 2147483000, isolation: "isolate", display: "block", visibility: "visible", opacity: 1, overflow: "visible" }}>
      <button type="button" className="site-overlay-backdrop" aria-label="إغلاق القائمة" onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, zIndex: 0, width: "100%", height: "100%", background: "rgba(2, 6, 23, .62)", border: 0, display: "block" }} />
      <aside className={`site-drawer ${language === "ar" ? "drawer-right" : "drawer-left"}`} role="dialog" aria-modal="true" aria-label="القائمة الرئيسية" style={{ position: "absolute", zIndex: 2, top: 0, bottom: 0, right: language === "ar" ? 0 : "auto", left: language === "ar" ? "auto" : 0, width: "min(88vw, 390px)", minWidth: "280px", height: "100%", maxHeight: "100dvh", overflowY: "auto", overscrollBehavior: "contain", display: "flex", flexDirection: "column", visibility: "visible", opacity: 1, transform: "none", background: dark ? "#0c1f42" : "#f8fafc", color: dark ? "#e8edf7" : "#14261d", boxShadow: "0 16px 48px rgba(0,0,0,.28)", padding: "max(20px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom))", pointerEvents: "auto" }}>
        <div className="site-drawer-heading"><div className="site-drawer-brand"><img src="/brand/bitakaty-mark.svg" alt="" /><span>بطاقتي</span></div><button type="button" className="site-close-button" onClick={() => setMenuOpen(false)} aria-label="إغلاق">×</button></div>
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
    </div>, document.body) : null}


  </>;
}
