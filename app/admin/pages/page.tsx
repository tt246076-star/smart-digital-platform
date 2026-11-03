import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { deleteLandingPage } from "../actions";
import DeletePageForm from "../DeletePageForm";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    return <main dir="rtl" className="min-h-screen bg-slate-50 p-6"><section className="mx-auto max-w-4xl rounded-2xl bg-white p-6"><h1 className="text-2xl font-black">إعداد لوحة الإدارة</h1><p className="mt-3">أضف ADMIN_EMAIL إلى إعدادات Vercel ثم أعد النشر.</p></section></main>;
  }
  if (user.email?.trim().toLowerCase() !== adminEmail) redirect("/dashboard?error=readonly");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return <main dir="rtl" className="min-h-screen bg-slate-50 p-6"><section className="mx-auto max-w-4xl rounded-2xl bg-white p-6"><h1 className="text-2xl font-black">إعداد لوحة الإدارة</h1><p className="mt-3">تحقق من إعداد NEXT_PUBLIC_SUPABASE_URL وSUPABASE_SERVICE_ROLE_KEY في Vercel.</p></section></main>;
  }

  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const [pagesResult, usersResult] = await Promise.all([
    admin.from("landing_pages").select("id,user_id,slug,business_name,template,is_published,created_at").order("created_at", { ascending: false }).limit(1000),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const pages = pagesResult.data || [];
  const usersById = new Map((usersResult.data?.users || []).map((item) => [item.id, item.email || "بريد غير متوفر"]));
  const loadErrors = [
    pagesResult.error ? `الصفحات: ${pagesResult.error.message}` : "",
    usersResult.error ? `الحسابات: ${usersResult.error.message}` : "",
  ].filter(Boolean);

  return <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-bold text-blue-600">بطاقتي</p><h1 className="mt-1 text-3xl font-black">إدارة الصفحات</h1><p className="mt-2 text-slate-500">اسم الصفحة، إيميل منشئها، نوع الصفحة، المعاينة والحذف.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/admin" className="rounded-xl border bg-white px-4 py-2 font-bold">لوحة الإدارة</Link><Link href="/admin/overview" className="rounded-xl border bg-white px-4 py-2 font-bold">نظرة عامة</Link></div>
      </div>
      {params.deleted === "1" && <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">تم حذف الصفحة.</p>}
      {params.error && <p className="mt-5 rounded-xl bg-red-50 p-4 font-bold text-red-800">تعذّر تنفيذ العملية. راجع أخطاء التحميل أدناه.</p>}
      {loadErrors.length > 0 && <section className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900"><h2 className="font-black">مشكلة في تحميل البيانات</h2><ul className="mt-2 list-disc space-y-1 pr-5 text-sm">{loadErrors.map((error, i) => <li key={i}>{error}</li>)}</ul></section>}
      <section className="mt-6 rounded-2xl border bg-white p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-black">كل الصفحات</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold">{pages.length} صفحة</span></div>
        <div className="space-y-3">
          {pages.map((page: any) => {
            const isVip = page.template === "vip";
            const href = `${isVip ? "/vip/" : "/p/"}${page.slug}`;
            return <article key={page.id} className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-extrabold">{page.business_name || "صفحة بلا اسم"}</h3><span className={isVip ? "rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-800" : "rounded-full bg-blue-100 px-2 py-1 text-xs font-black text-blue-800"}>{isVip ? "VIP" : "عادية"}</span><span className={page.is_published ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800" : "rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700"}>{page.is_published ? "منشورة" : "مسودة"}</span></div>
                <p className="mt-2 break-all text-sm font-bold text-slate-700" dir="ltr">{usersById.get(page.user_id) || "تعذر تحديد البريد الإلكتروني"}</p>
                <p className="mt-1 break-all text-xs text-slate-500" dir="ltr">{href}</p>
                <p className="mt-1 text-xs text-slate-400">تاريخ الإنشاء: {page.created_at ? new Date(page.created_at).toLocaleDateString("ar-DZ") : "غير متوفر"}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <a href={href} target="_blank" rel="noreferrer" aria-label={`معاينة ${page.business_name || page.slug}`} title="معاينة الصفحة" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"><span aria-hidden="true">👁</span> معاينة</a>
                <DeletePageForm action={deleteLandingPage} pageId={page.id} />
              </div>
            </article>;
          })}
          {!pagesResult.error && pages.length === 0 && <p className="py-10 text-center text-slate-500">لا توجد صفحات بعد.</p>}
        </div>
        {pages.length >= 1000 && <p className="mt-4 text-sm text-amber-700">تُعرض أول 1000 صفحة فقط حاليًا.</p>}
      </section>
    </div>
  </main>;
}
