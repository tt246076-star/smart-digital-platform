import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import EcotrackSettingsForm from "@/components/EcotrackSettingsForm";
import OrdersView from "@/components/OrdersView";
import { createClient } from "@/lib/supabase/server";

export default async function TrackingDashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  if (user.email?.trim().toLowerCase() !== "tt246076@gmail.com") {
    redirect("/dashboard");
  }

  const ecotrackConfigured = Boolean(process.env.ECOTRACK_API_TOKEN);
  const yalidineWebhookConfigured = Boolean(process.env.YALIDINE_WEBHOOK_SECRET);
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

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black">🚚 تتبع طلبات شركة التوصيل</h1>
              <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800">وصول خاص</span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              تعرض الصفحة أحداث الشحنات التي تصل إلى Webhook الخاص ببطاقتي، وتقرأها من قاعدة بياناتك.
            </p>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black">رابط استقبال تحديثات Yalidine</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              سجّل هذا الرابط في صفحة Webhooks لدى شركة التوصيل، واختر أحداث تغيّر حالة الطرد.
            </p>
            <code dir="ltr" className="mt-4 block overflow-x-auto rounded-xl bg-slate-100 p-4 text-left text-sm font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
              https://bitaqati.online/api/webhook/yalidine
            </code>
            <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
              لا تضع مفتاح التوقيع في الرابط. ضعه في متغير البيئة YALIDINE_WEBHOOK_SECRET على Vercel، واستعمل المفتاح نفسه عند إعداد Webhook لدى Yalidine.
            </p>
          </section>

          <section className="mt-7">
            <EcotrackSettingsForm />
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <IntegrationCard
              title="Ecotrack / DHD"
              description="إعداد حساب شركة التوصيل الحالي"
              configured={ecotrackConfigured}
              configuredLabel="يوجد متغير إعداد على الخادم"
              missingLabel="إعداد الحساب محفوظ من نموذج الربط أو يحتاج مراجعة"
            />
            <IntegrationCard
              title="Yalidine Webhook"
              description="التحقق من توقيع الأحداث الواردة"
              configured={yalidineWebhookConfigured}
              configuredLabel="Webhook secret موجود على الخادم"
              missingLabel="أضف YALIDINE_WEBHOOK_SECRET في Vercel"
            />
            <IntegrationCard
              title="WhatsApp Business Platform"
              description="إرسال تحديثات حالة الطلب للزبائن"
              configured={whatsappConfigured}
              configuredLabel="متغيرات إعداد واتساب موجودة"
              missingLabel="ربط واتساب غير مكتمل"
            />
          </section>

          <section className="mt-7">
            <OrdersView />
          </section>

          <section className="mt-7 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <h2 className="text-xl font-black">رسائل واتساب للزبائن</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">هذه المرحلة تعرض حالة الشحنة فقط؛ الإرسال التلقائي يحتاج إعداد WhatsApp Business API والقوالب المناسبة.</p>
              <div className="mt-5 space-y-3">
                <MessageRow title="الطرد في الطريق" detail="إعلام الزبون عند انتقال الشحنة إلى مرحلة النقل" />
                <MessageRow title="وصل إلى المركز" detail="إرسال اسم المكتب وعنوانه إذا كانت هذه المعلومات متاحة" />
                <MessageRow title="خرج للتوصيل" detail="تنبيه الزبون بأن الموزّع سيحاول تسليم الطرد" />
                <MessageRow title="محاولة توصيل فاشلة" detail="إظهار سبب الفشل مثل تعذّر الاتصال بالزبون" />
                <MessageRow title="تم التسليم أو الإرجاع" detail="تسجيل الحالة النهائية للشحنة" />
              </div>
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                لا يتم إرسال أي رسالة واتساب من هذا الكود حاليًا؛ لا نفعّل الإرسال قبل ضبط موافقة الزبون وقوالب WhatsApp المعتمدة.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <h2 className="text-xl font-black">ملاحظات التشغيل</h2>
              <ol className="mt-5 list-decimal space-y-3 pr-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                <li>أضف YALIDINE_WEBHOOK_SECRET في متغيرات Vercel من دون مشاركته في المحادثة أو وضعه داخل المستودع.</li>
                <li>تأكد من أن حساب Yalidine يتيح Webhooks، ثم سجّل الرابط أعلاه واختر أحداث الطرود.</li>
                <li>الـ Webhook يسجّل التحديثات الجديدة فقط؛ الطرود القديمة تحتاج استيرادًا أوليًا من API الطرود.</li>
                <li>حقول الزبون والهاتف والمنتج والمكتب لا تأتي كلها في حدث الحالة دائمًا، وتحتاج مزامنة API مستقلة.</li>
              </ol>
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
        <div>
          <h2 className="text-lg font-black">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <span className={configured
          ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800"
          : "rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800"}>
          {configured ? "الإعداد موجود" : "بانتظار الإعداد"}
        </span>
      </div>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{configured ? configuredLabel : missingLabel}</p>
    </div>
  );
}

function MessageRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <span className="mt-0.5 text-lg">💬</span>
      <div>
        <p className="font-extrabold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
      <span className="mr-auto rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800">غير مفعّل</span>
    </div>
  );
}
