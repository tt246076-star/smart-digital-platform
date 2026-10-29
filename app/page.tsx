import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PackageOrderForm from "@/components/PackageOrderForm";
import { SITE } from "@/lib/site";
import StoreProductOrderForm from "@/components/StoreProductOrderForm";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const benefits = [
  { icon: "▣", title: "بطاقة واحدة لكل شيء", desc: "اجمع روابطك ومعلوماتك وطرق التواصل في بطاقة ذكية واحدة." },
  { icon: "↻", title: "تحديث فوري", desc: "حدّث بيانات بروفايلك الرقمي وقت ما تحتاج، بلا إعادة طباعة البطاقة." },
  { icon: "⌁", title: "QR و NFC", desc: "شارك بروفايلك بالمسح أو بلمسة هاتف متوافق مع NFC." },
  { icon: "✳", title: "تصميم حسب نشاطك", desc: "واجهة رقمية منظمة تعكس هوية نشاطك وتعرض المعلومات المهمة." },
  { icon: "⚡", title: "سهل وسريع", desc: "الزبون يوصل للمعلومات من المتصفح، بلا ما يثبت تطبيق." },
  { icon: "▤", title: "مناسب لمختلف الأنشطة", desc: "للمحلات والمكاتب والمطاعم والمهنيين وأصحاب الخدمات." },
];
const steps = [
  { n: "01", title: "اطلب البطاقة", desc: "اختار البطاقة أو العرض اللي يناسب احتياجك وابعث الطلب." },
  { n: "02", title: "استلم شحنتك", desc: "نعاودوا نتواصلوا معك لتأكيد معلومات الطلب والتوصيل." },
  { n: "03", title: "فعّل بروفايلك", desc: "أنشئ حسابك وأضف معلوماتك وروابطك وصورتك." },
  { n: "04", title: "جرّب QR أو NFC", desc: "افتح البروفايل من رمز QR أو بلمسة NFC على هاتف متوافق." },
  { n: "05", title: "شارك وابدأ", desc: "خلي عملاءك يوصلوا لمعلوماتك ويتواصلوا معك بسهولة." },
];
const faqs = [
  { q: "هل يحتاج الزبون إلى تطبيق؟", a: "لا، البروفايل يفتح مباشرة في متصفح الهاتف أو الكمبيوتر." },
  { q: "كيف تتم مشاركة البطاقة؟", a: "باستعمال رمز QR أو NFC على هاتف يدعم NFC، كما يمكنك مشاركة رابط البروفايل." },
  { q: "هل أقدر نحدّث معلوماتي؟", a: "تقدر تدير التعديلات المتاحة في بروفايلك من حسابك، والبطاقة تبقى مرتبطة بنفس الرابط." },
  { q: "هل تعمل مع جميع الهواتف؟", a: "رابط البروفايل يفتح من المتصفح. استعمال NFC يتطلب هاتفًا يدعم التقنية؛ ويمكن استخدام QR كبديل." },
];

export default async function Home() {
  let managedProducts: { id: string; name: string; description: string; price: number; image_url: string }[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    const admin = createSupabaseClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data } = await admin.from("storefront_products").select("id,name,description,price,image_url").eq("is_active", true).order("sort_order").order("created_at", { ascending: false });
    managedProducts = (data || []) as typeof managedProducts;
  }
  return (
    <>
      <Header />
      <main className="lp-home overflow-hidden" dir="rtl">
        <section className="lp-hero relative isolate overflow-hidden text-white">
          <div className="lp-orb lp-orb-one" /><div className="lp-orb lp-orb-two" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 md:grid-cols-2 md:py-24">
            <div className="relative z-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200/30 bg-white/10 px-4 py-2 text-sm text-emerald-100 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-300" /> بطاقة ذكية بتقنية NFC و QR
              </div>
              <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                بطاقة واحدة...
                <span className="lp-gradient-text block">سكان واحد...</span>
                <span className="block">عالم كامل من روابطك</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-9 text-emerald-50/90">
                مع {SITE.name}، شارك معلوماتك وروابطك وخدماتك بلمسة أو بمسح QR. بروفايلك الرقمي يفتح مباشرة في المتصفح، وتقدر تحدّث معلوماتك من حسابك.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#pricing" className="lp-primary-btn">اختار بطاقتك <span>←</span></a>
                <a href="#how" className="lp-secondary-btn">كيفاش تخدم؟ <span>⌄</span></a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-emerald-50/90">
                <span>✓ بلا تطبيق إضافي</span><span>✓ QR و NFC</span><span>✓ تحديث معلوماتك</span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-lg">
              <div className="rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
                <div className="rounded-[1.5rem] bg-white p-5 text-slate-900 shadow-xl sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">بروفايلك الرقمي</span>
                    <span className="text-xs font-bold text-slate-400">{SITE.name}</span>
                  </div>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-800 text-3xl font-black text-white">م</div>
                    <div><h2 className="text-xl font-black">اسم نشاطك</h2><p className="mt-1 text-sm text-slate-500">كل معلوماتك في صفحة واحدة</p></div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><span className="text-2xl text-emerald-700">⌁</span><p className="mt-2 font-extrabold">NFC</p><p className="mt-1 text-xs text-slate-500">لمسة واحدة</p></div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><span className="text-2xl text-emerald-700">▦</span><p className="mt-2 font-extrabold">QR Code</p><p className="mt-1 text-xs text-slate-500">امسح وافتح</p></div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-green-100 text-green-700">↗</span><span className="text-sm font-bold">روابط التواصل والخدمات</span><span className="mr-auto text-slate-400">←</span></div>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">⌖</span><span className="text-sm font-bold">معلومات النشاط والموقع</span><span className="mr-auto text-slate-400">←</span></div>
                  </div>
                </div>
                <p className="px-2 pt-4 text-center text-xs text-emerald-50/80">معاينة توضيحية للبروفايل الرقمي</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 py-4 text-center text-sm font-bold text-emerald-100/90">NFC ✦ QR Code ✦ بروفايل رقمي ✦ روابطك وخدماتك ✦ تواصل أسهل</div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-3xl text-center"><span className="lp-eyebrow">بلا تطبيق</span><h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-4xl">هل يحتاج الزبون تطبيق؟ لا.</h2><p className="mt-4 leading-8 text-slate-600">يمسح رمز QR أو يستعمل NFC على هاتف متوافق، وتفتح صفحة معلوماتك مباشرة في المتصفح. تقدر كذلك تبعث رابط البروفايل في الرسائل وشبكات التواصل.</p></div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2"><article className="lp-feature-card text-center"><span className="lp-feature-icon mx-auto">▦</span><h3 className="mt-4 text-xl font-black">يمسح رمز QR</h3><p className="mt-2 leading-7 text-slate-600">حل بسيط للهواتف اللي فيها كاميرا، بدون تثبيت تطبيق خاص.</p></article><article className="lp-feature-card text-center"><span className="lp-feature-icon mx-auto">⌁</span><h3 className="mt-4 text-xl font-black">لمسة NFC</h3><p className="mt-2 leading-7 text-slate-600">قرّب البطاقة من هاتف يدعم NFC لفتح الرابط بسرعة.</p></article></div>
        </section>

        <section id="features" className="lp-feature-section px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl"><div className="mx-auto max-w-2xl text-center"><span className="lp-eyebrow">لماذا {SITE.name}؟</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">بطاقتك تخدم أكثر من مجرد مشاركة رقم</h2><p className="mt-4 leading-8 text-slate-600">خلي معلوماتك المهنية وروابطك قريبة من الزبون في تجربة سهلة وواضحة.</p></div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{benefits.map((f,i)=><article key={f.title} className="lp-feature-card"><span className="lp-feature-icon">{f.icon}</span><h3 className="mt-5 text-lg font-extrabold text-slate-900">{f.title}</h3><p className="mt-2 leading-7 text-slate-600">{f.desc}</p></article>)}</div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="text-center"><span className="lp-eyebrow">طريقة العمل</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">خمسة خطوات بسيطة للحصول على بطاقتك</h2><p className="mt-4 leading-7 text-slate-600">من اختيار المنتج حتى مشاركة بروفايلك مع عملائك.</p></div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{steps.map((s,i)=><article key={s.n} className="lp-step"><span className="lp-step-number">{s.n}</span><div className="mt-5 text-2xl text-emerald-700">{["▣","⌂","✎","▦","↗"][i]}</div><h3 className="mt-3 text-lg font-extrabold text-slate-900">{s.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{s.desc}</p></article>)}</div>
        </section>

        <section id="gallery" className="lp-feature-section px-5 py-20 sm:px-8"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-2xl text-center"><span className="lp-eyebrow">بروفايلك العام</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">كل بطاقة تعرض هوية نشاطك</h2><p className="mt-4 leading-8 text-slate-600">رتّب تعريفك وروابطك وخدماتك في صفحة واحدة، وشاركها برابط مباشر أو عن طريق البطاقة الذكية.</p></div>
          <div className="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-900/5 sm:p-8"><div className="rounded-[1.5rem] bg-gradient-to-br from-emerald-950 via-green-900 to-emerald-700 p-7 text-white sm:p-10"><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-white/20 bg-white/10 text-3xl font-black">م</div><p className="mt-4 text-center text-xs font-bold text-emerald-200">بروفايل تجريبي</p><h3 className="mt-2 text-center text-2xl font-black">اسم نشاطك</h3><p className="mx-auto mt-3 max-w-md text-center text-sm leading-7 text-emerald-50/80">نبذة قصيرة عنك وعن الخدمات التي تقدمها.</p><div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3"><div className="rounded-xl bg-emerald-500 px-4 py-3 text-center text-sm font-black">واتساب</div><div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-sm font-black">اتصال</div></div></div><p className="mt-4 text-center text-xs text-slate-500">معاينة توضيحية — المحتوى النهائي يعتمد على إعدادات حسابك.</p></div>
        </div></section>

        <section id="pricing" className="lp-products-section px-5 py-20 sm:px-8"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-3xl text-center"><span className="lp-eyebrow">اختار البطاقة المناسبة لك</span><h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">منتجات وعروض {SITE.name}</h2><p className="mt-4 leading-8 text-slate-600">اختار المنتج، عمّر معلومات الطلب ونعاودوا نتواصلوا معك لتأكيد التفاصيل والتوصيل.</p></div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{managedProducts.length > 0 ? managedProducts.map(product => <StoreProductOrderForm key={product.id} product={product} />) : <><PackageOrderForm packageId="desk-card" /><PackageOrderForm packageId="door-card" /><PackageOrderForm packageId="smart-display" /><PackageOrderForm packageId="three-card-bundle" /></>}</div><p className="mt-5 text-center text-xs leading-6 text-slate-500">السعر النهائي والتوصيل يتم تأكيدهما هاتفيًا قبل إتمام الطلب.</p>
        </div></section>

        <section id="faq" className="px-5 py-20 sm:px-8"><div className="mx-auto max-w-4xl"><div className="text-center"><span className="lp-eyebrow">أسئلة شائعة</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">حاب تعرف أكثر؟</h2></div><div className="mt-9 space-y-3">{faqs.map(f=><details key={f.q} className="group rounded-2xl border border-slate-200 bg-white p-5 open:border-emerald-200 open:shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-extrabold text-slate-900"><span>{f.q}</span><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 transition group-open:rotate-45">＋</span></summary><p className="mt-3 pr-1 text-sm leading-7 text-slate-600">{f.a}</p></details>)}</div></div></section>

        <section id="cta" className="px-5 pb-20 sm:px-8"><div className="lp-cta mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-12 text-center text-white sm:px-12 sm:py-16"><span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">جاهز تبدأ؟</span><h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">خلي بطاقتك تخدم عليك</h2><p className="mx-auto mt-4 max-w-2xl leading-8 text-emerald-50/90">اختار بطاقتك الذكية وابدأ بمشاركة معلوماتك بطريقة أسهل وأكثر احترافية.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><a href="#pricing" className="lp-primary-btn">شوف المنتجات <span>←</span></a><Link href="/signup" className="lp-secondary-btn">إنشاء حساب</Link></div></div></section>
      </main>
      <Footer />
    </>
  );
}
