import { redirect } from "next/navigation";
import { SITE } from "@/lib/site";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { setUserPlan, deleteLandingPage, setUserProductLimit, deleteCatalogProduct } from "./actions";
import DeleteProductForm from "./DeleteProductForm";
import DeletePageForm from "./DeletePageForm";
import AdminOrders from "./AdminOrders";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: { saved?: string; deleted?: string; productdeleted?: string; productsaved?: string; error?: string } }) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");
  const adminEmail = (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase();
  if (!adminEmail || user.email?.trim().toLowerCase() !== adminEmail) redirect("/dashboard?error=readonly");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return <main dir="rtl" className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-4xl rounded-2xl bg-white p-6"><h1 className="text-2xl font-black">إعداد لوحة الإدارة</h1><p className="mt-3 leading-7">أضف ADMIN_EMAIL و SUPABASE_SERVICE_ROLE_KEY في إعدادات Vercel ثم أعد النشر. لا تضع مفتاح الخدمة في أي ملف ظاهر للمتصفح.</p><p className="mt-3 text-sm text-amber-700">تأكد أن المفتاح تابع لنفس مشروع Supabase الذي يستخدمه الموقع.</p></div></main>;

  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const [usersResult, plansResult, pagesResult, productLimitsResult, ordersResult] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("user_access_plans").select("user_id, plan_type, expires_at, max_pages, advanced_features"),
    admin.from("landing_pages").select("id, user_id, slug, business_name, created_at").order("created_at", { ascending: false }).limit(200),
    admin.from("user_product_limits").select("user_id, max_products"),
    admin.from("store_orders").select("id,page_id,customer_name,customer_phone,customer_address,items,total_amount,status,notes,created_at,landing_pages(business_name,slug)").order("created_at", { ascending: false }).limit(100)
  ]);
  const users = usersResult.data?.users || [];
  const plansData = plansResult.data || [];
  const pagesData = pagesResult.data || [];
  const productLimits = new Map((productLimitsResult.data || []).map((p: any) => [p.user_id, p.max_products]));
  const ordersData = ordersResult.data || [];
  const plans = new Map(plansData.map((p: any) => [p.user_id, p]));
  const loadErrors = [
    usersResult.error ? `الحسابات: ${usersResult.error.message}` : "",
    plansResult.error ? `خطط الاشتراك: ${plansResult.error.message}` : "",
    pagesResult.error ? `الصفحات: ${pagesResult.error.message}` : "",
    productLimitsResult.error ? `حدود المنتجات: ${productLimitsResult.error.message}` : "",
    ordersResult.error ? `طلبات الزبائن: ${ordersResult.error.message}` : ""
  ].filter(Boolean);
  const countPlan = (type: string) => plansData.filter((p: any) => p.plan_type === type).length;

  return <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-blue-600">{SITE.name}</p><h1 className="mt-1 text-3xl font-black">لوحة إدارة الاشتراكات</h1><p className="mt-2 text-slate-500">إدارة الحسابات والخطط بعد التأكد من الدفع.</p></div><div className="flex flex-wrap gap-2"><a href="/admin/store" className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">إدارة منتجات المتجر</a><a href="/dashboard" className="rounded-xl border bg-white px-4 py-2 font-bold">العودة للموقع</a></div></div>
      {searchParams.saved === "1" && <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">تم تحديث الاشتراك بنجاح.</p>}
      {searchParams.deleted === "1" && <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">تم حذف الصفحة.</p>}
      {searchParams.productdeleted === "1" && <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">تم حذف المنتج من الكتالوج.</p>}
      {searchParams.productsaved === "1" && <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">تم حفظ حد المنتجات للعميل.</p>}
      {searchParams.error && <p className="mt-5 rounded-xl bg-red-50 p-4 font-bold text-red-800">تعذّر تنفيذ العملية. راجع رسائل الخطأ أدناه وإعدادات Supabase.</p>}
      {loadErrors.length > 0 && <section className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900"><h2 className="font-black">مشكلة في تحميل بيانات الإدارة</h2><p className="mt-1 text-sm">هذه رسالة الخطأ الفعلية من Supabase للمساعدة في تحديد السبب. لا تعرض مفاتيح سرية هنا.</p><ul className="mt-3 list-disc space-y-1 pr-5 text-sm">{loadErrors.map((err, i) => <li key={i}>{err}</li>)}</ul><p className="mt-3 text-sm">إذا كانت الحسابات 0 بينما توجد صفحات، تحقق أن NEXT_PUBLIC_SUPABASE_URL وSUPABASE_SERVICE_ROLE_KEY من مشروع Supabase نفسه.</p></section>}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">الحسابات المسجلة</p><p className="mt-2 text-3xl font-black">{users.length}</p></div>
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">تجربة مجانية</p><p className="mt-2 text-3xl font-black">{countPlan("trial")}</p></div>
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">عملاء عاديون</p><p className="mt-2 text-3xl font-black">{countPlan("customer")}</p></div>
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">عملاء خاصون</p><p className="mt-2 text-3xl font-black">{countPlan("special")}</p></div>
      </div>

      <AdminOrders initialOrders={ordersData as any} />

      <section className="mt-8 rounded-2xl border bg-white p-5">
        <h2 className="text-xl font-black">خطط الاشتراك</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border p-4"><h3 className="font-black">تجربة مجانية</h3><p className="mt-2 text-sm text-slate-600">3 أيام · عرض فقط · لا تسمح بإنشاء صفحات مدفوعة.</p></article>
          <article className="rounded-xl border p-4"><h3 className="font-black">عميل عادي</h3><p className="mt-2 text-sm text-slate-600">صفحة واحدة · بدون تاريخ انتهاء تلقائي.</p></article>
          <article className="rounded-xl border p-4"><h3 className="font-black">عميل خاص</h3><p className="mt-2 text-sm text-slate-600">حتى 5 صفحات · الميزات المتقدمة مفعّلة · بدون تاريخ انتهاء تلقائي.</p></article>
        </div>
        <p className="mt-3 text-xs text-slate-500">هذه الصلاحيات تُحفظ للحساب عند الضغط على «حفظ الصلاحيات». لا تغيّر الاشتراك إلا بعد التأكد من الدفع.</p>
      </section>

      <section className="mt-8 rounded-2xl border bg-white p-5">
        <h2 className="text-xl font-black">إدارة الصفحات</h2>
        <p className="mt-1 text-sm text-slate-500">حذف الصفحة نهائي ولا يحذف حساب صاحبها. راجع اسم الصفحة قبل الحذف.</p>
        <div className="mt-4 space-y-3">
          {pagesData.map((page: any) => <article key={page.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
            <div><p className="font-extrabold">{page.business_name || "صفحة بلا اسم"}</p><p className="mt-1 text-xs text-slate-500" dir="ltr">{page.slug} · {page.user_id}</p></div>
            <DeletePageForm action={deleteLandingPage} pageId={page.id} />
          </article>)}
          {pagesResult.error && <p className="text-sm text-red-700">تعذر تحميل الصفحات: {pagesResult.error.message}</p>}
          {!pagesResult.error && pagesData.length === 0 && <p className="text-sm text-slate-500">لا توجد صفحات.</p>}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4"><h2 className="text-2xl font-black">الحسابات وإدارة الاشتراكات</h2><p className="mt-1 text-sm text-slate-500">اختر خطة كل حساب ثم احفظ. لا يوجد خيار لحذف الحسابات.</p></div>
        {usersResult.error ? <p className="rounded-xl bg-red-50 p-4 text-red-800">لم نتمكن من قراءة الحسابات: {usersResult.error.message}</p> : users.length === 0 ? <div className="rounded-2xl border bg-white p-5"><p className="font-bold">لم يتم العثور على حسابات في Auth بهذا المشروع.</p><p className="mt-2 text-sm text-slate-600">بما أن الصفحات موجودة، فالاحتمال الأقوى أن رابط Supabase أو مفتاح الخدمة لا يعودان إلى مشروع تسجيل الحسابات. قارن Project URL في Supabase مع NEXT_PUBLIC_SUPABASE_URL في Vercel، ولا ترسل المفتاح السري لأي شخص.</p></div> : <div className="space-y-4">{users.map((item) => {
          const plan: any = plans.get(item.id);
          const planName = plan?.plan_type === "special" ? "عميل خاص" : plan?.plan_type === "customer" ? "عميل عادي" : "تجربة مجانية";
          const expired = plan?.expires_at && new Date(plan.expires_at).getTime() < Date.now();
          return <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-extrabold" dir="ltr">{item.email || "بريد غير متوفر"}</h3><p className="mt-1 text-xs text-slate-400" dir="ltr">{item.id}</p><p className="mt-2 text-sm text-slate-600">الخطة الحالية: {planName}{expired ? " (منتهية)" : ""} · الحد: {plan?.max_pages ?? 0} صفحات</p>
              <form action={setUserProductLimit} className="mt-3 flex flex-wrap items-end gap-2"><input type="hidden" name="user_id" value={item.id}/><label className="text-sm font-bold">الحد الأقصى لمنتجات الكتالوج<input type="number" min="0" max="500" name="max_products" defaultValue={productLimits.get(item.id) ?? 3} className="mt-1 block w-32 rounded-lg border px-3 py-2" /></label><button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white">حفظ حد المنتجات</button><span className="text-xs text-slate-500">0 = لا يسمح بمنتجات، حتى 500</span></form>{plan?.expires_at && <p className="mt-1 text-xs text-slate-500">تنتهي في: {new Date(plan.expires_at).toLocaleDateString("ar-DZ")}</p>}</div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{item.email_confirmed_at ? "البريد مؤكد" : "بانتظار التأكيد"}</span></div>
            <form action={setUserPlan} className="mt-4 flex flex-wrap items-end gap-3"><input type="hidden" name="user_id" value={item.id}/><label className="min-w-48 flex-1 text-sm font-bold">تغيير الخطة<select name="plan_type" defaultValue={plan?.plan_type || "trial"} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option value="trial">تجربة مجانية — 3 أيام، عرض فقط</option><option value="customer">عميل عادي — صفحة واحدة</option><option value="special">عميل خاص — 5 صفحات وميزات متقدمة</option></select></label><button className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700">حفظ الصلاحيات</button></form>
          </article>;
        })}</div>}
        {users.length >= 1000 && <p className="mt-4 text-sm text-amber-700">يتم عرض أول 1000 حساب. يلزم إضافة ترقيم صفحات إذا كان لديك أكثر من ذلك.</p>}
      </section>
    </div>
  </main>;
}
