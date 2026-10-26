import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateLandingPage } from "./actions";

const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
const labelClass = "block text-sm font-bold text-slate-800";

export default async function EditLandingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: page, error } = await supabase
    .from("landing_pages")
    .select("id, business_name, headline, description, phone, whatsapp, logo_url, instagram_url, facebook_url, tiktok_url, youtube_url")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !page) notFound();

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-blue-600">← العودة إلى لوحة التحكم</Link>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
          <div className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">تعديل الصفحة</div>
          <h1 className="mt-4 text-3xl font-black text-slate-950">عدّل معلومات نشاطك</h1>
          <p className="mt-3 leading-7 text-slate-500">غيّر معلومات المحل وروابط التواصل، ثم احفظ التغييرات.</p>
          {searchParams.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {searchParams.error === "name" ? "اسم النشاط مطلوب وأقصى طول 100 حرف." : searchParams.error === "length" ? "تحقق من أطوال النصوص وأرقام الهاتف." : "تعذر حفظ التعديلات. حاول مجددًا."}
          </p>}
          <form action={updateLandingPage.bind(null, page.id)} className="mt-8 space-y-6">
            <section className="space-y-4">
              <h2 className="border-b border-slate-100 pb-3 text-lg font-extrabold">معلومات النشاط</h2>
              <div><label className={labelClass} htmlFor="business_name">اسم المحل أو النشاط *</label><input className={inputClass} id="business_name" name="business_name" required maxLength={100} defaultValue={page.business_name} /></div>
              <div><label className={labelClass} htmlFor="headline">عنوان الصفحة</label><input className={inputClass} id="headline" name="headline" maxLength={140} defaultValue={page.headline} /></div>
              <div><label className={labelClass} htmlFor="description">وصف قصير</label><textarea className={inputClass} id="description" name="description" rows={4} maxLength={1000} defaultValue={page.description} /></div>
              <div><label className={labelClass} htmlFor="logo_url">رابط صورة المحل أو الشعار</label><input className={inputClass} id="logo_url" name="logo_url" type="url" defaultValue={page.logo_url} placeholder="https://..." /></div>
            </section>
            <section className="space-y-4">
              <h2 className="border-b border-slate-100 pb-3 text-lg font-extrabold">التواصل الاجتماعي</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelClass} htmlFor="phone">رقم الهاتف</label><input className={inputClass} id="phone" name="phone" type="tel" maxLength={30} defaultValue={page.phone} dir="ltr" /></div>
                <div><label className={labelClass} htmlFor="whatsapp">رقم WhatsApp</label><input className={inputClass} id="whatsapp" name="whatsapp" type="tel" maxLength={30} defaultValue={page.whatsapp} dir="ltr" /></div>
                <div><label className={labelClass} htmlFor="instagram_url">Instagram</label><input className={inputClass} id="instagram_url" name="instagram_url" type="url" defaultValue={page.instagram_url} placeholder="https://instagram.com/..." /></div>
                <div><label className={labelClass} htmlFor="facebook_url">Facebook</label><input className={inputClass} id="facebook_url" name="facebook_url" type="url" defaultValue={page.facebook_url} placeholder="https://facebook.com/..." /></div>
                <div><label className={labelClass} htmlFor="tiktok_url">TikTok</label><input className={inputClass} id="tiktok_url" name="tiktok_url" type="url" defaultValue={page.tiktok_url} placeholder="https://tiktok.com/@..." /></div>
                <div><label className={labelClass} htmlFor="youtube_url">YouTube</label><input className={inputClass} id="youtube_url" name="youtube_url" type="url" defaultValue={page.youtube_url} placeholder="https://youtube.com/..." /></div>
              </div>
            </section>
            <button type="submit" className="w-full rounded-xl bg-blue-600 px-5 py-4 font-extrabold text-white hover:bg-blue-700">حفظ التعديلات</button>
          </form>
        </div>
      </div>
    </main>
  );
}
