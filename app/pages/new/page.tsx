"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createLandingPage } from "./actions";
import { createClient } from "@/lib/supabase/client";

const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
const labelClass = "block text-sm font-bold text-slate-800";
type Product = { name: string; price: string; image_url: string; description: string };

export default function NewLandingPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [logoUrl, setLogoUrl] = useState("");
  const [roundImageUrl, setRoundImageUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [products, setProducts] = useState<Product[]>(Array.from({length:3},()=>({name:"",price:"",image_url:"",description:""})));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function uploadImage(file: File | undefined, done: (url: string) => void) {
    if (!file) return;
    setUploadError("");
    if (!file.type.startsWith("image/")) { setUploadError("اختار ملف صورة فقط."); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadError("الصورة لازم تكون أقل من 5 ميغابايت."); return; }
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
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">أنشئ صفحة نشاطك التجاري</h1>
        <p className="mt-3 leading-7 text-slate-500">كل معلومات المحل والصور وأوقات العمل والكاتالوج في فورم واحد.</p>
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error === "trial" ? "حسابك التجريبي يسمح بالمشاهدة فقط. تواصل مع الإدارة لتفعيل الإنشاء." : error === "limit" ? "وصلت إلى الحد المسموح به من الصفحات." : error === "name" ? "اسم النشاط مطلوب ويجب ألا يتجاوز 100 حرف." : error === "length" ? "تحقق من أطوال النصوص وأرقام الهاتف." : "تعذر حفظ الصفحة. تحقق من إعدادات Supabase ثم حاول مجددًا."}</p>}
        {error === "trial" ? <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">العودة إلى لوحة التحكم</Link> : <form action={createLandingPage} className="mt-8 space-y-7">
          <section className="space-y-4">
            <h2 className="border-b border-slate-100 pb-3 text-lg font-extrabold">معلومات النشاط</h2>
            <div><label className={labelClass} htmlFor="business_name">اسم المحل أو النشاط *</label><input className={inputClass} id="business_name" name="business_name" required maxLength={100} placeholder="مثال: متجر الأناقة" /></div>
            <div><label className={labelClass} htmlFor="headline">عنوان الصفحة</label><input className={inputClass} id="headline" name="headline" maxLength={140} placeholder="كل ما تحتاجه في مكان واحد" /></div>
            <div><label className={labelClass} htmlFor="description">وصف قصير</label><textarea className={inputClass} id="description" name="description" rows={3} maxLength={1000} placeholder="عرّف الزبائن بنشاطك أو منتجاتك..." /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelClass} htmlFor="template">القالب</label><select className={inputClass} id="template" name="template" defaultValue="aurora"><option value="aurora">Aurora — عصري</option><option value="store">Store — متجر</option><option value="minimal">Minimal — بسيط</option><option value="bold">Bold — جريء</option><option value="beauty">Beauty — جمال</option><option value="agency">Agency — خدمات</option><option value="restaurant">Restaurant — مطعم</option><option value="portfolio">Portfolio — أعمال</option></select></div>
              <div><label className={labelClass} htmlFor="theme">الألوان</label><select className={inputClass} id="theme" name="theme" defaultValue="violet"><option value="violet">بنفسجي</option><option value="ocean">أزرق</option><option value="sunset">غروب</option><option value="emerald">أخضر</option><option value="rose">وردي</option><option value="midnight">ليلي</option><option value="gold">ذهبي</option><option value="mint">نعناعي</option><option value="berry">توتي</option><option value="slate">رمادي</option></select></div>
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
            <div><label className={labelClass} htmlFor="hours">أوقات العمل</label><textarea className={inputClass} id="hours" name="hours" rows={3} maxLength={1000} placeholder={"الأحد - الخميس: 08:00 - 17:00\nالجمعة: مغلق"} /></div>
          </section>
          <section className="space-y-4">
            <h2 className="border-b border-slate-100 pb-3 text-lg font-extrabold">كاتالوج المنتجات (حتى 3 منتجات)</h2>
            {products.map((p,i)=><div key={i} className="space-y-3 rounded-2xl border border-slate-200 p-4">
              <h3 className="font-extrabold">المنتج {i+1}</h3>
              <input className={inputClass} value={p.name} onChange={e=>setProducts(old=>old.map((x,j)=>j===i?{...x,name:e.target.value}:x))} placeholder="اسم المنتج" maxLength={80}/>
              <input className={inputClass} value={p.price} onChange={e=>setProducts(old=>old.map((x,j)=>j===i?{...x,price:e.target.value}:x))} placeholder="السعر (اختياري)" maxLength={30}/>
              <input className={inputClass} value={p.description} onChange={e=>setProducts(old=>old.map((x,j)=>j===i?{...x,description:e.target.value}:x))} placeholder="وصف المنتج" maxLength={160}/>
              <label className={labelClass}>صورة المنتج (رفع ملف، مش رابط)</label>
              <input className={inputClass} type="file" accept="image/*" onChange={e=>uploadImage(e.target.files?.[0],url=>setProducts(old=>old.map((x,j)=>j===i?{...x,image_url:url}:x)))}/>
              {p.image_url && <div className="flex items-center gap-3"><img src={p.image_url} alt={p.name||"المنتج"} className="h-16 w-16 rounded-xl border object-cover"/><button type="button" onClick={()=>setProducts(old=>old.map((x,j)=>j===i?{...x,image_url:""}:x))} className="text-sm font-bold text-red-600">حذف الصورة</button></div>}
            </div>)}
            <input type="hidden" name="products_json" value={JSON.stringify(products)}/>
          </section>
          <section className="space-y-4">
            <h2 className="border-b border-slate-100 pb-3 text-lg font-extrabold">التواصل</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelClass} htmlFor="phone">رقم الهاتف</label><input className={inputClass} id="phone" name="phone" type="tel" maxLength={30} dir="ltr" placeholder="+213..." /></div>
              <div><label className={labelClass} htmlFor="whatsapp">رقم WhatsApp</label><input className={inputClass} id="whatsapp" name="whatsapp" type="tel" maxLength={30} dir="ltr" placeholder="+213..." /></div>
              <div><label className={labelClass} htmlFor="instagram_url">Instagram</label><input className={inputClass} id="instagram_url" name="instagram_url" type="url" placeholder="https://instagram.com/..." /></div>
              <div><label className={labelClass} htmlFor="facebook_url">Facebook</label><input className={inputClass} id="facebook_url" name="facebook_url" type="url" placeholder="https://facebook.com/..." /></div>
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
          <button disabled={uploading} type="submit" className="w-full rounded-xl bg-blue-600 px-5 py-4 font-extrabold text-white shadow-sm hover:bg-blue-700">{uploading?"انتظر حتى يكتمل رفع الصورة...":"إنشاء الصفحة"}</button>
        </form>}
      </div>
    </div>
  </main>;
}
