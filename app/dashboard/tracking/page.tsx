"use server";

import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

export default async function TrackingDashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const adminEmail = (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase();
  const isAdmin = !!user.email && user.email.trim().toLowerCase() === adminEmail;
  if (!isAdmin) redirect("/dashboard");

  const ecotrackConfigured = Boolean(process.env.ECOTRACK_API_TOKEN);
  const whatsappConfigured = Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  );

  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm font-bold text-emerald-700 hover:underline dark:text-emerald-400">← الرجوع إلى لوحة التحكم</Link>
          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black">🚚 تتبع طلبات شركة التوصيل</h1>
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800">للأدمن فقط</span>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                لوحة خاصة لمزامنة الشحنات الموجودة في حساب Ecotrack، ومتابعة حالتها ورسائل واتساب من مكان واحد.
              </p>
            </div>
            <span className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-900">واجهة أولية — لم يتم الاتصال بالخدمات بعد</span>
          </div>

          <section className="mt-7 grid gap-4 sm:grid-cols-2">
            <IntegrationCard
              title="Ecotrack API"
              description="مصدر الشحنات وحالات التوصيل"
              configured={ecotrackConfigured}
              configuredLabel="تم العثور على متغير إعداد"
              missingLabel="بانتظار إعداد ECOTRACK_API_TOKEN"
            />
            <IntegrationCard
              title="WhatsApp Business Platform"
              description="إرسال تحديثات حالة الطلب للزبائن"
              configured={whatsappConfigured}
              configuredLabel="تم العثور على متغيرات إعداد"
              missingLabel="بانتظار إعداد WHATSAPP_ACCESS_TOKEN و WHATSAPP_PHONE_NUMBER_ID"
            />
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="إجمالي الشحنات" value="—" note="تظهر بعد تنفيذ مزامنة Ecotrack" />
            <StatCard title="في الطريق" value="—" note="حسب الحالات التي ترجعها الشركة" />
            <StatCard title="تم التسليم" value="—" note="حسب الحالات التي ترجعها الشركة" />
            <StatCard title="رسائل واتساب" value="—" note="بعد ربط مزود الرسائل" />
          </section>

          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black">الشحنات من Ecotrack</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ستظهر الشحنات الموجودة في حسابك حتى لو أُنشئت من منصة أخرى.</p>
              </div>
              <span className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">المزامنة غير مفعّلة</span>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="px-3 py-3 font-bold">رقم التتبع</th>
                    <th className="px-3 py-3 font-bold">الزبون</th>
                    <th className="px-3 py-3 font-bold">الولاية</th>
                    <th className="px-3 py-3 font-bold">حالة الشحنة</th>
                    <th className="px-3 py-3 font-bold">آخر تحديث</th>
                    <th className="px-3 py-3 font-bold">رسالة واتساب</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan={6} className="px-3 py-12 text-center">
                    <div className="text-3xl">📦</div>
                    <p className="mt-3 font-extrabold">ما كاين حتى بيانات متصلة حتى الآن</p>
                    <p className="mt-1 text-xs leading-6 text-slate-500">هذه الصفحة لا تجلب بيانات وهمية. يلزم توصيل API الفعلي وتحديد طريقة استقبال تحديثات Ecotrack قبل عرض الشحنات.</p>
                  </td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-7 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <h2 className="text-xl font-black">رسائل واتساب للزبائن</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">إعداد قوالب الرسائل التي تتوافق مع تغيّر حالة الشحنة.</p>
              <div className="mt-5 space-y-3">
                <MessageRow title="استلام الطلب" detail="إعلام الزبون بأن الطلب دخل مرحلة المعالجة" />
                <MessageRow title="تأكيد الطلب" detail="تأكيد الطلب أو تسجيل رد الزبون" />
                <MessageRow title="الطلب في الطريق" detail="إرسال تحديث عند انتقال الشحنة للتوصيل" />
                <MessageRow title="وصل إلى المكتب" detail="إرسال موقع المكتب إذا وفرته شركة التوصيل" />
                <MessageRow title="عامل التوصيل" detail="إرسال رقم العامل إذا كان متاحاً في بيانات الشحنة" />
              </div>
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                الإرسال التلقائي غير مفعّل بعد. يلزم ربط WhatsApp Business API، إعداد القوالب المعتمدة، وتحديد حالات Ecotrack التي تطلق كل رسالة.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <h2 className="text-xl font-black">ما يلزم لإكمال الربط</h2>
              <ol className="mt-5 list-decimal space-y-3 pr-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                <li>تأكيد مسار Ecotrack API الذي يعيد جميع الشحنات، وطريقة ترقيم الصفحات والمصادقة.</li>
                <li>تحديد إن كان Ecotrack يوفّر Webhook لتغيّر الحالة، أو نحتاج مزامنة دورية.</li>
                <li>تحديد مزود واتساب وبيانات القوالب المعتمدة.</li>
                <li>تخزين حالة آخر رسالة لكل شحنة لتجنّب إرسال الرسالة نفسها عدة مرات.</li>
                <li>حفظ مفاتيح API في إعدادات الخادم فقط، وعدم وضعها في المتصفح أو المستودع.</li>
              </ol>
              <div className="mt-5 rounded-xl border border-slate-200 p-4 text-sm leading-6 dark:border-slate-700">
                <p className="font-extrabold">ملاحظة أمنية</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">لا تُدخل مفاتيح API في هذه الصفحة. تُضاف لاحقاً كمتغيرات بيئة في استضافة المشروع بعد تأكيد أسماء المتغيرات وطريقة الربط.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

function IntegrationCard({ title, description, configured, configuredLabel, missingLabel }: {
  title: string; description: string; configured: boolean; configuredLabel: string; missingLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="text-lg font-black">{title}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p></div>
        <span className={configured ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800" : "rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800"}>{configured ? "إعداد موجود" : "بانتظار الإعداد"}</span>
      </div>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{configured ? configuredLabel : missingLabel}</p>
    </div>
  );
}

function StatCard({ title, value, note }: { title: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><p className="text-sm font-bold text-slate-500 dark:text-slate-400">{title}</p><p className="mt-3 text-3xl font-black">{value}</p><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{note}</p></div>;
}

function MessageRow({ title, detail }: { title: string; detail: string }) {
  return <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"><span className="mt-0.5 text-lg">💬</span><div><p className="font-extrabold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p></div><span className="mr-auto rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800">غير مفعّل</span></div>;
}
