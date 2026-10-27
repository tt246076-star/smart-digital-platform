"use client";
// Vercel redeploy trigger: editor syntax fix

import { useMemo, useState } from "react";
import { updateLandingPage } from "./actions";
import { createClient } from "@/lib/supabase/client";

type PageData = {
  id: string; slug: string; business_name: string; headline: string; description: string;
  phone: string; whatsapp: string; logo_url: string; instagram_url: string; facebook_url: string;
  tiktok_url: string; youtube_url: string; custom_links: { label: string; url: string }[] | null;
  template: string | null; theme: string | null; seo_title: string | null; seo_description: string | null;
  sections: { address?: string; map_url?: string; hours?: string; card_color?: string; accent_color?: string; panel_color?: string; round_image_url?: string; cover_image_url?: string; products?: {name:string; price:string; image_url:string; description:string}[] } | null;
};

const themes = [
  { id: "violet", name: "بنفسجي", main: "#7c3aed", soft: "#f5f3ff", dark: "#1e1b4b" },
  { id: "ocean", name: "أزرق", main: "#0284c7", soft: "#f0f9ff", dark: "#082f49" },
  { id: "sunset", name: "غروب", main: "#ea580c", soft: "#fff7ed", dark: "#431407" },
  { id: "emerald", name: "أخضر", main: "#059669", soft: "#ecfdf5", dark: "#022c22" },
  { id: "rose", name: "وردي", main: "#e11d48", soft: "#fff1f2", dark: "#4c0519" },
  { id: "midnight", name: "ليلي", main: "#6366f1", soft: "#eef2ff", dark: "#111827" },
  { id: "gold", name: "ذهبي", main: "#b7791f", soft: "#fffbeb", dark: "#422006" },
  { id: "mint", name: "نعناعي", main: "#0d9488", soft: "#f0fdfa", dark: "#134e4a" },
  { id: "berry", name: "توتي", main: "#a21caf", soft: "#fdf4ff", dark: "#4a044e" },
  { id: "slate", name: "رمادي", main: "#475569", soft: "#f8fafc", dark: "#0f172a" },
];
const templates = [
  { id: "aurora", name: "Aurora", hint: "متدرّج وعصري" },
  { id: "store", name: "Store", hint: "متجر وبيع" },
  { id: "minimal", name: "Minimal", hint: "بسيط وراقي" },
  { id: "bold", name: "Bold", hint: "جريء ولافت" },
  { id: "beauty", name: "Beauty", hint: "جمال وعناية" },
  { id: "agency", name: "Agency", hint: "خدمات وشركات" },
  { id: "restaurant", name: "Restaurant", hint: "مطاعم ومقاهي" },
  { id: "portfolio", name: "Portfolio", hint: "أعمال شخصية" },
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
      return [key, { open: typeof day?.open === "boolean" ? day.open : defaultHours[key].open, from: /^\\d{2}:\\d{2}$/.test(day?.from || "") ? day.from : "09:00", to: /^\\d{2}:\\d{2}$/.test(day?.to || "") ? day.to : "18:00" }];
    })) as Record<DayKey,DayHours>;
  } catch { return defaultHours; }
}
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
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("desktop");
  const [seoTitle, setSeoTitle] = useState(page.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(page.seo_description || "");
  const initialSections = page.sections || {};
  const [address, setAddress] = useState(initialSections.address || "");
  const [mapUrl, setMapUrl] = useState(initialSections.map_url || "");
  const [hours, setHours] = useState<Record<DayKey, DayHours>>(() => readHours(initialSections.hours));
  const [cardColor, setCardColor] = useState(/^#[0-9a-fA-F]{6}$/.test(initialSections.card_color || "") ? initialSections.card_color! : "#ffffff");
  const [accentColor, setAccentColor] = useState(/^#[0-9a-fA-F]{6}$/.test(initialSections.accent_color || "") ? initialSections.accent_color! : (themes.find(item => item.id === page.theme)?.main || "#7c3aed"));
  const [panelColor, setPanelColor] = useState(/^#[0-9a-fA-F]{6}$/.test(initialSections.panel_color || "") ? initialSections.panel_color! : "#f8fafc");
  const [roundImageUrl, setRoundImageUrl] = useState(initialSections.round_image_url || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialSections.cover_image_url || "");
  const [products, setProducts] = useState(() => Array.from({length:Math.max(3, initialSections.products?.length || 0)}, (_,i) => initialSections.products?.[i] || {name:"",price:"",image_url:"",description:""}));
  const sectionsJson = JSON.stringify({address,map_url:mapUrl,hours:JSON.stringify(hours),card_color:cardColor,accent_color:accentColor,panel_color:panelColor,round_image_url:roundImageUrl,cover_image_url:coverImageUrl,products:products.filter(p=>p.name.trim() || p.image_url.trim() || p.price.trim())});
  const activeTheme = themes.find((item) => item.id === theme) || themes[0];
  const previewClass = useMemo(() => template === "minimal" ? "rounded-2xl border bg-white" : template === "bold" || template === "agency" ? "rounded-3xl border-2 shadow-xl" : template === "store" || template === "restaurant" ? "rounded-2xl border shadow-md" : "rounded-3xl border shadow-xl", [template]);

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
    <form action={updateLandingPage} className="mt-8 space-y-8">
      <input type="hidden" name="id" value={page.id} />
      <input type="hidden" name="template" value={template} />
      <input type="hidden" name="theme" value={theme} />
      <input type="hidden" name="logo_url" value={logo} />
      <input type="hidden" name="sections" value={sectionsJson} />
      <section>
        <h2 className="text-lg font-black text-slate-950">1. اختار القالب</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {templates.map((item) => <button key={item.id} type="button" onClick={() => setTemplate(item.id)} className={`rounded-2xl border p-3 text-right transition hover:-translate-y-0.5 hover:shadow-md ${template === item.id ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200" : "border-slate-200 bg-white"}`}>
            <div className="mb-3 h-12 overflow-hidden rounded-lg" style={{ background: item.id === "minimal" || item.id === "portfolio" ? "#f8fafc" : item.id === "bold" || item.id === "agency" ? activeTheme.dark : item.id === "store" || item.id === "restaurant" ? activeTheme.soft : item.id === "beauty" ? "linear-gradient(135deg,#fbcfe8,#fce7f3)" : `linear-gradient(135deg,${activeTheme.main},#111827)` }}>
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
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-black text-slate-950">ألوان البطاقة المتناسقة</h2>
        <p className="text-sm leading-6 text-slate-500">بدّل 3 ألوان فقط: خلفية البطاقة، اللون الرئيسي للأزرار والعناوين، وخلفية البطاقات الداخلية. نفس الألوان تتطبق تلقائيًا على واتساب والمنتجات ومعلومات المحل وأوقات العمل، بلا ما تعدّل كل بطاقة وحدها.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-extrabold text-slate-800">خلفية البطاقة
            <div className="mt-2 flex items-center gap-2"><input aria-label="اختيار لون خلفية البطاقة" type="color" value={cardColor} onChange={e=>setCardColor(e.target.value)} className="h-12 w-14 cursor-pointer rounded-xl border border-slate-300 bg-white p-1"/><input aria-label="كود لون خلفية البطاقة" type="text" value={cardColor} onChange={e=>{const v=e.target.value.trim();if(/^#[0-9a-fA-F]{6}$/.test(v))setCardColor(v)}} maxLength={7} dir="ltr" className={field+" mt-0 uppercase"} placeholder="#ffffff"/></div>
          </label>
          <label className="block text-sm font-extrabold text-slate-800">اللون الرئيسي
            <div className="mt-2 flex items-center gap-2"><input aria-label="اختيار اللون الرئيسي" type="color" value={accentColor} onChange={e=>setAccentColor(e.target.value)} className="h-12 w-14 cursor-pointer rounded-xl border border-slate-300 bg-white p-1"/><input aria-label="كود اللون الرئيسي" type="text" value={accentColor} onChange={e=>{const v=e.target.value.trim();if(/^#[0-9a-fA-F]{6}$/.test(v))setAccentColor(v)}} maxLength={7} dir="ltr" className={field+" mt-0 uppercase"} placeholder="#7c3aed"/></div>
          </label>
          <label className="block text-sm font-extrabold text-slate-800">خلفية البطاقات الداخلية
            <div className="mt-2 flex items-center gap-2"><input aria-label="اختيار خلفية البطاقات الداخلية" type="color" value={panelColor} onChange={e=>setPanelColor(e.target.value)} className="h-12 w-14 cursor-pointer rounded-xl border border-slate-300 bg-white p-1"/><input aria-label="كود خلفية البطاقات الداخلية" type="text" value={panelColor} onChange={e=>{const v=e.target.value.trim();if(/^#[0-9a-fA-F]{6}$/.test(v))setPanelColor(v)}} maxLength={7} dir="ltr" className={field+" mt-0 uppercase"} placeholder="#f8fafc"/></div>
          </label>
        </div>
        <div className="flex flex-wrap gap-2 rounded-2xl border p-3" style={{backgroundColor:cardColor,borderColor:accentColor}}>
          <span className="rounded-xl px-4 py-3 text-sm font-black text-white" style={{backgroundColor:accentColor}}>زر التواصل</span>
          <span className="rounded-xl border px-4 py-3 text-sm font-bold" style={{backgroundColor:panelColor,borderColor:accentColor,color:"#1f2937"}}>بطاقة المنتجات والواتساب</span>
          <span className="rounded-xl px-4 py-3 text-sm font-bold" style={{color:accentColor}}>عنوان رئيسي</span>
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
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-black text-slate-950">معاينة مباشرة</h2><div className="flex gap-2"><button type="button" onClick={() => setPreviewMode("mobile")} className={`rounded-lg px-3 py-2 text-sm font-bold ${previewMode === "mobile" ? "bg-violet-600 text-white" : "border border-slate-200 text-slate-700"}`}>📱 الهاتف</button><button type="button" onClick={() => setPreviewMode("desktop")} className={`rounded-lg px-3 py-2 text-sm font-bold ${previewMode === "desktop" ? "bg-violet-600 text-white" : "border border-slate-200 text-slate-700"}`}>💻 الكمبيوتر</button></div></div>
        <div className="mt-3 rounded-3xl p-4 sm:p-6" style={{ background: activeTheme.soft }}>
          <div className={`mx-auto transition-all duration-300 ${previewMode === "mobile" ? "max-w-[375px]" : "max-w-full"} ${previewClass}`} style={{ borderColor: activeTheme.main + "30", background: cardColor }}>
            <div className="h-2" style={{ background: template === "minimal" || template === "portfolio" ? activeTheme.main : template === "beauty" ? "linear-gradient(90deg,#f472b6,#be185d)" : `linear-gradient(90deg,${activeTheme.main},${activeTheme.dark})` }} />
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
