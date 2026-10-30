import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

type ShipmentStatus = "in_transit" | "delivered" | "returned";
const statusLabels: Record<ShipmentStatus, string> = {
  in_transit: "في الطريق",
  delivered: "تم التسليم",
  returned: "مرتجع",
};
const statusStyles: Record<ShipmentStatus, string> = {
  in_transit: "bg-amber-100 text-amber-800 ring-amber-200",
  delivered: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  returned: "bg-rose-100 text-rose-800 ring-rose-200",
};

export default async function TrackingDashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const adminEmail = (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase();
  const isAdmin = !!user.email && user.email.trim().toLowerCase() === adminEmail;
  if (!isAdmin) redirect("/dashboard");

  const providers = [
    { name: "Yalidine", note: "X-API-ID + X-API-TOKEN", connected: !!(process.env.YALIDINE_API_ID && process.env.YALIDINE_API_TOKEN), color: "emerald" },
    { name: "ZR Express", note: "يتطلب إعداد بيانات API من الخادم", connected: !!process.env.ZR_EXPRESS_API_KEY, color: "blue" },
    { name: "Maystro", note: "يتطلب إعداد بيانات API من الخادم", connected: !!process.env.MAYSTRO_API_TOKEN, color: "violet" },
  ];

  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <Link href="/dashboard" className="text-sm font-bold text-emerald-700 hover:underline dark:text-emerald-400">← الرجوع إلى لوحة التحكم</Link>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black">🚚 تتبع طلبات شركة التوصيل</h1>
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800">إدارة فقط</span>
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">متابعة الشحنات وحالة الربط مع شركات التوصيل من مكان واحد.</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">واجهة الإدارة · صلاحية المدير</div>
          </div>

          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard title="طرود في الطريق" value="0" hint="تُعرض بعد ربط قاعدة بيانات الشحنات" tone="amber" />
            <StatCard title="تم التوصيل" value="0" hint="إجمالي الشحنات المسلّمة" tone="emerald" />
            <StatCard title="نسبة التسليم" value="—" hint="تُحسب من بيانات الشحنات الفعلية" tone="green" />
          </section>

          <section className="mt-8">
            <SectionTitle title="حالة الربط مع شركات التوصيل" subtitle="تُقرأ حالة الربط من متغيرات البيئة الآمنة على الخادم." />
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {providers.map((provider) => (
                <div key={provider.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="text-lg font-black">{provider.name}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{provider.note}</p></div>
                    <span className={provider.connected ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-300"}>{provider.connected ? "مربوطة" : "غير مربوطة"}</span>
                  </div>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={provider.connected ? "h-full w-full rounded-full bg-emerald-500" : "h-full w-1/4 rounded-full bg-slate-300"} /></div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <SectionTitle title="طلبات التوصيل" subtitle="ستظهر هنا الشحنات المحفوظة في قاعدة البيانات." />
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[850px] text-right text-sm">
                <thead><tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800"><th className="px-3 py-3 font-bold">اسم الزبون</th><th className="px-3 py-3 font-bold">المنتج</th><th className="px-3 py-3 font-bold">رقم تتبع Yalidine</th><th className="px-3 py-3 font-bold">الولاية</th><th className="px-3 py-3 font-bold">الحالة</th><th className="px-3 py-3 font-bold">الإجراءات</th></tr></thead>
                <tbody><tr><td colSpan={6} className="px-3 py-12 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl">📦</span><p className="mt-3 font-extrabold">لا توجد شحنات لعرضها بعد</p><p className="mt-1 text-xs text-slate-500">يلزم تجهيز تخزين الشحنات وربط واجهة API قبل عرض بيانات حقيقية.</p></td></tr></tbody>
              </table>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <SectionTitle title="إضافة طلب يدوي" subtitle="نموذج واجهة أولي؛ الحفظ يحتاج تفعيل جدول الشحنات." />
              <form className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="اسم الزبون" name="customerName" placeholder="الاسم الكامل" />
                <Field label="رقم الهاتف" name="phone" placeholder="05 / 06 / 07" />
                <Field label="المنتج" name="product" placeholder="اسم المنتج" />
                <Field label="الولاية" name="wilaya" placeholder="مثال: قسنطينة" />
                <Field label="رقم التتبع" name="trackingNumber" placeholder="رقم تتبع شركة التوصيل" />
                <div><label className="mb-2 block text-sm font-bold" htmlFor="shipment-status">الحالة</label><select id="shipment-status" name="status" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"><option value="in_transit">في الطريق</option><option value="delivered">تم التسليم</option><option value="returned">مرتجع</option></select></div>
                <p className="sm:col-span-2 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800 dark:bg-amber-950 dark:text-amber-200">هذا النموذج لا يحفظ بيانات حتى يتم إنشاء جدول الشحنات وسياسة صلاحياته في Supabase.</p>
                <button type="button" disabled className="cursor-not-allowed rounded-xl bg-emerald-600 px-5 py-3 font-extrabold text-white opacity-50 sm:col-span-2">حفظ الطلب (بانتظار ربط قاعدة البيانات)</button>
              </form>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <SectionTitle title="إعدادات الربط و API" subtitle="لا تضع المفاتيح في كود الواجهة أو GitHub." />
              <div className="mt-5 space-y-4">
                <EnvStatus label="YALIDINE_API_ID" configured={!!process.env.YALIDINE_API_ID} />
                <EnvStatus label="YALIDINE_API_TOKEN" configured={!!process.env.YALIDINE_API_TOKEN} />
                <EnvStatus label="YALIDINE_WEBHOOK_SECRET" configured={!!process.env.YALIDINE_WEBHOOK_SECRET} />
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                  <strong>مهم:</strong> ضع القيم في Environment Variables داخل Vercel، ثم أعد النشر. لا يمكن إظهار أو قراءة قيمة المفتاح من هذه الصفحة.
                </div>
                <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">ملاحظة تقنية: وثائق Yalidine المتاحة علنًا توضح التحقق الدوري من سجل الحالات؛ لا تؤكد توفر webhook عام لكل الحسابات. لا يُفعّل استقبال webhook إلا بعد تأكيد رابط الحدث وطريقة التوقيع من حساب التاجر.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function StatCard({ title, value, hint, tone }: { title: string; value: string; hint: string; tone: "amber" | "emerald" | "green" }) {
  const tones = { amber: "border-amber-200 bg-amber-50 text-amber-800", emerald: "border-emerald-200 bg-emerald-50 text-emerald-800", green: "border-green-200 bg-green-50 text-green-800" };
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-bold text-slate-500 dark:text-slate-400">{title}</p><div className="mt-3 flex items-end justify-between gap-3"><span className="text-3xl font-black">{value}</span><span className={`rounded-lg border px-2 py-1 text-xs font-bold ${tones[tone]}`}>إحصائيات</span></div><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p></div>;
}
function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p></div>; }
function Field({ label, name, placeholder }: { label: string; name: string; placeholder: string }) { return <div><label className="mb-2 block text-sm font-bold" htmlFor={name}>{label}</label><input id={name} name={name} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950" /></div>; }
function EnvStatus({ label, configured }: { label: string; configured: boolean }) { return <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800"><code className="text-xs font-bold">{label}</code><span className={configured ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"}>{configured ? "مُعدّ" : "غير مُعدّ"}</span></div>; }
