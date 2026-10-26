import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: pages, error: pagesError } = await supabase
    .from("landing_pages")
    .select("id, slug, business_name, headline, is_published, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <section className="flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-l from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="text-sm font-bold text-blue-200">مساحة العمل الخاصة بك</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                أهلًا {profile?.display_name || profile?.username || "بك"} 👋
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                أنشئ صفحة لنشاطك التجاري، خصّص معلوماتك وروابط التواصل، وشاركها مع زبائنك.
              </p>
            </div>
            <Link href="/pages/new" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-500 px-5 py-3 font-extrabold text-white transition hover:bg-blue-400">
              <span className="ml-2 text-xl">+</span> إنشاء صفحة جديدة
            </Link>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">صفحات الهبوط</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{pages?.length ?? 0}</p>
              <p className="mt-1 text-xs text-slate-400">إجمالي الصفحات المرتبطة بحسابك</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">الصفحات المنشورة</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{pages?.filter((page) => page.is_published).length ?? 0}</p>
              <p className="mt-1 text-xs text-slate-400">متاحة عبر روابطها العامة</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-500">الحساب</p>
              <p className="mt-2 truncate text-base font-extrabold text-slate-950" dir="ltr">{user.email || "—"}</p>
              <p className="mt-1 text-xs text-slate-400">حسابك المسجل حاليًا</p>
            </div>
          </section>

          <section className="mt-9">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-950">صفحاتي</h2>
                <p className="mt-1 text-sm text-slate-500">أدر صفحات نشاطك التجاري من مكان واحد.</p>
              </div>
              <Link href="/pages/new" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
                + إضافة صفحة
              </Link>
            </div>

            {pagesError ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
                لم نستطع تحميل صفحاتك بعد. إذا لم تنشئ جدول <code>landing_pages</code> في Supabase، نفّذ ملف SQL الخاص بالمشروع أولًا، ثم حدّث الصفحة.
              </div>
            ) : pages && pages.length > 0 ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {pages.map((page) => (
                  <article key={page.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl font-black text-blue-700">
                          {page.business_name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-extrabold text-slate-950">{page.business_name}</h3>
                          <p className="mt-1 truncate text-sm text-slate-500">{page.headline || "بدون عنوان إضافي"}</p>
                        </div>
                      </div>
                      <span className={page.is_published ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600"}>
                        {page.is_published ? "منشورة" : "مسودة"}
                      </span>
                    </div>
                    <p className="mt-4 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500" dir="ltr">/p/{page.slug}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/p/${page.slug}`} target="_blank" className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700">معاينة الصفحة</Link>
                      <Link href={`/pages/${page.id}/edit`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700">تعديل</Link>
                      <button type="button" disabled title="ستتاح هذه الميزة في المرحلة التالية" className="cursor-not-allowed rounded-lg border border-slate-100 px-3 py-2 text-sm font-bold text-slate-300">حذف</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">✦</div>
                <h3 className="mt-4 text-xl font-black text-slate-950">أنشئ أول صفحة لنشاطك</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">أضف اسم المحل وصورته ورقم الهاتف وروابط WhatsApp وInstagram وغيرها، ثم شارك الصفحة مع زبائنك.</p>
                <Link href="/pages/new" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-extrabold text-white hover:bg-blue-700">ابدأ إنشاء صفحتك</Link>
              </div>
            )}
          </section>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-extrabold text-slate-950">معلومات الحساب</h2>
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600">
              <p>البريد: <span dir="ltr" className="font-semibold">{user.email || "غير متوفر"}</span></p>
              <p>اسم المستخدم: <span dir="ltr" className="font-semibold">{profile?.username || "—"}</span></p>
            </div>
          </section>

          <form action="/auth/signout" method="post" className="mt-6">
            <button type="submit" className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-bold text-slate-700 hover:border-red-300 hover:text-red-600">تسجيل الخروج</button>
          </form>
        </div>
      </main>
    </>
  );
}
