import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { setUserPlan } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");
  const adminEmail = "tt246076@gmail.com";
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) redirect("/dashboard?error=readonly");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return <main dir="rtl" className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-4xl rounded-2xl bg-white p-6"><h1 className="text-2xl font-black">إعداد لوحة الإدارة</h1><p className="mt-3 leading-7">أضف المتغيرين ADMIN_EMAIL و SUPABASE_SERVICE_ROLE_KEY في إعدادات Vercel ثم أعد النشر. لا تضع مفتاح الخدمة في أي ملف ظاهر للمتصفح.</p></div></main>;

  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const [{ data: usersData }, { data: plansData }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    admin.from("user_access_plans").select("user_id, plan_type, expires_at, max_pages, advanced_features")
  ]);
  const plans = new Map((plansData || []).map((p: any) => [p.user_id, p]));
  return <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-blue-600">بطاقاتي</p><h1 className="mt-1 text-3xl font-black">لوحة إدارة الاشتراكات</h1><p className="mt-2 text-slate-500">إدارة صلاحيات المستخدمين بعد التأكد من الدفع.</p></div><a href="/dashboard" className="rounded-xl border bg-white px-4 py-2 font-bold">العودة للموقع</a></div>
      {searchParams.saved === "1" && <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">تم تحديث الاشتراك.</p>}
      {searchParams.error && <p className="mt-5 rounded-xl bg-red-50 p-4 font-bold text-red-800">تعذر التحديث. تحقق من إعدادات Supabase وملفات SQL.</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">عدد الحسابات</p><p className="mt-2 text-3xl font-black">{usersData.users.length}</p></div>
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">عملاء عاديون</p><p className="mt-2 text-3xl font-black">{(plansData || []).filter((p: any) => p.plan_type === "customer").length}</p></div>
        <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">عملاء خاصون</p><p className="mt-2 text-3xl font-black">{(plansData || []).filter((p: any) => p.plan_type === "special").length}</p></div>
      </div>
      <section className="mt-8 space-y-4">{usersData.users.map((item) => {
        const plan: any = plans.get(item.id);
        return <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-extrabold" dir="ltr">{item.email || "بريد غير متوفر"}</h2><p className="mt-1 text-xs text-slate-400" dir="ltr">{item.id}</p><p className="mt-2 text-sm text-slate-600">الخطة: {plan?.plan_type === "special" ? "عميل خاص" : plan?.plan_type === "customer" ? "عميل مشترك" : "تجربة مشاهدة فقط"} · الحد: {plan?.max_pages ?? 0} صفحات</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{item.email_confirmed_at ? "البريد مؤكد" : "بانتظار التأكيد"}</span></div>
          <form action={setUserPlan} className="mt-4 flex flex-wrap items-end gap-3"><input type="hidden" name="user_id" value={item.id}/><label className="min-w-48 flex-1 text-sm font-bold">الخطة<select name="plan_type" defaultValue={plan?.plan_type || "trial"} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option value="trial">تجربة 3 أيام (عرض فقط)</option><option value="customer">زبون (صفحة واحدة)</option><option value="special">زبون خاص (5 صفحات)</option></select></label><button className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700">حفظ الصلاحيات</button></form>
        </article>;
      })}</section>
      {usersData.users.length >= 200 && <p className="mt-4 text-sm text-amber-700">يتم عرض أول 200 حساب فقط.</p>}
    </div>
  </main>;
}
