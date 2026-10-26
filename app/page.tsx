import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const templates = [
  { name: "متجر إلكتروني", icon: "🛍️", tone: "from-blue-600 to-indigo-700", desc: "اعرض منتجاتك وأسعارك واستقبل الطلبات" },
  { name: "الجمال والعناية", icon: "✦", tone: "from-pink-500 to-rose-600", desc: "تصميم ناعم للصالونات وخبراء التجميل" },
  { name: "العقارات", icon: "⌂", tone: "from-emerald-500 to-teal-700", desc: "اعرض العقارات والصور وطرق التواصل" },
  { name: "المطاعم", icon: "✺", tone: "from-orange-500 to-red-600", desc: "قائمة طعام جذابة وسهلة التصفح" },
  { name: "الأعمال والخدمات", icon: "⚡", tone: "from-violet-600 to-blue-700", desc: "عرّف بخدماتك واجمع وسائل الاتصال" },
  { name: "المنتجات الرقمية", icon: "◇", tone: "from-cyan-500 to-blue-700", desc: "صفحات بيع عصرية لمنتجاتك الرقمية" },
];

const features = [
  { icon: "🎨", title: "تخصيص سهل", desc: "غيّر النصوص والألوان والصور بما يناسب علامتك التجارية." },
  { icon: "📱", title: "جاهزة للهاتف", desc: "تصميم متجاوب يجعل صفحتك واضحة على الهاتف والكمبيوتر." },
  { icon: "✨", title: "حركات عصرية", desc: "تأثيرات لطيفة عند التمرير ولمسات بصرية تلفت الانتباه." },
  { icon: "🔗", title: "رابط خاص", desc: "شارك صفحتك برابط واحد في الإعلانات ووسائل التواصل." },
  { icon: "🧩", title: "قوالب متنوعة", desc: "ابدأ من قالب جاهز بدل بناء الصفحة من الصفر." },
  { icon: "🚀", title: "انشر بسرعة", desc: "رتّب محتواك ثم انشر صفحة جاهزة للعرض والمشاركة." },
];

const steps = [
  { n: "01", title: "أنشئ حسابك", desc: "سجّل الدخول إلى منصتك وابدأ مشروعك." },
  { n: "02", title: "اختر قالبًا", desc: "حدد التصميم الأقرب لنشاطك التجاري." },
  { n: "03", title: "خصّص صفحتك", desc: "أضف الصور والعناوين والألوان وروابط التواصل." },
  { n: "04", title: "انشر وشارك", desc: "جهّز صفحتك ثم شارك رابطها مع عملائك." },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="lp-home overflow-hidden" dir="rtl">
        <section className="lp-hero relative isolate overflow-hidden text-white">
          <div className="lp-orb lp-orb-one" /><div className="lp-orb lp-orb-two" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
            <div className="lp-reveal relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-white/10 px-4 py-2 text-sm text-cyan-100 backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /> منصة صفحات هبوط احترافية
              </div>
              <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                حوّل فكرتك إلى صفحة
                <span className="lp-gradient-text block">تجذب الانتباه وتبيع</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-9 text-slate-200">
                أنشئ صفحات هبوط عصرية من قوالب جاهزة، وخصّص النصوص والصور والألوان بسهولة — بدون الحاجة إلى البرمجة.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup" className="lp-primary-btn">ابدأ مجانًا <span>←</span></Link>
                <a href="#templates" className="lp-secondary-btn">استكشف القوالب <span>⌄</span></a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                <span>✓ قوالب قابلة للتخصيص</span><span>✓ تصميم متجاوب</span><span>✓ واجهة عربية</span>
              </div>
            </div>
            <div className="lp-reveal lp-reveal-delay relative mx-auto w-full max-w-xl">
              <div className="lp-showcase">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-400"/><i className="h-2.5 w-2.5 rounded-full bg-amber-300"/><i className="h-2.5 w-2.5 rounded-full bg-emerald-400"/></div>
                  <span className="text-xs text-slate-300">معاينة الصفحة · مباشر</span><span className="rounded-lg bg-blue-500/20 px-3 py-1 text-xs text-cyan-200">محرر القوالب</span>
                </div>
                <div className="grid min-h-72 grid-cols-[1fr_118px] gap-4 p-4 sm:grid-cols-[1fr_145px] sm:p-6">
                  <div className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
                    <div className="bg-gradient-to-br from-sky-100 via-white to-violet-100 p-4 sm:p-6">
                      <div className="flex items-center justify-between text-xs font-bold"><span className="text-blue-700">NOVA STORE</span><span>☰</span></div>
                      <div className="mt-8 text-right"><span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] text-blue-700">وصل حديثًا</span><h3 className="mt-3 text-xl font-black sm:text-2xl">منتجك يستحق<br/>واجهة مميزة</h3><p className="mt-2 text-xs leading-5 text-slate-500">اعرض أفضل ما لديك بتصميم جذاب.</p><span className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white">تسوّق الآن ←</span></div>
                      <div className="mt-5 flex items-end justify-center gap-2"><div className="h-20 w-16 rounded-t-2xl bg-gradient-to-b from-violet-300 to-blue-500 shadow-lg"/><div className="h-28 w-20 rounded-t-3xl bg-gradient-to-b from-sky-200 to-indigo-500 shadow-lg"/><div className="h-16 w-14 rounded-t-2xl bg-gradient-to-b from-pink-200 to-rose-400 shadow-lg"/></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 p-3 text-center text-[9px] font-bold"><span>✦ جودة عالية</span><span>↗ توصيل سريع</span><span>♡ دعم مميز</span></div>
                  </div>
                  <div className="space-y-3 rounded-xl border border-white/10 bg-slate-950/70 p-3">
                    <p className="text-xs font-bold text-white">تخصيص التصميم</p>
                    <span className="block text-[10px] text-slate-400">الألوان</span><div className="flex gap-1.5"><i className="h-5 w-5 rounded-full bg-blue-500 ring-2 ring-white"/><i className="h-5 w-5 rounded-full bg-violet-500"/><i className="h-5 w-5 rounded-full bg-emerald-400"/></div>
                    <span className="block pt-2 text-[10px] text-slate-400">الأقسام</span>{["العنوان","الصورة","المميزات","الأسعار","التواصل"].map((x)=><div key={x} className="rounded-lg bg-white/5 px-2 py-2 text-[10px] text-slate-200">☷ {x}</div>)}
                    <div className="rounded-lg bg-gradient-to-l from-blue-600 to-violet-600 py-2 text-center text-[10px] font-bold">حفظ التعديلات</div>
                  </div>
                </div>
              </div>
              <div className="lp-float-card absolute -bottom-5 -left-2 rounded-2xl border border-white/15 bg-slate-900/90 p-3 shadow-xl sm:-left-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/15 text-xl">✦</span><div><p className="text-sm font-bold">تصميم احترافي</p><p className="text-xs text-slate-400">تفاصيل قابلة للتعديل</p></div></div></div>
            </div>
          </div>
          <div className="lp-marquee-wrap border-t border-white/10 py-4"><div className="lp-marquee"><span>قوالب عصرية ✦ تخصيص سهل ✦ صفحات سريعة ✦ تصميم عربي ✦ روابط خاصة ✦ قوالب عصرية ✦ تخصيص سهل ✦ صفحات سريعة ✦ تصميم عربي ✦ روابط خاصة ✦</span></div></div>
        </section>

        <section id="templates" className="lp-section mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="lp-reveal mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><span className="lp-eyebrow">ابدأ من قالب جاهز</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">قالب مناسب لكل فكرة</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">اختَر نقطة البداية، ثم خصّص صفحتك لتناسب مشروعك وهويتك.</p></div>
            <Link href="/signup" className="lp-text-link">ابدأ إنشاء صفحتك <span>←</span></Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t, i)=><article key={t.name} className="lp-template lp-reveal" style={{animationDelay: (i*80)+"ms"}}>
              <div className={"lp-template-art bg-gradient-to-br "+t.tone}><span className="lp-template-symbol">{t.icon}</span><div className="lp-template-mini"><span/><span/><span/></div><div className="lp-template-lines"><i/><i/><i/></div><span className="lp-template-label">قالب قابل للتخصيص</span></div>
              <div className="p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-extrabold text-slate-900">{t.name}</h3><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">قالب جاهز</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{t.desc}</p><Link href="/signup" className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-blue-700">خصّص هذا القالب <span>←</span></Link></div>
            </article>)}
          </div>
        </section>

        <section id="features" className="lp-feature-section px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="lp-reveal mx-auto max-w-2xl text-center"><span className="lp-eyebrow">كل الأدوات في مكان واحد</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">كل ما تحتاجه لبناء صفحة مميزة</h2><p className="mt-4 leading-8 text-slate-600">تجربة واضحة تساعدك على تحويل فكرتك إلى صفحة مرتبة، من أول عنوان إلى زر التواصل.</p></div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map((f,i)=><div key={f.title} className="lp-feature-card lp-reveal" style={{animationDelay:(i*70)+"ms"}}><span className="lp-feature-icon">{f.icon}</span><h3 className="mt-5 text-lg font-extrabold text-slate-900">{f.title}</h3><p className="mt-2 leading-7 text-slate-600">{f.desc}</p></div>)}</div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="lp-reveal text-center"><span className="lp-eyebrow">رحلتك تبدأ هنا</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">من الفكرة إلى النشر في خطوات</h2><p className="mt-3 text-slate-600">خطوات بسيطة، وواجهة مصممة لتسهّل عليك البداية.</p></div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{steps.map((s,i)=><div key={s.n} className="lp-step lp-reveal" style={{animationDelay:(i*100)+"ms"}}><span className="lp-step-number">{s.n}</span><div className="mt-5 text-2xl">{["♙","▦","✎","↗"][i]}</div><h3 className="mt-3 text-lg font-extrabold">{s.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{s.desc}</p></div>)}</div>
        </section>

        <section id="pricing" className="px-5 pb-20 sm:px-8">
          <div className="lp-cta mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-12 text-center text-white sm:px-12 sm:py-16"><span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">جاهز للانطلاق؟</span><h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">ابدأ ببناء صفحتك التالية اليوم</h2><p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-200">أنشئ حسابك، اختر القالب الذي يناسبك، وابدأ بتجهيز صفحتك لمشروعك.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/signup" className="lp-primary-btn">إنشاء حساب <span>←</span></Link><Link href="/login" className="lp-secondary-btn">لدي حساب بالفعل</Link></div><p className="mt-5 text-xs text-slate-300">ملاحظة: الأسعار والدفع والميزات المتقدمة تُفعّل بعد تجهيزها رسميًا.</p></div>
        </section>
      </main>
      <Footer />
    </>
  );
}
