"use client";

import { useState } from "react";
import Link from "next/link";

const translations = {
  ar: { home: "الرئيسية", features: "المميزات", how: "كيفية الاستخدام", products: "المنتجات", demo: "جرّب البروفايل", login: "تسجيل الدخول", contact: "تواصل معنا", order: "اطلب بطاقتك الآن", dashboard: "لوحة التحكم", admin: "إدارة المتجر" },
  fr: { home: "Accueil", features: "Avantages", how: "Comment ça marche", products: "Produits", demo: "Essayer le profil", login: "Connexion", contact: "Contact", order: "Commander maintenant", dashboard: "Tableau de bord", admin: "Gérer la boutique" },
  en: { home: "Home", features: "Features", how: "How it works", products: "Products", demo: "Try the profile", login: "Log in", contact: "Contact us", order: "Order your card", dashboard: "Dashboard", admin: "Manage store" },
} as const;

export default function StorefrontNav({ isLoggedIn, isAdmin }: { isLoggedIn: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"ar" | "fr" | "en">("ar");
  const t = translations[lang];
  const rtl = lang === "ar";
  const links = [
    { href: "/", label: t.home },
    { href: "/#features", label: t.features },
    { href: "/#how", label: t.how },
    { href: "/#pricing", label: t.products },
    { href: "/#gallery", label: t.demo },
    { href: "/#faq", label: t.contact },
  ];
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="فتح القائمة" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-3xl text-emerald-800 shadow-sm hover:bg-emerald-100">☰</button>
    
    {open && <div className="fixed inset-0 z-[100]" dir={rtl ? "rtl" : "ltr"}>
      <button type="button" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} className="absolute inset-0 h-full w-full bg-slate-950/50"/>
      <aside className={`absolute inset-y-0 ${rtl ? "right-0" : "left-0"} flex w-[min(86vw,420px)] flex-col bg-[#f8fbf9] p-6 text-slate-900 shadow-2xl`}>
        <div className="flex items-center justify-between"><span className="text-xl font-black text-emerald-800">بطاقتي</span><button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1 text-2xl hover:bg-emerald-50" aria-label="إغلاق">×</button></div>
        <div className="mt-8 grid grid-cols-3 gap-2 rounded-2xl bg-emerald-50 p-2">
          {(["ar","fr","en"] as const).map(code => <button key={code} type="button" onClick={() => setLang(code)} className={`rounded-xl px-2 py-3 text-sm font-black ${lang===code ? "bg-emerald-600 text-white shadow" : "text-slate-700"}`}>{code==="ar"?"🇩🇿 العربية":code==="fr"?"🇫🇷 Français":"🇬🇧 English"}</button>)}
        </div>
        <div className="mt-7 space-y-1">{links.map((l,i)=><Link onClick={()=>setOpen(false)} key={l.href} href={l.href} className="flex items-center gap-4 rounded-xl px-4 py-4 text-lg font-semibold hover:bg-emerald-50"><span className="w-7 text-center text-xl text-emerald-700">{["⌂","✧","ⓘ","▣","♙","☎"][i]}</span>{l.label}</Link>)}
          {isLoggedIn && <Link onClick={()=>setOpen(false)} href="/dashboard" className="flex items-center gap-4 rounded-xl px-4 py-4 text-lg font-semibold hover:bg-emerald-50"><span className="w-7 text-center">♙</span>{t.dashboard}</Link>}
          {isAdmin && <Link onClick={()=>setOpen(false)} href="/admin/store" className="flex items-center gap-4 rounded-xl px-4 py-4 text-lg font-semibold hover:bg-emerald-50"><span className="w-7 text-center">▤</span>{t.admin}</Link>}
          <Link onClick={()=>setOpen(false)} href={isLoggedIn?"/dashboard":"/login"} className="flex items-center gap-4 rounded-xl px-4 py-4 text-lg font-semibold text-emerald-700"><span className="w-7 text-center">⇥</span>{isLoggedIn?t.dashboard:t.login}</Link>
        </div>
        <Link onClick={()=>setOpen(false)} href="/#pricing" className="mt-7 rounded-2xl bg-emerald-600 px-5 py-4 text-center font-black text-white shadow-lg">{t.order}　▣</Link>
        <p className="mt-auto pt-8 text-center text-xs text-slate-400">بطاقتي · NFC & QR</p>
      </aside>
    </div>}
  </>;
}
