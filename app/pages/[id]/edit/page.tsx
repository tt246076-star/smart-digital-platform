import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPageEditor from "./editor";

export default async function EditLandingPage({ params, searchParams }: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: page, error } = await supabase.from("landing_pages")
    .select("id, slug, business_name, headline, description, phone, whatsapp, logo_url, instagram_url, facebook_url, tiktok_url, youtube_url, custom_links, template, theme, seo_title, seo_description")
    .eq("id", params.id).eq("user_id", user.id).maybeSingle();

  if (error || !page) notFound();

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="text-sm font-bold text-slate-300 transition hover:text-white">← العودة إلى لوحة التحكم</Link>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-3xl border border-white/10 bg-white p-5 shadow-2xl sm:p-8">
            <div className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">محرر بطاقاتي الذكي</div>
            <h1 className="mt-4 text-3xl font-black text-slate-950">خلّي صفحتك تشبه علامتك ✨</h1>
            <p className="mt-2 leading-7 text-slate-500">بدّل القالب والألوان والمعلومات، وشوف معاينة مباشرة قبل الحفظ.</p>
            {searchParams.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{searchParams.error === "length" ? "بعض الحقول طويلة بزاف. راجع النصوص وحاول من جديد." : searchParams.error === "name" ? "اسم النشاط مطلوب." : "ما قدرناش نحفظ التعديلات. تأكد من تحديث قاعدة البيانات ثم أعد المحاولة."}</p>}
            <LandingPageEditor page={page} />
          </section>
          <aside className="h-fit rounded-3xl border border-white/10 bg-white/5 p-5 text-white lg:sticky lg:top-6">
            <p className="text-xs font-black uppercase tracking-widest text-violet-300">نصيحة تصميم</p>
            <h2 className="mt-3 text-xl font-black">صفحة أقوى، تواصل أوضح</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              <li>• عنوان قصير يوضح فائدة نشاطك.</li><li>• اختار لونًا متناسقًا مع علامتك.</li><li>• تأكد من رقم الهاتف وروابط التواصل.</li><li>• استعمل صورة واضحة للشعار.</li>
            </ul>
            <a href={`/p/${page.slug}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full justify-center rounded-xl border border-white/20 px-4 py-3 text-sm font-extrabold transition hover:bg-white/10">فتح الصفحة الحالية ↗</a>
          </aside>
        </div>
      </div>
    </main>
  );
}
