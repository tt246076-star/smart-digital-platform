import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import DashboardThemeToggle from "./theme-toggle";
import SharePageButton from "@/components/SharePageButton";
import { duplicateLandingPage } from "./actions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({ searchParams }: { searchParams: { created?: string; editError?: string; duplicated?: string; duplicateError?: string } }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("username, display_name").eq("id", user.id).maybeSingle();
  const { data: pages, error: pagesError } = await supabase.from("landing_pages")
    .select("id, slug, business_name, headline, is_published, created_at")
    .eq("user_id", user.id).order("created_at", { ascending: false });
  const pageIds = (pages || []).map((page) => page.id);
  const { data: events } = pageIds.length ? await supabase.from("landing_page_events").select("event_type").in("page_id", pageIds) : { data: [] as { event_type: string }[] };
  const totalViews = events?.filter((event) => event.event_type === "view").length ?? 0;
  const totalClicks = events?.filter((event) => event.event_type === "contact_click").length ?? 0;

  return <>
    <Header />
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div><p className="text-sm font-bold text-blue-600 dark:text-blue-400">مساحة العمل الخاصة بك</p><h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">أهلًا {profile?.display_name || "بك"} 👋</h1><p className="mt-2 text-slate-500 dark:text-slate-400">أنشئ صفحات نشاطك التجاري وصمّمها من مكان واحد.</p></div>
          <div className="flex flex-wrap items-center gap-3"><DashboardThemeToggle /><Link href="/pages/new" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-extrabold text-white shadow-sm transition hover:bg-blue-700"><span className="ml-2 text-xl">+</span> إنشاء صفحة هبوط</Link></div>
        </div>
        {searchParams.created === "1" && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">تم إنشاء صفحتك بنجاح!</div>}
        {searchParams.duplicated === "1" && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">تم نسخ الصفحة كمسودة. افتحها للتعديل ثم انشرها.</div>}
        {searchParams.duplicateError === "1" && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">تعذر نسخ الصفحة. تأكد من تشغيل تحديث قاعدة البيانات في Supabase.</div>}
        {searchParams.editError && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">تعذر تعديل الصفحة. تأكد من تشغيل تحديث قاعدة البيانات في Supabase.</div>}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500 dark:text-slate-400">صفحات الهبوط</p><p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{pages?.length ?? 0}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500 dark:text-slate-400">الصفحات المنشورة</p><p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{pages?.filter((page) => page.is_published).length ?? 0}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500 dark:text-slate-400">زيارات الصفحات</p><p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{totalViews}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500 dark:text-slate-400">نقرات التواصل</p><p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{totalClicks}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-colors dark:border-slate-800 dark:bg-slate-900"><p className="text-sm text-slate-500 dark:text-slate-400">الحساب</p><p className="mt-2 truncate text-sm font-bold text-slate-950 dark:text-white" dir="ltr">{user.email || "غير متوفر"}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">اسم المستخدم: {profile?.username || "—"}</p></div>
        </section>
        <section className="mt-10">
          <div className="mb-5"><h2 className="text-2xl font-black text-slate-950 dark:text-white">صفحاتي</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">عاين الصفحة، أو ادخل للمحرر لتغيير القالب والألوان والمعلومات.</p></div>
          {pagesError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">لم نتمكن من تحميل صفحاتك. تأكد من إنشاء جدول landing_pages في Supabase باستخدام ملف SQL.</div> :
          pages && pages.length > 0 ? <div className="grid gap-4 md:grid-cols-2">{pages.map((page) => <article key={page.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-lg font-extrabold text-slate-950 dark:text-white">{page.business_name}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{page.headline || "لا يوجد عنوان فرعي"}</p></div><span className={page.is_published ? "shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"}>{page.is_published ? "منشورة" : "مسودة"}</span></div>
            <p className="mt-4 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300" dir="ltr">/p/{page.slug}</p>
            <div className="mt-4 flex flex-wrap gap-2"><Link href={`/p/${page.slug}`} target="_blank" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 dark:bg-slate-700">معاينة الصفحة</Link><Link href={`/pages/${page.id}/edit`} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-700">تعديل التصميم ✨</Link><SharePageButton slug={page.slug} /><form action={duplicateLandingPage}><input type="hidden" name="id" value={page.id} /><button type="submit" className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-bold text-violet-700 transition hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300 dark:hover:bg-violet-950">نسخ الصفحة</button></form></div>
          </article>)}</div> :
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl dark:bg-blue-950">↗</div><h3 className="mt-5 text-xl font-extrabold text-slate-950 dark:text-white">ابدأ بإنشاء أول صفحة لك</h3><p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">أضف معلومات نشاطك، ثم خصّص الألوان والقالب وشارك الرابط مع الزبائن.</p><Link href="/pages/new" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-extrabold text-white hover:bg-blue-700">إنشاء أول صفحة</Link></div>}
        </section>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><h2 className="font-extrabold text-slate-900 dark:text-white">معلومات الحساب</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400" dir="ltr">{user.email || "غير متوفر"}</p><form action="/auth/signout" method="post" className="mt-4"><button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold hover:border-slate-500 dark:border-slate-700 dark:hover:border-slate-500">تسجيل الخروج</button></form></section>
      </div>
    </main>
  </>;
}
