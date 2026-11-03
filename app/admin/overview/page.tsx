import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 p-6 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-2xl border bg-white p-6">
          <h1 className="text-2xl font-black">إعداد لوحة الإدارة</h1>
          <p className="mt-3 leading-7">إعداد ADMIN_EMAIL غير موجود. أضفه في إعدادات Vercel ثم أعد النشر.</p>
        </section>
      </main>
    );
  }
  if (user.email?.trim().toLowerCase() !== adminEmail) redirect("/dashboard?error=readonly");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return (
      <main dir="rtl" className="min-h-screen bg-slate-50 p-6 text-slate-900">
        <section className="mx-auto max-w-3xl rounded-2xl border bg-white p-6">
          <h1 className="text-2xl font-black">إعداد لوحة الإدارة</h1>
          <p className="mt-3 leading-7">تأكد من إعداد NEXT_PUBLIC_SUPABASE_URL وSUPABASE_SERVICE_ROLE_KEY في Vercel. لا تشارك مفتاح الخدمة مع أي شخص.</p>
        </section>
      </main>
    );
  }

  const admin = createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [usersResult, pagesResult, plansResult, ordersResult] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("landing_pages").select("id", { count: "exact", head: true }),
    admin.from("user_access_plans").select("user_id, plan_type", { count: "exact" }),
    admin.from("store_orders").select("id", { count: "exact", head: true }),
  ]);

  const usersCount = usersResult.data?.users.length ?? 0;
  const pagesCount = pagesResult.count;
  const plans = plansResult.data ?? [];
  const ordersCount = ordersResult.count;
  const errors = [
    usersResult.error ? "تعذر تحميل الحسابات." : "",
    pagesResult.error ? "تعذر تحميل عدد الصفحات." : "",
    plansResult.error ? "تعذر تحميل الاشتراكات." : "",
    ordersResult.error ? "تعذر تحميل عدد الطلبات." : "",
  ].filter(Boolean);
  const planCount = (type: string) => plans.filter((plan) => plan.plan_type === type).length;

  const metrics = [
    { label: "الحسابات المسجلة", value: usersCount.toLocaleString("ar-DZ"), detail: usersCount === 1000 ? "أول 1000 حساب محمّلة" : "من حسابات Auth", color: "border-sky-200 bg-sky-50 text-sky-800" },
    { label: "الصفحات المنشأة", value: pagesCount == null ? "—" : pagesCount.toLocaleString("ar-DZ"), detail: "عدد إجمالي للصفحات", color: "border-indigo-200 bg-indigo-50 text-indigo-800" },
    { label: "العملاء العاديون", value: planCount("customer").toLocaleString("ar-DZ"), detail: "حسب خطط الاشتراك المحفوظة", color: "border-emerald-200 bg-emerald-50 text-emerald-800" },
    { label: "العملاء الخاصون", value: planCount("special").toLocaleString("ar-DZ"), detail: "حسب خطط الاشتراك المحفوظة", color: "border-violet-200 bg-violet-50 text-violet-800" },
    { label: "التجارب المجانية", value: planCount("trial").toLocaleString("ar-DZ"), detail: "حسب خطط الاشتراك المحفوظة", color: "border-amber-200 bg-amber-50 text-amber-800" },
    { label: "طلبات المتجر", value: ordersCount == null ? "—" : ordersCount.toLocaleString("ar-DZ"), detail: "عدد إجمالي للطلبات", color: "border-rose-200 bg-rose-50 text-rose-800" },
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-white p-6 shadow-sm">
          <div>
            <p className="font-bold text-blue-700">{SITE.name}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">مركز إدارة المنصة</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">نظرة عامة للقراءة فقط على الحسابات والاشتراكات والصفحات والطلبات.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/admin" className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-800">إدارة المستخدمين وVIP</a>
            <a href="/admin/store" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold transition hover:bg-slate-50">إدارة المتجر</a>
            <a href="/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold transition hover:bg-slate-50">لوحة المستخدم</a>
          </div>
        </header>

        {errors.length > 0 && (
          <section role="alert" className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
            <h2 className="font-black">بعض الإحصائيات غير متاحة</h2>
            <ul className="mt-2 list-disc space-y-1 pr-5 text-sm">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
            <p className="mt-2 text-xs">الأرقام التي لم يتم تحميلها تظهر بشرطة بدل عرض قيمة غير مؤكدة.</p>
          </section>
        )}

        <section className="mt-6">
          <div className="mb-4">
            <h2 className="text-xl font-black">ملخص المنصة</h2>
            <p className="mt-1 text-sm text-slate-500">أرقام مباشرة من Supabase؛ لا تغيّر أي بيانات أو إعدادات.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <article key={metric.label} className={`rounded-2xl border p-5 shadow-sm ${metric.color}`}>
                <p className="text-sm font-bold">{metric.label}</p>
                <p className="mt-3 text-3xl font-black tabular-nums">{metric.value}</p>
                <p className="mt-2 text-xs opacity-80">{metric.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border bg-white p-5 sm:p-6">
          <h2 className="text-xl font-black">اختصارات الإدارة</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <a href="/admin" className="group rounded-xl border p-4 transition hover:border-blue-300 hover:bg-blue-50">
              <h3 className="font-extrabold group-hover:text-blue-800">المستخدمون والاشتراكات</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">إدارة الخطط الحالية وحدود معرض الصور العادي وVIP.</p>
              <span className="mt-3 inline-block text-sm font-bold text-blue-700">فتح الإدارة ←</span>
            </a>
            <a href="/admin/store" className="group rounded-xl border p-4 transition hover:border-emerald-300 hover:bg-emerald-50">
              <h3 className="font-extrabold group-hover:text-emerald-800">منتجات المتجر</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">الوصول إلى صفحة إدارة منتجات المتجر الموجودة.</p>
              <span className="mt-3 inline-block text-sm font-bold text-emerald-700">فتح المتجر ←</span>
            </a>
            <div className="rounded-xl border border-dashed p-4">
              <h3 className="font-extrabold">مراقبة الأخطاء</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">مرحلة لاحقة: إضافة سجل إداري ومراقبة عمليات التكامل بعد تحديد متطلباتها.</p>
              <span className="mt-3 inline-block text-sm font-bold text-slate-500">مقترح للمرحلة القادمة</span>
            </div>
          </div>
        </section>

        <footer className="mt-6 text-xs leading-5 text-slate-500">هذه الصفحة إضافية ومستقلة. لم يتم تعديل صفحات البطاقات أو منطق إنشائها أو عرضها أو بياناتها.</footer>
      </div>
    </main>
  );
}
