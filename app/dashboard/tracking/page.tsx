import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import EcotrackSettingsForm from "@/components/EcotrackSettingsForm";
import OrdersView from "@/components/OrdersView";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TrackingDashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  if (user.email?.trim().toLowerCase() !== "tt246076@gmail.com") redirect("/dashboard");

  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm font-bold text-emerald-700 hover:underline dark:text-emerald-400">← الرجوع إلى لوحة التحكم</Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black">🚚 تتبع طلبات شركة التوصيل</h1>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800">خاص بصاحب المنصة</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            مركز موحّد لمتابعة الشحنات الواردة من شركات التوصيل. يتم عرض البيانات المستلمة فعلياً فقط، دون إظهار تكامل غير مفعّل على أنه جاهز.
          </p>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-lg font-black">رابط Webhook الخاص ببطاقتي</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">يُستخدم فقط مع شركة توصيل تؤكد دعم Webhook وصيغة التوقيع المطابقة.</p></div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">بانتظار تفعيل الشركة</span>
            </div>
            <code dir="ltr" className="mt-4 block overflow-x-auto rounded-xl bg-slate-100 p-4 text-left text-sm font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">https://bitaqati.online/api/webhook/yalidine</code>
            <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">لا تسجّل الرابط لدى شركة التوصيل قبل التأكد من طريقة المصادقة المطلوبة لديها. لا تشارك مفاتيح API أو Webhook في المحادثات.</p>
          </section>

          <section className="mt-7"><EcotrackSettingsForm /></section>
          <section className="mt-7"><OrdersView /></section>

          <section className="mt-7 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-black">WhatsApp Business Platform</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">واجهة الإرسال التلقائي لم تُفعّل بعد. يلزم ربط حساب WhatsApp Business، اعتماد قوالب الرسائل، وتسجيل موافقة الزبائن قبل تشغيل الإشعارات.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-black">المرحلة التالية في الربط</h2>
              <ul className="mt-2 list-disc space-y-2 pr-5 text-sm leading-7 text-slate-500 dark:text-slate-400">
                <li>تأكيد مسار API الرسمي الذي يعيد قائمة الطرود لحساب DHD/Ecotrack.</li>
                <li>بناء مزامنة مجدولة مع حفظ آخر مؤشر مزامنة ومنع تكرار الأحداث.</li>
                <li>ربط كل تغيّر حالة بقالب واتساب مع سجل إرسال ومحاولات فاشلة.</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
