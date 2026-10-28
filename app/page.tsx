import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";

const templates = [
  { name: "المتاجر والمحلات", icon: "🛍️", tone: "from-blue-600 to-indigo-700", desc: "عرّف بمحلّك واعرض المنتجات والأسعار وطرق الطلب." },
  { name: "المطاعم والمقاهي", icon: "🍽️", tone: "from-orange-500 to-rose-600", desc: "قدّم قائمتك ومعلومات المكان ووسائل التواصل في صفحة واحدة." },
  { name: "الجمال والعناية", icon: "✦", tone: "from-pink-500 to-fuchsia-700", desc: "واجهة أنيقة للصالونات وخدمات الجمال والعناية." },
  { name: "الحرف والخدمات", icon: "🧰", tone: "from-emerald-500 to-teal-700", desc: "اعرض خدماتك وأعمالك وسهّل على العملاء الاتصال بك." },
  { name: "المستقلون والمهنيون", icon: "◇", tone: "from-violet-600 to-blue-700", desc: "اجمع نبذتك وروابطك وأعمالك في بطاقة رقمية واحدة." },
  { name: "المنتجات والعروض", icon: "✧", tone: "from-cyan-500 to-blue-700", desc: "شارك صور المنتجات وتفاصيلها برابط سهل الإرسال." },
];

const features = [
  { icon: "🪪", title: "بطاقة رقمية باسمك", desc: "اجمع هوية نشاطك ومعلوماتك وروابطك في صفحة واحدة يسهل مشاركتها." },
  { icon: "📸", title: "ارفع صورك مباشرة", desc: "أضف شعارك وصورة الغلاف وصور المنتجات من جهازك، من دون الحاجة إلى روابط صور." },
  { icon: "🛍️", title: "كتالوج للمنتجات", desc: "اعرض أسماء المنتجات وصورها وأسعارها وأوصافها بطريقة مرتبة." },
  { icon: "📍", title: "الموقع وأوقات العمل", desc: "أضف عنوان محلك ورابط الخريطة وأوقات استقبال الزبائن." },
  { icon: "💬", title: "تواصل بسهولة", desc: "ضع أزرار الاتصال وواتساب وحساباتك الاجتماعية في مكان واضح." },
  { icon: "📱", title: "تجربة مناسبة للهاتف", desc: "صفحتك تتكيّف مع شاشات الهواتف والكمبيوتر لتكون سهلة التصفح." },
];

const steps = [
  { n: "01", title: "أنشئ حسابك", desc: "سجّل حسابك للوصول إلى أدوات المنصة." },
  { n: "02", title: "أدخل معلومات نشاطك", desc: "أضف الاسم والشعار والصور وطرق التواصل." },
  { n: "03", title: "رتّب صفحتك", desc: "اختر القالب والألوان وأضف المنتجات ومعلومات المحل." },
  { n: "04", title: "انشر وشارك", desc: "احصل على رابط صفحتك وشاركه مع زبائنك." },
];

const faqs = [
  { q: `ما هي ${SITE.name}؟`, a: `${SITE.name} منصة تساعدك على إنشاء صفحة رقمية لنشاطك أو محلك، تجمع معلوماتك وصورك ومنتجاتك ووسائل التواصل في رابط واحد.` },
  { q: "هل أحتاج إلى خبرة في البرمجة؟", a: "لا. أضف معلومات نشاطك من النموذج، وارفع الصور، ثم احفظ صفحتك من خلال الأدوات المتاحة في حسابك." },
  { q: "هل يمكنني إضافة صور المنتجات من جهازي؟", a: "نعم، يمكنك رفع ملفات الصور من جهازك في الحقول المخصصة للشعار والغلاف وصور المنتجات." },
  { q: "هل تعمل الصفحة على الهاتف؟", a: "التصميم متجاوب مع شاشات الهاتف والكمبيوتر، حتى يستطيع الزبون الاطلاع على المعلومات بسهولة." },
  { q: "كيف أشارك صفحة المحل؟", a: "بعد إنشاء الصفحة ونشرها، يمكنك مشاركة رابطها مع الزبائن في الرسائل أو شبكات التواصل أو إضافته إلى موادك التعريفية." },
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
                <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /> {SITE.tagline}
              </div>
              <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                خلي نشاطك حاضر
                <span className="lp-gradient-text block">في العالم الرقمي</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-9 text-slate-200">
                مع {SITE.name}، أنشئ صفحة احترافية لمحلك أو خدمتك، واجمع الصور والمنتجات والعنوان وطرق التواصل في مكان واحد — بسهولة ومن دون برمجة.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup" className="lp-primary-btn">أنشئ بطاقتك <span>←</span></Link>
                <a href="#templates" className="lp-secondary-btn">اكتشف الاستخدامات <span>⌄</span></a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                <span>✓ صور من جهازك</span><span>✓ كتالوج للمنتجات</span><span>✓ رابط قابل للمشاركة</span>
              </div>
            </div>

            <div className="lp-reveal lp-reveal-delay relative mx-auto w-full max-w-xl">
              <div className="lp-showcase">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-400"/><i className="h-2.5 w-2.5 rounded-full bg-amber-300"/><i className="h-2.5 w-2.5 rounded-full bg-emerald-400"/></div>
                  <span className="text-xs text-slate-300">معاينة بطاقة محل</span><span className="rounded-lg bg-blue-500/20 px-3 py-1 text-xs text-cyan-200">{SITE.name}</span>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
                    <div className="relative bg-gradient-to-br from-sky-100 via-white to-violet-100 p-4 sm:p-6">
                      <div className="flex items-center justify-between text-xs font-bold"><span className="text-blue-700">متجر الأناقة</span><span>بطاقة المحل</span></div>
                      <div className="mt-5 flex items-center gap-3">
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-2xl text-white shadow-lg">م</div>
                        <div><h3 className="text-xl font-black">متجر الأناقة</h3><p className="mt-1 text-xs text-slate-500">ملابس وإكسسوارات</p><p className="mt-2 text-xs text-emerald-700">● مفتوح اليوم</p></div>
                      </div>
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        {["🧥","👟","👜"].map((x,i)=><div key={x} className="rounded-xl border border-slate-100 bg-white p-2 text-center"><div className="grid h-16 place-items-center rounded-lg bg-slate-50 text-3xl">{x}</div><p className="mt-2 text-[10px] font-bold">{["جاكيت","حذاء","حقيبة"][i]}</p><p className="mt-1 text-[10px] font-black text-blue-700">{["4500","3200","2800"][i]} دج</p></div>)}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-lg bg-emerald-600 py-2.5 text-center text-xs font-bold text-white">◉ واتساب</div><div className="rounded-lg bg-blue-600 py-2.5 text-center text-xs font-bold text-white">☎ اتصل بالمحل</div></div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[10px] text-slate-500"><span>📍 عنوان المحل</span><span>🕒 أوقات العمل</span><span>↗ مشاركة</span></div>
                  </div>
                </div>
              </div>
              <div className="lp-float-card absolute -bottom-5 -left-2 rounded-2xl border border-white/15 bg-slate-900/90 p-3 shadow-xl sm:-left-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/15 text-xl">✓</span><div><p className="text-sm font-bold">كل شيء في رابط واحد</p><p className="text-xs text-slate-400">واضح وسهل المشاركة</p></div></div></div>
            </div>
          </div>
          <div className="lp-marquee-wrap border-t border-white/10 py-4"><div className="lp-marquee"><span>بطاقة رقمية ✦ كتالوج منتجات ✦ معلومات المحل ✦ روابط التواصل ✦ صورك الخاصة ✦ بطاقة رقمية ✦ كتالوج منتجات ✦ معلومات المحل ✦ روابط التواصل ✦</span></div></div>
        </section>

        <section id="templates" className="lp-section mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="lp-reveal mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><span className="lp-eyebrow">مناسبة لمختلف الأنشطة</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">بطاقتك على مقاس نشاطك</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">سواء كنت تملك محلًا أو تقدّم خدمة، رتّب معلوماتك بطريقة سهلة لعملائك.</p></div>
            <Link href="/signup" className="lp-text-link">ابدأ إنشاء بطاقتك <span>←</span></Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t,i)=><article key={t.name} className="lp-template lp-reveal" style={{animationDelay:(i*80)+"ms"}}>
              <div className={"lp-template-art bg-gradient-to-br "+t.tone}><span className="lp-template-symbol">{t.icon}</span><div className="lp-template-mini"><span/><span/><span/></div><div className="lp-template-lines"><i/><i/><i/></div><span className="lp-template-label">واجهة قابلة للتخصيص</span></div>
              <div className="p-5"><h3 className="text-lg font-extrabold text-slate-900">{t.name}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{t.desc}</p><Link href="/signup" className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-blue-700">ابدأ الآن <span>←</span></Link></div>
            </article>)}
          </div>
        </section>

        <section id="features" className="lp-feature-section px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="lp-reveal mx-auto max-w-2xl text-center"><span className="lp-eyebrow">كل معلوماتك في مكان واحد</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">أدوات عملية لواجهة أكثر احترافية</h2><p className="mt-4 leading-8 text-slate-600">المنصة تسهّل عرض نشاطك وتساعد الزبائن على الوصول إلى ما يحتاجونه من دون البحث في أماكن متعددة.</p></div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map((f,i)=><div key={f.title} className="lp-feature-card lp-reveal" style={{animationDelay:(i*70)+"ms"}}><span className="lp-feature-icon">{f.icon}</span><h3 className="mt-5 text-lg font-extrabold text-slate-900">{f.title}</h3><p className="mt-2 leading-7 text-slate-600">{f.desc}</p></div>)}</div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="lp-reveal text-center"><span className="lp-eyebrow">بداية بسيطة</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">من التسجيل إلى مشاركة بطاقتك</h2><p className="mt-3 text-slate-600">أربع خطوات واضحة لتجهيز صفحة نشاطك.</p></div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{steps.map((s,i)=><div key={s.n} className="lp-step lp-reveal" style={{animationDelay:(i*100)+"ms"}}><span className="lp-step-number">{s.n}</span><div className="mt-5 text-2xl">{["♙","▦","✎","↗"][i]}</div><h3 className="mt-3 text-lg font-extrabold">{s.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{s.desc}</p></div>)}</div>
        </section>


        <section className="lp-feature-section px-5 py-20 sm:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
            <div className="lp-reveal">
              <span className="lp-eyebrow">واجهة الزبون ولوحة صاحب النشاط</span>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">من صفحة أنيقة إلى إدارة سهلة</h2>
              <p className="mt-4 leading-8 text-slate-600">الزبون يشوف معلومات النشاط ويتواصل معك بسرعة، وأنت تقدر تدير صفحاتك ومعلوماتك من حسابك حسب المزايا المتاحة في خطتك.</p>
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3"><span className="lp-feature-icon">☎</span><div><h3 className="font-extrabold text-slate-900">تواصل مباشر</h3><p className="mt-1 text-sm leading-6 text-slate-600">أزرار الاتصال وواتساب وروابط التواصل تساعد الزبون يوصل لك بسهولة.</p></div></div>
                <div className="flex items-start gap-3"><span className="lp-feature-icon">▦</span><div><h3 className="font-extrabold text-slate-900">معلومات مرتبة</h3><p className="mt-1 text-sm leading-6 text-slate-600">الصور والمنتجات والعنوان وأوقات العمل في صفحة واحدة، إذا كانت الحقول متوفرة في قالبك.</p></div></div>
                <div className="flex items-start gap-3"><span className="lp-feature-icon">⚙</span><div><h3 className="font-extrabold text-slate-900">إدارة من مكان واحد</h3><p className="mt-1 text-sm leading-6 text-slate-600">تابع صفحاتك وافتح لوحة التحكم لتعديل المعلومات المتاحة في حسابك.</p></div></div>
              </div>
              <div className="mt-7 flex flex-wrap gap-3"><Link href="/signup" className="lp-primary-btn">ابدأ الآن <span>←</span></Link><Link href="/login" className="lp-text-link">الدخول إلى حسابي</Link></div>
            </div>
            <div className="lp-reveal lp-reveal-delay">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4"><div><p className="text-xs font-bold text-blue-600">{SITE.name}</p><h3 className="mt-1 text-xl font-black text-slate-900">لوحة التحكم</h3></div><span className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">مساحة العمل</span></div>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-blue-50 p-4"><p className="text-xs text-slate-500">صفحاتك</p><p className="mt-2 text-2xl font-black text-slate-900">01</p></div>
                  <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs text-slate-500">الحالة</p><p className="mt-2 font-black text-emerald-700">إدارة سهلة</p></div>
                  <div className="col-span-2 rounded-2xl bg-violet-50 p-4 sm:col-span-1"><p className="text-xs text-slate-500">التخصيص</p><p className="mt-2 font-black text-slate-900">قوالب وألوان</p></div>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 text-xl text-white">م</span><div><p className="font-extrabold text-slate-900">متجر نموذجي</p><p className="mt-1 text-xs text-slate-500">بطاقة نشاط رقمية</p></div></div><span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">معاينة</span></div>
                  <div className="mt-4 grid grid-cols-3 gap-2"><div className="h-2 rounded-full bg-blue-100"/><div className="h-2 rounded-full bg-violet-100"/><div className="h-2 rounded-full bg-emerald-100"/></div>
                  <p className="mt-3 text-xs leading-6 text-slate-500">هذه معاينة توضيحية للواجهة وليست بيانات حساب حقيقية.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="lp-feature-section px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="lp-reveal text-center"><span className="lp-eyebrow">هل لديك سؤال؟</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">أسئلة تتكرر</h2><p className="mt-3 leading-7 text-slate-600">إجابات مختصرة تساعدك على البدء.</p></div>
            <div className="mt-9 space-y-3">{faqs.map((f)=><details key={f.q} className="group rounded-2xl border border-slate-200 bg-white p-5 open:border-blue-200 open:shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-extrabold text-slate-900"><span>{f.q}</span><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 transition group-open:rotate-45">＋</span></summary><p className="mt-3 pr-1 text-sm leading-7 text-slate-600">{f.a}</p></details>)}</div>
          </div>
        </section>

        <section id="pricing" className="px-5 py-20 sm:px-8">
          <div className="lp-cta mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-12 text-center text-white sm:px-12 sm:py-16"><span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">ابدأ بخطوتك الأولى</span><h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">خلّي زبائنك يلقاو معلوماتك بسهولة</h2><p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-200">أنشئ بطاقتك الرقمية، رتّب معلومات نشاطك، وشارك رابطك أينما يتواجد عملاؤك.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/signup" className="lp-primary-btn">إنشاء حساب <span>←</span></Link><Link href="/login" className="lp-secondary-btn">عندي حساب بالفعل</Link></div></div>
        </section>
      </main>
      <Footer />
    </>
  );
}
