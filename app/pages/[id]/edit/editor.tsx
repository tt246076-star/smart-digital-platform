"use client";
// Vercel redeploy trigger: editor syntax fix

import { useState } from "react";
import { updateLandingPage } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { resolveTheme, themeVars, pagePrimary } from "@/lib/theme";

type PageData = {
  id: string; slug: string; business_name: string; headline: string; description: string;
  phone: string; whatsapp: string; logo_url: string; instagram_url: string; facebook_url: string;
  tiktok_url: string; youtube_url: string; custom_links: { label: string; url: string }[] | null;
  template: string | null; theme: string | null; seo_title: string | null; seo_description: string | null;
  sections: { theme_primary?: string; theme_mode?: string; address?: string; map_url?: string; hours?: string; card_color?: string; accent_color?: string; panel_color?: string; round_image_url?: string; cover_image_url?: string; products?: {name:string; price:string; image_url:string; description:string}[] } | null;
};

const templates = [
  {id:"store",name:"Store",hint:"بطاقة متجر بكتالوج المنتجات"},
  {id:"aurora",name:"Aurora",hint:"بطاقة نشاط كاملة بتصميم متدرّج"},
];
const weekDays = [["sunday","الأحد"],["monday","الإثنين"],["tuesday","الثلاثاء"],["wednesday","الأربعاء"],["thursday","الخميس"],["friday","الجمعة"],["saturday","السبت"]] as const;
type DayKey = typeof weekDays[number][0];
type DayHours = { open: boolean; from: string; to: string };
const defaultHours: Record<DayKey,DayHours> = Object.fromEntries(weekDays.map(([key]) => [key,{open:key!=="friday",from:"09:00",to:"18:00"}])) as Record<DayKey,DayHours>;
function readHours(value: string | undefined): Record<DayKey,DayHours> {
  try {
    const parsed = JSON.parse(value || "{}");
    return Object.fromEntries(weekDays.map(([key]) => {
      const day = parsed?.[key];
      return [key, { open: typeof day?.open === "boolean" ? day.open : defaultHours[key].open, from: /^\d{2}:\d{2}$/.test(day?.from || "") ? day.from : "09:00", to: /^\d{2}:\d{2}$/.test(day?.to || "") ? day.to : "18:00" }];
    })) as Record<DayKey,DayHours>;
  } catch { return defaultHours; }
}
const field = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100";
const label = "block text-sm font-extrabold text-slate-800";

export default function LandingPageEditor({ page }: { page: PageData }) {
  const [template, setTemplate] = useState(page.template === "store" ? "store" : "aurora");
  const [theme, setTheme] = useState("white");
  const [logo, setLogo] = useState(page.logo_url || "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [business, setBusiness] = useState(page.business_name);
  const [headline, setHeadline] = useState(page.headline || "");
  const [description, setDescription] = useState(page.description || "");
  const [phone, setPhone] = useState(page.phone || "");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("desktop");
  const [seoTitle, setSeoTitle] = useState(page.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(page.seo_description || "");
  const initialSections = page.sections || {};
  const [address, setAddress] = useState(initialSections.address || "");
  const [mapUrl, setMapUrl] = useState(initialSections.map_url || "");
  const [hours, setHours] = useState<Record<DayKey, DayHours>>(() => readHours(initialSections.hours));
  const [primary, setPrimary] = useState<string>(pagePrimary(initialSections as any) || "");
  const [mode, setMode] = useState<"" | "light" | "dark">(initialSections.theme_mode === "light" || initialSections.theme_mode === "dark" ? initialSections.theme_mode : "");
  const [roundImageUrl, setRoundImageUrl] = useState(initialSections.round_image_url || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialSections.cover_image_url || "");
  const [products, setProducts] = useState(() => Array.from({length:Math.max(3, initialSections.products?.length || 0)}, (_,i) => initialSections.products?.[i] || {name:"",price:"",image_url:"",description:""}));
  const sectionsJson = JSON.stringify({address,map_url:mapUrl,hours:JSON.stringify(hours),theme_primary:primary,theme_mode:mode,round_image_url:roundImageUrl,cover_image_url:coverImageUrl,products:products.filter(p=>p.name.trim() || p.image_url.trim() || p.price.trim())});
  const activeDef = { id: "white" };
  const resolved = resolveTheme("white", primary || undefined, mode || undefined);
  const vars = themeVars(resolved);
  const todayKey = weekDays[new Date().getDay()][0];
  const todayHours = hours[todayKey];

  async function uploadImage(file: File | undefined, target: "logo" | "round" | "cover" | number) {
    if (!file) return;
    setUploadError("");
    if (!file.type.startsWith("image/")) { setUploadError("اختار ملف صورة فقط."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("الصورة لازم تكون أقل من 5 ميغابايت."); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
      const targetName = typeof target === "number" ? `product-${target + 1}` : target;
      const path = `${page.id}/${targetName}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("landing-logos").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("landing-logos").getPublicUrl(path);
      if (target === "logo") setLogo(data.publicUrl);
      else if (target === "round") setRoundImageUrl(data.publicUrl);
      else if (target === "cover") setCoverImageUrl(data.publicUrl);
      else setProducts(old => old.map((p, i) => i === target ? { ...p, image_url: data.publicUrl } : p));
    } catch {
      setUploadError("ما قدرناش نرفع الصورة. تأكد أن Bucket landing-logos موجود ومسموح برفع الصور في Supabase.");
    } finally { setUploading(false); }
  }

  return (
    <form action={updateLandingPage} className="mt-8">
      <input type="hidden" name="id" value={page.id} />
      <input type="hidden" name="template" value={template} />
      <input type="hidden" name="theme" value={theme} />
      <input type="hidden" name="logo_url" value={logo} />
      <input type="hidden" name="sections" value={sectionsJson} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]"><div className="min-w-0 space-y-8">
      <section>
        <h2 className="text-lg font-black text-slate-950">1. اختر القالب</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {templates.map(item=><button key={item.id} type="button" onClick={()=>setTemplate(item.id)} className={`rounded-2xl border p-3 text-right transition ${template===item.id?"border-violet-600 bg-violet-50 ring-2 ring-violet-100":"border-slate-200 bg-white hover:border-slate-300"}`}>
            <span className="mb-3 block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <span className={`block h-5 ${item.id==="bold"?"h-7":item.id==="minimal"?"h-2":item.id==="beauty"?"h-6":item.id==="restaurant"?"h-8":item.id==="portfolio"?"h-2":item.id==="store"?"h-4":"h-5"}`} style={{background:item.id==="bold"?"linear-gradient(90deg,#7f1d1d,#ef4444)":item.id==="beauty"?"linear-gradient(90deg,#f9a8d4,#831843)":item.id==="agency"?"linear-gradient(90deg,#334155,#94a3b8)":item.id==="portfolio"?"#111827":item.id==="restaurant"?"linear-gradient(90deg,#f59e0b,#7c2d12)":item.id==="store"?"linear-gradient(90deg,#0f766e,#14b8a6)":item.id==="minimal"?"#e5e7eb":"linear-gradient(90deg,#6366f1,#8b5cf6)"}} />
              <span className="flex items-center gap-1.5 p-2">
                <span className={`h-4 w-4 shrink-0 border border-slate-200 bg-slate-100 ${item.id==="minimal"?"rounded-sm":item.id==="bold"||item.id==="beauty"?"rounded-full":"rounded-md"}`} />
                <span className="min-w-0 flex-1 space-y-1"><span className="block h-1.5 w-4/5 rounded bg-slate-300" /><span className="block h-1 w-3/5 rounded bg-slate-200" /></span>
              </span>
              <span className="mx-2 mb-2 block h-2 rounded-full" style={{background:item.id==="restaurant"?"#f59e0b":item.id==="beauty"?"#ec4899":item.id==="agency"?"#334155":item.id==="store"?"#0f766e":"#64748b"}} />
            </span>
            <span className="block font-black text-slate-900">{item.name}</span><span className="mt-1 block text-xs text-slate-500">{item.hint}</span>
          </button>)}
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
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-lg font-black text-slate-950">4. معلومات المحل والصور</h2>
        <div><label className={label} htmlFor="address">عنوان المحل</label><input className={field} id="address" value={address} onChange={e=>setAddress(e.target.value)} placeholder="الشارع، البلدية، الولاية" /></div>
        <div><label className={label} htmlFor="map_url">رابط Google Maps للمحل</label><input className={field} id="map_url" type="url" value={mapUrl} onChange={e=>setMapUrl(e.target.value)} placeholder="https://maps.google.com/..." /></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3"><h3 className="font-extrabold text-slate-900">أوقات العمل الأسبوعية</h3><p className="mt-1 text-sm leading-6 text-slate-500">علّم الأيام المفتوحة وحدد وقت الفتح والإغلاق. ما راح يظهرلك كود JSON.</p></div>
          <div className="space-y-3">
            {weekDays.map(([key,dayLabel])=>{const day=hours[key];return <div key={key} className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[minmax(90px,1fr)_minmax(110px,1fr)_minmax(110px,1fr)] sm:items-center">
              <label className="flex items-center gap-2 font-extrabold text-slate-800"><input type="checkbox" checked={day.open} onChange={e=>setHours(old=>({...old,[key]:{...old[key],open:e.target.checked}}))} className="h-5 w-5 accent-emerald-600"/>{dayLabel}</label>
              <label className="text-xs font-bold text-slate-500">يفتح في<input aria-label={dayLabel+" وقت الفتح"} type="time" value={day.from} disabled={!day.open} onChange={e=>setHours(old=>({...old,[key]:{...old[key],from:e.target.value}}))} className={field+" disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"}/></label>
              <label className="text-xs font-bold text-slate-500">يغلق في<input aria-label={dayLabel+" وقت الإغلاق"} type="time" value={day.to} disabled={!day.open} onChange={e=>setHours(old=>({...old,[key]:{...old[key],to:e.target.value}}))} className={field+" disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"}/></label>
              <p className={`text-xs font-extrabold sm:col-span-3 ${day.open?"text-emerald-700":"text-slate-400"}`}>{day.open?"يعمل هذا اليوم":"مغلق هذا اليوم"}</p>
            </div>})}
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
          <label className={label} htmlFor="round_image_upload">صورة دائرية للمحل أو صاحب النشاط</label>
          <input id="round_image_upload" type="file" accept="image/*" onChange={e=>uploadImage(e.target.files?.[0], "round")} className="mt-3 block w-full text-sm file:ml-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:font-bold file:text-violet-800" />
          {roundImageUrl && <div className="mt-3 flex items-center gap-3"><img src={roundImageUrl} alt="معاينة الصورة الدائرية" className="h-16 w-16 rounded-full border object-cover" /><button type="button" onClick={()=>setRoundImageUrl("")} className="text-sm font-bold text-red-600">حذف الصورة</button></div>}
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
          <label className={label} htmlFor="cover_image_upload">صورة الغلاف أو الصورة المربعة</label>
          <input id="cover_image_upload" type="file" accept="image/*" onChange={e=>uploadImage(e.target.files?.[0], "cover")} className="mt-3 block w-full text-sm file:ml-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:font-bold file:text-violet-800" />
          {coverImageUrl && <div className="mt-3 space-y-2"><img src={coverImageUrl} alt="معاينة صورة الغلاف" className="max-h-40 w-full rounded-xl border object-cover" /><button type="button" onClick={()=>setCoverImageUrl("")} className="text-sm font-bold text-red-600">حذف الصورة</button></div>}
        </div>
      </section>
      <section className="space-y-4 rounded-2xl border border-slate-200 p-4">
        <h2 className="text-lg font-black text-slate-950">5. كتالوج المنتجات (حتى 3 منتجات)</h2>
        <p className="text-sm text-slate-500">أضف اسم المنتج وسعره وصورته؛ المنتجات التي تتركها فارغة لن تظهر للزوار.</p>
        {products.map((product,index)=><div key={index} className="space-y-3 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3"><h3 className="font-extrabold text-slate-800">المنتج {index+1}</h3><button type="button" onClick={()=>setProducts(old=>old.filter((_,i)=>i!==index))} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600">حذف المنتج</button></div>
          <input className={field} aria-label={"اسم المنتج "+(index+1)} value={product.name} onChange={e=>setProducts(old=>old.map((p,i)=>i===index?{...p,name:e.target.value}:p))} placeholder="اسم المنتج" maxLength={80} />
          <input className={field} aria-label={"سعر المنتج "+(index+1)} value={product.price} onChange={e=>setProducts(old=>old.map((p,i)=>i===index?{...p,price:e.target.value}:p))} placeholder="السعر (دج)" maxLength={30} />
          <label className={label} htmlFor={`product_image_${index}`}>صورة المنتج {index + 1}</label>
          <input id={`product_image_${index}`} className={field} type="file" accept="image/*" onChange={e=>uploadImage(e.target.files?.[0], index)} />
          {product.image_url && <div className="flex items-center gap-3"><img src={product.image_url} alt={`معاينة المنتج ${index+1}`} className="h-20 w-20 rounded-xl border object-cover" /><button type="button" onClick={()=>setProducts(old=>old.map((p,i)=>i===index?{...p,image_url:""}:p))} className="text-sm font-bold text-red-600">حذف الصورة</button></div>}
          <input className={field} aria-label={"وصف المنتج "+(index+1)} value={product.description} onChange={e=>setProducts(old=>old.map((p,i)=>i===index?{...p,description:e.target.value}:p))} placeholder="وصف قصير (اختياري)" maxLength={160} />
        </div>)}
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-950">6. الظهور في Google (SEO)</h2>
        <div><label className={label} htmlFor="seo_title">عنوان Google</label><input className={field} id="seo_title" name="seo_title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={60} placeholder="اسم متجرك | منتجات مميزة" /><p className="mt-1 text-xs text-slate-500">{seoTitle.length}/60 حرفًا</p></div>
        <div><label className={label} htmlFor="seo_description">وصف Google</label><textarea className={field} id="seo_description" name="seo_description" rows={3} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} maxLength={160} placeholder="وصف مختصر يساعد الزبائن على فهم ما تقدمه." /><p className="mt-1 text-xs text-slate-500">{seoDescription.length}/160 حرفًا</p></div>
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-950">7. الشعار وروابط التواصل</h2>
        <div className="rounded-2xl border border-dashed border-slate-300 p-4">
          <label className={label} htmlFor="logo_upload">رفع شعار من الهاتف (حتى 5MB)</label>
          <input id="logo_upload" type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0], "logo")} className="mt-3 block w-full text-sm text-slate-600 file:ml-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:font-bold file:text-violet-800" />
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
      </div><aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-black text-slate-950">معاينة مباشرة</h2><div className="flex gap-2"><button type="button" onClick={() => setPreviewMode("mobile")} className={`rounded-lg px-3 py-2 text-sm font-bold ${previewMode === "mobile" ? "bg-violet-600 text-white" : "border border-slate-200 text-slate-700"}`}>📱 الهاتف</button><button type="button" onClick={() => setPreviewMode("desktop")} className={`rounded-lg px-3 py-2 text-sm font-bold ${previewMode === "desktop" ? "bg-violet-600 text-white" : "border border-slate-200 text-slate-700"}`}>💻 الكمبيوتر</button></div></div>
        <div className="mt-3 rounded-3xl p-3 sm:p-4" style={{ ...vars, background: "var(--bg)" }}>
          <div className={`mx-auto overflow-hidden border shadow-xl transition-all duration-300 ${previewMode === "mobile" ? "max-w-[375px]" : "max-w-full"} ${template === "bold" ? "rounded-none border-2" : template === "minimal" || template === "portfolio" ? "rounded-xl" : template === "beauty" ? "rounded-[2.5rem]" : "rounded-3xl"}`} style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
            {coverImageUrl ? (
              <div className="h-36 overflow-hidden sm:h-48"><img src={coverImageUrl} alt="" className="h-full w-full object-cover" /></div>
            ) : (
              <div className={`relative overflow-hidden ${template === "minimal" || template === "portfolio" ? "h-3" : template === "bold" ? "h-36 sm:h-44" : template === "beauty" ? "h-28 sm:h-36" : template === "restaurant" ? "h-32 sm:h-40" : template === "agency" ? "h-20 sm:h-28" : "h-24 sm:h-32"}`} style={{ background: template === "minimal" || template === "portfolio" ? "var(--primary)" : "var(--gradient)" }}>
                {template !== "minimal" && template !== "portfolio" && <span className="absolute -left-8 -top-12 h-36 w-36 rounded-full border-[18px] border-white/10" />}
              </div>
            )}
            <div className={`relative px-4 pb-6 sm:px-6 sm:pb-8 ${template === "bold" ? "text-center" : ""}`}>
              <div className={`flex gap-3 ${template === "bold" ? "-mt-16 flex-col items-center text-center" : template === "minimal" || template === "portfolio" ? "-mt-4 flex-col items-center sm:flex-row sm:items-center" : "-mt-10 flex-col items-center sm:-mt-12 sm:flex-row sm:items-end"}`}>
                {roundImageUrl || logo ? (
                  <img src={roundImageUrl || logo} alt="" className={`h-20 w-20 shrink-0 border-4 object-cover shadow-lg sm:h-24 sm:w-24 ${template === "bold" || template === "beauty" ? "rounded-full" : template === "minimal" ? "rounded-md" : "rounded-2xl"}`} style={{ borderColor: "var(--surface)", background: "var(--surface)" }} />
                ) : (
                  <div className={`grid h-20 w-20 shrink-0 place-items-center border-4 text-3xl font-black text-white shadow-lg sm:h-24 sm:w-24 ${template === "bold" || template === "beauty" ? "rounded-full" : template === "minimal" ? "rounded-md" : "rounded-2xl"}`} style={{ borderColor: "var(--surface)", background: "var(--gradient)" }}>{business.slice(0,1) || "م"}</div>
                )}
                <div className={`min-w-0 flex-1 pb-1 ${template === "bold" ? "w-full text-center" : "text-center sm:text-right"}`}>
                  <span className="mb-2 inline-flex rounded-full px-3 py-1.5 text-xs font-extrabold" style={{ background: "var(--tint)", color: "var(--primary)" }}>{template === "restaurant" ? "مطعم ومقهى" : template === "store" ? "المتجر الرسمي" : template === "agency" ? "خدمات وأعمال" : template === "beauty" ? "جمال وعناية" : template === "portfolio" ? "معرض الأعمال" : "مرحبًا بكم"}</span>
                  <h3 className="text-2xl font-black leading-tight sm:text-3xl">{business || "اسم نشاطك التجاري"}</h3>
                  <p className="mt-2 text-sm font-bold" style={{ color: "var(--muted)" }}>{headline || "عنوان جذاب لنشاطك التجاري"}</p>
                </div>
              </div>
              <p className="mx-auto mt-4 max-w-xl whitespace-pre-wrap text-sm leading-7" style={{ color: "var(--muted)" }}>{description || "اكتب وصفًا قصيرًا يشرح للزائر ماذا تقدم."}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm font-black">
                <span style={{ color: "#f5bd35" }}>★★★★★</span><span>5.0</span><span className="text-xs" style={{ color: "var(--muted)" }}>(8 تقييم)</span>
              </div>
              <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--tint)" }}>
                <div className="flex items-center justify-between gap-3"><span className="font-black">أوقات العمل</span><span className="text-sm font-extrabold" style={{ color: "var(--primary)" }}>◷ جدول الأسبوع</span></div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm"><span style={{ color: "var(--muted)" }}>اليوم</span><span className="font-bold">{todayHours.open ? `${todayHours.from} – ${todayHours.to}` : "مغلق"}</span></div>
                <div className="mt-2 text-xs font-bold" style={{ color: "var(--muted)" }}>تتغير الأوقات حسب البيانات التي تدخلها في محرر الصفحة</div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex flex-col items-center gap-2 text-xs font-extrabold"><span className="grid h-12 w-12 place-items-center rounded-full text-xl text-white" style={{ background: "var(--whatsapp)" }}>◉</span>واتساب</div>
                <div className="flex flex-col items-center gap-2 text-xs font-extrabold"><span className="grid h-12 w-12 place-items-center rounded-full text-xl text-white" style={{ background: "var(--call-button)" }}>☎</span>اتصال</div>
                <div className="flex flex-col items-center gap-2 text-xs font-extrabold"><span className="grid h-12 w-12 place-items-center rounded-full text-xl text-white" style={{ background: "var(--call-button)" }}>☎</span>اتصال 2</div>
                <div className="flex flex-col items-center gap-2 text-xs font-extrabold"><span className="grid h-12 w-12 place-items-center rounded-full text-xl text-white" style={{ background: "var(--whatsapp)" }}>◉</span>واتساب 2</div>
              </div>
              <div className="mt-4 flex justify-center"><span className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-extrabold text-white" style={{ background: "var(--primary)" }}>＋ حفظ جهة الاتصال</span></div>
              {(page.instagram_url || page.facebook_url || page.tiktok_url || page.youtube_url || page.custom_links?.length) && (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {[page.facebook_url && "Facebook", page.instagram_url && "Instagram", page.tiktok_url && "TikTok", page.youtube_url && "YouTube", ...(page.custom_links || []).map((link) => link.label)].filter(Boolean).map((name, index) => <span key={String(name)+index} className="rounded-xl border px-3 py-2 text-xs font-bold" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>{name}</span>)}
                </div>
              )}
              {(address || mapUrl) && <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--tint)" }}><span className="font-black" style={{ color: "var(--primary)" }}>موقعنا على الخريطة</span><span className="text-xs" style={{ color: "var(--muted)" }}>{address || "عرض الموقع"}</span></div>}
              {products.some((product) => product.name || product.image_url || product.price) && (
                <section className="mt-6">
                  <div className="mb-3 flex items-center justify-between"><h4 className="text-lg font-black">✨ {template === "restaurant" ? "قائمة الطعام" : template === "store" ? "المنتجات" : "كتالوج الأعمال"}</h4><span className="text-xs" style={{ color: "var(--muted)" }}>{products.filter((product) => product.name || product.image_url || product.price).length} عناصر</span></div>
                  <div className={`grid gap-3 ${template === "minimal" || template === "portfolio" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"}`}>
                    {products.filter((product) => product.name || product.image_url || product.price).map((product, index) => <article key={index} className={`overflow-hidden border ${template === "minimal" ? "rounded-lg" : template === "bold" || template === "portfolio" ? "rounded-none" : template === "beauty" ? "rounded-3xl" : "rounded-2xl"}`} style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                      {product.image_url ? <img src={product.image_url} alt={product.name || ""} className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center text-3xl" style={{ background: "var(--tint)", color: "var(--primary)" }}>▧</div>}
                      <div className="p-3"><p className="font-black">{product.name || "اسم المنتج"}</p>{product.price && <p className="mt-1 text-sm font-extrabold" style={{ color: "var(--primary)" }}>{product.price}</p>}{product.description && <p className="mt-1 text-xs leading-5" style={{ color: "var(--muted)" }}>{product.description}</p>}</div>
                    </article>)}
                  </div>
                </section>
              )}
            </div>
          </div>
          <p className="mt-3 text-center text-xs" style={{ color: "var(--muted)" }}>هذه معاينة مباشرة للقالب والثيم ومحتوى الصفحة؛ اختيار قالب آخر يغيّر شكل البطاقة كاملة.</p>
        </div>
      </section>
      <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-extrabold text-slate-800">خيارات الألوان المتقدمة</summary>
        <div className="mt-4 space-y-4">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <input type="color" aria-label="اللون الرئيسي" value={primary || activeDef.primary} onChange={(e) => setPrimary(e.target.value)} className="h-12 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
            <span className="min-w-0"><span className="block text-sm font-extrabold text-slate-800">لون رئيسي مخصص (اختياري)</span><span className="text-xs text-slate-500">{(primary || activeDef.primary).toUpperCase()}</span></span>
          </label>
          <div role="group" aria-label="وضع الخلفية" className="flex rounded-xl border border-slate-200 bg-white p-1 text-sm font-bold">
            {([["", "حسب الثيم"], ["light", "فاتح"], ["dark", "داكن"]] as const).map(([v, l]) => <button key={v} type="button" aria-pressed={mode === v} onClick={() => setMode(v)} className={`flex-1 rounded-lg px-3 py-2 ${mode === v ? "bg-violet-600 text-white" : "text-slate-700"}`}>{l}</button>)}
          </div>
          {(primary || mode) && <button type="button" onClick={() => { setPrimary(""); setMode(""); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">إرجاع ألوان الثيم الأصلية</button>}
        </div>
      </details>
      </aside></div>
      <button disabled={uploading} type="submit" className="w-full rounded-xl bg-gradient-to-l from-violet-600 to-blue-600 px-5 py-4 font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50">حفظ التعديلات ونشر الصفحة ✨</button>
    </form>
  );
}
