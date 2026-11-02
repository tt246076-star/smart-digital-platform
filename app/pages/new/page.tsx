"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { THEMES } from "@/lib/theme";
import { createLandingPage } from "./actions";
import SubmitButton from "./SubmitButton";
import { createClient } from "@/lib/supabase/client";

const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
const labelClass = "block text-sm font-bold text-slate-800";


const weekDays = [
  ["sunday","الأحد"],["monday","الإثنين"],["tuesday","الثلاثاء"],["wednesday","الأربعاء"],["thursday","الخميس"],["friday","الجمعة"],["saturday","السبت"]
] as const;
type DayKey = typeof weekDays[number][0];
type DayHours = { open: boolean; from: string; to: string };
const defaultHours: Record<DayKey, DayHours> = Object.fromEntries(weekDays.map(([key]) => [key,{open:key!=="friday",from:"09:00",to:"18:00"}])) as Record<DayKey,DayHours>;


function NewLandingPageForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [logoUrl, setLogoUrl] = useState("");
  const [roundImageUrl, setRoundImageUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryLimit, setGalleryLimit] = useState({count:2,size:2});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [hours, setHours] = useState<Record<DayKey,DayHours>>(defaultHours);
  const [cardColor, setCardColor] = useState("#ffffff");
  const [template, setTemplate] = useState("aurora");
  useEffect(()=>{let active=true;const load=async()=>{try{const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {data}=await supabase.from("user_gallery_limits").select("normal_max_images,normal_max_image_mb").eq("user_id",user.id).maybeSingle();if(active&&data)setGalleryLimit({count:Math.max(0,Math.min(100,data.normal_max_images??2)),size:Math.max(0.1,Math.min(20,data.normal_max_image_mb??2))});}catch{}};load();return()=>{active=false}},[]);

  const templateOptions = [
    { id: "profile", name: "بطاقة تواصل", hint: "معلومات وروابط التواصل", color: "linear-gradient(135deg,#0f172a,#64748b)" },
    { id: "aurora", name: "عصري", hint: "تدرجات ناعمة ومظهر متوازن", color: "linear-gradient(135deg,#4f46e5,#06b6d4)" },
    { id: "store", name: "متجر", hint: "عرض الصور والأعمال", color: "linear-gradient(135deg,#0f766e,#2dd4bf)" },
    { id: "minimal", name: "بسيط", hint: "تصميم هادئ ومساحات واضحة", color: "linear-gradient(135deg,#e5e7eb,#9ca3af)" },
    { id: "bold", name: "جريء", hint: "ألوان قوية وعناوين بارزة", color: "linear-gradient(135deg,#7f1d1d,#ef4444)" },
    { id: "beauty", name: "جمال وعناية", hint: "لمسة ناعمة للصالونات", color: "linear-gradient(135deg,#f9a8d4,#831843)" },
    { id: "agency", name: "خدمات ومهن", hint: "عرض واضح للخدمات", color: "linear-gradient(135deg,#334155,#94a3b8)" },
    { id: "restaurant", name: "مطعم ومقهى", hint: "ستايل دافئ للطعام", color: "linear-gradient(135deg,#f59e0b,#7c2d12)" },
    { id: "portfolio", name: "معرض أعمال", hint: "مظهر فني يبرز أعمالك", color: "linear-gradient(135deg,#111827,#4b5563)" },
  ];

  async function uploadImage(file: File | undefined, done: (url: string) => void, galleryUpload = false) {
    if (!file) return;
    setUploadError("");
    if (!file.type.startsWith("image/")) { setUploadError("اختار ملف صورة فقط."); return; }
    if (galleryUpload && file.size > galleryLimit.size * 1024 * 1024) { setUploadError("حجم الصورة يتجاوز الحد المسموح لهذا الحساب."); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
      const path = `new/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("landing-logos").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      done(supabase.storage.from("landing-logos").getPublicUrl(path).data.publicUrl);
    } catch {
      setUploadError("ما قدرناش نرفع الصورة. تأكد من إعدادات تخزين الصور في Supabase.");
    } finally { setUploading(false); }
  }

  const imageField = (title: string, value: string, setValue: (url:string)=>void) => (
    <div>
      <label className={labelClass}>{title} (رفع ملف)</label>
      <input className={inputClass} type="file" accept="image/*" onChange={(e)=>uploadImage(e.target.files?.[0],setValue)} />
      {value && <div className="mt-3 flex items-center gap-3"><img src={value} alt={title} className="h-16 w-16 rounded-xl border object-cover" /><button type="button" onClick={()=>setValue("")} className="text-sm font-bold text-red-600">حذف الصورة</button></div>}
    </div>
  );

  return <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-blue-600">← العودة إلى لوحة التحكم</Link>
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
        <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">صفحة جديدة</div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">أنشئ بطاقتك العادية</h1>
        <p className="mt-3 leading-7 text-slate-500">كل معلومات المحل والصور وأوقات العمل في نموذج واحد.</p>
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error === "trial" ? "حسابك التجريبي يسمح بالمشاهدة فقط. تواصل مع الإدارة لتفعيل الإنشاء." : error === "limit" ? "وصلت إلى الحد المسموح به من الصفحات." : error === "name" ? "اسم النشاط مطلوب ويجب ألا يتجاوز 100 حرف." : error === "length" ? "تحقق من أطوال النصوص وأرقام الهاتف." : error === "gallery_limit" ? "عدد صور المعرض تجاوز الحد المسموح لحسابك." : "تعذر حفظ الصفحة. تحقق من إعدادات Supabase ثم حاول مجددًا."}</p>}
        {error === "trial" ? <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">العودة إلى لوحة التحكم</Link> : <form action={createLandingPage} className="mt-8 space-y-7">
          <section className="space-y-4">
            <h2 className="border-b border-slate-100 pb-3 text-lg font-extrabold">معلومات النشاط</h2>
            <div><label className={labelClass} htmlFor="business_name">اسم المحل أو النشاط *</label><input className={inputClass} id="business_name" name="business_name" required maxLength={100} placeholder="مثال: متجر الأناقة" /></div>
            <div><label className={labelClass} htmlFor="headline">عنوان الصفحة</label><input className={inputClass} id="headline" name="headline" maxLength={140} placeholder="كل ما تحتاجه في مكان واحد" /></div>
            <div><label className={labelClass} htmlFor="description">وصف قصير</label><textarea className={inputClass} id="description" name="description" rows={3} maxLength={1000} placeholder="عرّف الزبائن بنشاطك أو منتجاتك..." /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><span className={labelClass}>اختار شكل البطاقة حسب نشاطك</span><input type="hidden" name="template" value={template} /><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{templateOptions.map((item)=><button key={item.id} type="button" onClick={()=>setTemplate(item.id)} aria-pressed={template===item.id} className={`rounded-2xl border-2 p-3 text-right transition ${template===item.id?"border-blue-600 bg-blue-50 ring-2 ring-blue-100":"border-slate-200 bg-white hover:border-blue-300"}`}><span className="mb-3 block h-16 rounded-xl shadow-inner" style={{background:item.color}}><span className="flex h-full items-end gap-1 p-3"><i className="h-7 w-7 rounded-full border-2 border-white/80 bg-white/25"/><i className="mb-1 h-2 w-1/3 rounded bg-white/80"/><i className="mb-1 h-2 w-1/5 rounded bg-white/45"/></span></span><strong className="block text-sm text-slate-900">{item.name}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{item.hint}</span><span className="mt-2 block text-xs font-extrabold text-blue-700">{template===item.id?"✓ القالب المختار":"اختيار هذا القالب"}</span></button>)}</div></div>
              <div><label className={labelClass} htmlFor="theme">الألوان</label><select className={inputClass} id="theme" name="theme" defaultValue="violet">{THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                <label className={labelClass} htmlFor="card_color">لون البطاقة نفسها — اختار أي لون تحبه</label>
                <input type="hidden" name="card_color" value={cardColor} />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <input id="card_color" aria-label="اختيار لون البطاقة" type="color" value={cardColor} onChange={e=>setCardColor(e.target.value)} className="h-14 w-20 cursor-pointer rounded-xl border border-slate-300 bg-white p-1" />
                  <input aria-label="كود لون البطاقة" type="text" value={cardColor} onChange={e=>{const v=e.target.value.trim();if(/^#[0-9a-fA-F]{6}$/.test(v))setCardColor(v);else if(v===""||v==="#")setCardColor(v)}} onBlur={()=>{if(!/^#[0-9a-fA-F]{6}$/.test(cardColor))setCardColor("#ffffff")}} placeholder="#ffffff" maxLength={7} dir="ltr" className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold uppercase" />
                  <span className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold" style={{backgroundColor:cardColor,color:"#111827"}}>معاينة لون البطاقة</span>
                </div>
                <p className="mt-2 text-xs leading-6 text-slate-500">تقدر تختار اللون من لوحة الألوان أو تدخل كود HEX. هذا اللون يطبق على خلفية البطاقة في الصفحة المنشورة.</p>
              </div>
            </div>
            <input type="hidden" name="logo_url" value={logoUrl} />
            {imageField("شعار أو صورة المحل",logoUrl,setLogoUrl)}
            <input type="hidden" name="round_image_url" value={roundImageUrl} />
            {imageField("الصورة الدائرية للمحل",roundImageUrl,setRoundImageUrl)}
            <input type="hidden" name="cover_image_url" value={coverImageUrl} />
            {imageField("صورة الغلاف",coverImageUrl,setCoverImageUrl)}
          </section>
          <section className="space-y-4">
            <h2 className="border-b border-slate-100 pb-3 text-lg font-extrabold">العنوان وأوقات العمل</h2>
            <div><label className={labelClass} htmlFor="address">عنوان المحل</label><input className={inputClass} id="address" name="address" maxLength={200} placeholder="المدينة، الحي، الشارع" /></div>
            <div><label className={labelClass} htmlFor="map_url">رابط الموقع على الخريطة (اختياري)</label><input className={inputClass} id="map_url" name="map_url" type="url" placeholder="https://maps.google.com/..." /></div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3"><h3 className="font-extrabold text-slate-900">جدول أوقات العمل الأسبوعي</h3><p className="mt-1 text-sm leading-6 text-slate-500">حدد الأيام التي يعمل فيها المحل ووقت الفتح والإغلاق. الزبون سيشاهد الحالة حسب توقيت الجزائر.</p></div>
              <input type="hidden" id="hours" name="hours" value={JSON.stringify(hours)} />
              <div className="space-y-3">
                {weekDays.map(([key,label]) => {
                  const day = hours[key];
                  return <div key={key} className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[minmax(90px,1fr)_minmax(110px,1fr)_minmax(110px,1fr)] sm:items-center">
                    <label className="flex items-center gap-2 font-extrabold text-slate-800"><input type="checkbox" checked={day.open} onChange={e=>setHours(old=>({...old,[key]:{...old[key],open:e.target.checked}}))} className="h-5 w-5 accent-emerald-600" />{label}</label>
                    <label className="text-xs font-bold text-slate-500">يفتح في<input aria-label={label+" وقت الفتح"} type="time" value={day.from} disabled={!day.open} onChange={e=>setHours(old=>({...old,[key]:{...old[key],from:e.target.value}}))} className={inputClass+" disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"} /></label>
                    <label className="text-xs font-bold text-slate-500">يغلق في<input aria-label={label+" وقت الإغلاق"} type="time" value={day.to} disabled={!day.open} onChange={e=>setHours(old=>({...old,[key]:{...old[key],to:e.target.value}}))} className={inputClass+" disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"} /></label>
                    <p className={`text-xs font-extrabold sm:col-span-3 ${day.open?"text-emerald-700":"text-slate-400"}`}>{day.open ? "يعمل هذا اليوم" : "مغلق هذا اليوم"}</p>
                  </div>;
                })}
              </div>
            </div>
          </section>
          <section className="space-y-4 rounded-2xl border border-slate-200 p-4">
            <h2 className="border-b border-slate-100 pb-3 text-lg font-extrabold">معرض الصور</h2>
            <p className="text-sm text-slate-500">ارفع حتى {galleryLimit.count} صورة. الحد الأقصى للصورة الواحدة {galleryLimit.size} MB.</p>
            <input className={inputClass} type="file" accept="image/*" multiple onChange={async e=>{const files=Array.from(e.target.files||[]).slice(0,galleryLimit.count-gallery.length);for(const file of files) await uploadImage(file,url=>setGallery(old=>[...old,url]),true);}} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{gallery.map((url,i)=><div key={url} className="relative"><img src={url} alt={`صورة المعرض ${i+1}`} className="aspect-square w-full rounded-xl border object-cover"/><button type="button" onClick={()=>setGallery(old=>old.filter((_,j)=>j!==i))} className="mt-1 text-xs font-bold text-red-600">حذف الصورة</button></div>)}</div>
            <input type="hidden" name="gallery_json" value={JSON.stringify(gallery)}/>
          </section>
          <section className="space-y-4">
            <h2 className="border-b border-slate-100 pb-3 text-lg font-extrabold">التواصل</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelClass} htmlFor="phone"><span className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">☎</span> رقم الهاتف — يظهر كزر اتصال</label><input className={inputClass} id="phone" name="phone" type="tel" maxLength={30} dir="ltr" placeholder="+213..." /></div>
              <div><label className={labelClass} htmlFor="whatsapp">رقم WhatsApp</label><input className={inputClass} id="whatsapp" name="whatsapp" type="tel" maxLength={30} dir="ltr" placeholder="+213..." /></div>
              <div><label className={labelClass} htmlFor="instagram_url">Instagram</label><input className={inputClass} id="instagram_url" name="instagram_url" type="url" placeholder="https://instagram.com/..." /></div>
              <div><label className={labelClass} htmlFor="facebook_url"><span className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 font-black text-blue-700">f</span> رابط صفحة Facebook</label><input className={inputClass} id="facebook_url" name="facebook_url" type="url" placeholder="https://facebook.com/..." /></div>
              <div><label className={labelClass} htmlFor="tiktok_url">TikTok</label><input className={inputClass} id="tiktok_url" name="tiktok_url" type="url" placeholder="https://tiktok.com/@..." /></div>
              <div><label className={labelClass} htmlFor="youtube_url">YouTube</label><input className={inputClass} id="youtube_url" name="youtube_url" type="url" placeholder="https://youtube.com/..." /></div>
            </div>
            <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
              <div><label className={labelClass} htmlFor="custom_label">منصة أخرى (اختياري)</label><input className={inputClass} id="custom_label" name="custom_label" maxLength={40} placeholder="Telegram أو موقع المتجر"/></div>
              <div><label className={labelClass} htmlFor="custom_url">رابط المنصة الأخرى</label><input className={inputClass} id="custom_url" name="custom_url" type="url" placeholder="https://..."/></div>
            </div>
          </section>
          {uploadError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{uploadError}</p>}
          {uploading && <p className="text-sm font-bold text-blue-700">جاري رفع الصورة، انتظر حتى يكتمل الرفع...</p>}
          <SubmitButton uploading={uploading} />
        </form>}
      </div>
    </div>
  </main>;
}


export default function NewLandingPage() {
  return <Suspense fallback={<main dir="rtl" className="min-h-screen bg-slate-50 p-8 text-center">جاري تحميل النموذج...</main>}><NewLandingPageForm /></Suspense>;
}
