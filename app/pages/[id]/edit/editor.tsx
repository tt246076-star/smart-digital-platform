"use client";

import { useMemo, useState } from "react";
import { updateLandingPage } from "./actions";
import { createClient } from "@/lib/supabase/client";

type PageData = {
  id: string; slug: string; business_name: string; headline: string; description: string;
  phone: string; whatsapp: string; logo_url: string; instagram_url: string; facebook_url: string;
  tiktok_url: string; youtube_url: string; custom_links: { label: string; url: string }[] | null;
  template: string | null; theme: string | null; seo_title: string | null; seo_description: string | null;
};

const themes = [
  { id: "violet", name: "بنفسجي", main: "#7c3aed", soft: "#f5f3ff", dark: "#1e1b4b" },
  { id: "ocean", name: "أزرق", main: "#0284c7", soft: "#f0f9ff", dark: "#082f49" },
  { id: "sunset", name: "غروب", main: "#ea580c", soft: "#fff7ed", dark: "#431407" },
  { id: "emerald", name: "أخضر", main: "#059669", soft: "#ecfdf5", dark: "#022c22" },
  { id: "rose", name: "وردي", main: "#e11d48", soft: "#fff1f2", dark: "#4c0519" },
];
const templates = [
  { id: "aurora", name: "Aurora", hint: "متدرّج وعصري" },
  { id: "store", name: "Store", hint: "متجر وبيع" },
  { id: "minimal", name: "Minimal", hint: "بسيط وراقي" },
  { id: "bold", name: "Bold", hint: "جريء ولافت" },
];
const field = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100";
const label = "block text-sm font-extrabold text-slate-800";

export default function LandingPageEditor({ page }: { page: PageData }) {
  const [template, setTemplate] = useState(page.template || "aurora");
  const [theme, setTheme] = useState(page.theme || "violet");
  const [logo, setLogo] = useState(page.logo_url || "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [business, setBusiness] = useState(page.business_name);
  const [headline, setHeadline] = useState(page.headline || "");
  const [description, setDescription] = useState(page.description || "");
  const [phone, setPhone] = useState(page.phone || "");
  const [seoTitle, setSeoTitle] = useState(page.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(page.seo_description || "");
  const activeTheme = themes.find((item) => item.id === theme) || themes[0];
  const previewClass = useMemo(() => template === "minimal" ? "rounded-2xl border bg-white" : template === "bold" ? "rounded-3xl border-2 shadow-xl" : template === "store" ? "rounded-2xl border shadow-md" : "rounded-3xl border shadow-xl", [template]);

  async function uploadLogo(file?: File) {
    if (!file) return;
    setUploadError("");
    if (!file.type.startsWith("image/")) { setUploadError("اختار ملف صورة فقط."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("الصورة لازم تكون أقل من 5 ميغابايت."); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
      const path = `${page.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("landing-logos").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("landing-logos").getPublicUrl(path);
      setLogo(data.publicUrl);
    } catch {
      setUploadError("ما قدرناش نرفع الصورة. تأكد أنك نفذت إعداد تخزين الصور في Supabase.");
    } finally { setUploading(false); }
  }

  return (
    <form action={updateLandingPage} className="mt-8 space-y-8">
      <input type="hidden" name="id" value={page.id} />
      <input type="hidden" name="template" value={template} />
      <input type="hidden" name="theme" value={theme} />
      <input type="hidden" name="logo_url" value={logo} />
      <section>
        <h2 className="text-lg font-black text-slate-950">1. اختار القالب</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {templates.map((item) => <button key={item.id} type="button" onClick={() => setTemplate(item.id)} className={`rounded-2xl border p-3 text-right transition hover:-translate-y-0.5 hover:shadow-md ${template === item.id ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200" : "border-slate-200 bg-white"}`}>
            <div className="mb-3 h-12 overflow-hidden rounded-lg" style={{ background: item.id === "minimal" ? "#f8fafc" : item.id === "bold" ? activeTheme.dark : item.id === "store" ? activeTheme.soft : `linear-gradient(135deg,${activeTheme.main},#111827)` }}>
              <div className="mx-2 mt-2 h-2 w-1/2 rounded-full bg-white/80" /><div className="mx-2 mt-1 h-1.5 w-3/4 rounded-full bg-white/40" />
            </div>
            <span className="block text-sm font-black text-slate-900">{item.name}</span><span className="mt-1 block text-xs text-slate-500">{item.hint}</span>
          </button>)}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-black text-slate-950">2. اختار اللون الرئيسي</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {themes.map((item) => <button key={item.id} type="button" onClick={() => setTheme(item.id)} aria-pressed={theme === item.id} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition ${theme === item.id ? "border-slate-900 ring-2 ring-slate-200" : "border-slate-200"}`}><span className="h-5 w-5 rounded-full" style={{ background: item.main }} />{item.name}{theme === item.id ? " ✓" : ""}</button>)}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-950">3. معلومات الصفحة</h2>
        <div><label className={label} htmlFor="business_name">اسم النشاط *</label><input className={field} id="business_name" name="business_name" value={business} onChange={(e) => setBusiness(e.target.value)} required maxLength={100} /></div>
        <div><label className={label} htmlFor="headline">العنوان الرئيسي</label><input className={field} id="headline" name="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={140} placeholder="مثال: اختيارات مميزة تناسبك" /></div>
        <div><label className={label} htmlFor="description">وصف النشاط</label><textarea className={field} id="description" name="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} /></div>
        <div><label className={label} htmlFor="phone">رقم الهاتف</label><input className={field} id="phone" name="phone" type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} /></div>
        <div><label className={label} htmlFor="whatsapp">رقم واتساب</label><input className={field} id="whatsapp" name="whatsapp" type="tel" dir="ltr" defaultValue={page.whatsapp} maxLength={30} /></div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-950">4. الشعار وروابط التواصل</h2>
        <div className="rounded-2xl border border-dashed border-slate-300 p-4">
          <label className={label} htmlFor="logo_upload">رفع شعار من الهاتف (حتى 5MB)</label>
          <input id="logo_upload" type="file" accept="image/*" onChange={(e) => uploadLogo(e.target.files?.[0])} className="mt-3 block w-full text-sm text-slate-600 file:ml-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:font-bold file:text-violet-800" />
          {uploading && <p className="mt-2 text-sm font-bold text-violet-700">جاري رفع الصورة...</p>}
          {uploadError && <p role="alert" className="mt-2 text-sm font-bold text-red-600">{uploadError}</p>}
          {logo && <div className="mt-3 flex items-center gap-3"><img src={logo} alt="معاينة الشعار" className="h-16 w-16 rounded-xl border object-cover" /><button type="button" onClick={() => setLogo("")} className="text-sm font-bold text-red-600">حذف الشعار</button></div>}
        </div>
        <div><label className={label} htmlFor="instagram_url">Instagram</label><input className={field} id="instagram_url" name="instagram_url" type="url" defaultValue={page.instagram_url} placeholder="https://instagram.com/..." /></div>
        <div><label className={label} htmlFor="facebook_url">Facebook</label><input className={field} id="facebook_url" name="facebook_url" type="url" defaultValue={page.facebook_url} placeholder="https://facebook.com/..." /></div>
        <div><label className={label} htmlFor="tiktok_url">TikTok</label><input className={field} id="tiktok_url" name="tiktok_url" type="url" defaultValue={page.tiktok_url} placeholder="https://tiktok.com/@..." /></div>
        <div><label className={label} htmlFor="youtube_url">YouTube</label><input className={field} id="youtube_url" name="youtube_url" type="url" defaultValue={page.youtube_url} placeholder="https://youtube.com/..." /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className={label} htmlFor="custom_label">اسم رابط إضافي</label><input className={field} id="custom_label" name="custom_label" defaultValue={page.custom_links?.[0]?.label || ""} maxLength={40} placeholder="موقع المتجر" /></div><div><label className={label} htmlFor="custom_url">الرابط الإضافي</label><input className={field} id="custom_url" name="custom_url" type="url" defaultValue={page.custom_links?.[0]?.url || ""} placeholder="https://..." /></div></div>
      </section>
      <section>
        <h2 className="text-lg font-black text-slate-950">معاينة مباشرة</h2>
        <div className="mt-3 rounded-3xl p-4 sm:p-6" style={{ background: activeTheme.soft }}>
          <div className={previewClass} style={{ borderColor: activeTheme.main + "30", background: "#fff" }}>
            <div className="h-2" style={{ background: template === "minimal" ? activeTheme.main : `linear-gradient(90deg,${activeTheme.main},${activeTheme.dark})` }} />
            <div className="px-5 py-7 text-center">
              {logo ? <img src={logo} alt="" className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover" /> : <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black text-white" style={{ background: activeTheme.main }}>{business.slice(0,1) || "م"}</div>}
              <p className="text-xs font-black" style={{ color: activeTheme.main }}>مرحبًا بكم</p>
              <h3 className="mt-2 text-2xl font-black" style={{ color: activeTheme.dark }}>{business || "اسم متجرك"}</h3>
              <p className="mt-2 font-bold text-slate-700">{headline || "عنوان جذاب لنشاطك التجاري"}</p>
              <p className="mx-auto mt-3 max-w-sm whitespace-pre-wrap text-sm leading-7 text-slate-500">{description || "اكتب وصفًا قصيرًا يشرح للزائر ماذا تقدم."}</p>
              <div className="mt-5 rounded-xl px-4 py-3 text-sm font-extrabold text-white" style={{ background: activeTheme.main }}>{phone ? `اتصل بنا · ${phone}` : "زر التواصل مع متجرك"}</div>
              <p className="mt-4 text-xs text-slate-400">تصميم {templates.find((item) => item.id === template)?.name} · بطاقاتي</p>
            </div>
          </div>
        </div>
      </section>
      <button disabled={uploading} type="submit" className="w-full rounded-xl bg-gradient-to-l from-violet-600 to-blue-600 px-5 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50">حفظ التعديلات ونشر الصفحة ✨</button>
    </form>
  );
}
