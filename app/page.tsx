import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";

const features = [
  { icon: "🪪", title: "كل معلوماتك في رابط واحد", desc: "اجمع اسم نشاطك وصورك ومعلوماتك وروابط التواصل في صفحة واضحة وسهلة المشاركة." },
  { icon: "⚡", title: "تحديث في أي وقت", desc: "عدّل معلومات صفحتك من حسابك عندما تحتاج، من دون إعادة إرسال رابط جديد." },
  { icon: "📱", title: "تعمل مباشرة من المتصفح", desc: "الزبون يفتح صفحتك من الرابط مباشرة، من دون تثبيت تطبيق إضافي." },
  { icon: "🎨", title: "واجهة تناسب نشاطك", desc: "رتّب حضورك الرقمي واختر الإعدادات المتاحة لتعبّر عن هوية نشاطك." },
  { icon: "💬", title: "تواصل أسرع مع الزبائن", desc: "اجعل الاتصال وواتساب وحسابات التواصل ظاهرة في مكان يسهل الوصول إليه." },
  { icon: "🛍️", title: "اعرض منتجاتك وخدماتك", desc: "أضف الصور والأوصاف والأسعار والعنوان وأوقات العمل حيثما كانت الحقول متاحة." },
];

const steps = [
  { n: "01", title: "أنشئ حسابك", desc: "سجّل في بطاقتي للوصول إلى أدوات إنشاء صفحتك." },
  { n: "02", title: "أضف معلوماتك", desc: "اكتب اسم نشاطك وبيانات التواصل وأضف الصور التي تحتاجها." },
  { n: "03", title: "رتّب صفحتك", desc: "نظّم معلوماتك واختر الإعدادات المناسبة لنشاطك." },
  { n: "04", title: "انشر رابطك", desc: "افتح صفحتك وشارك الرابط مع الزبائن عبر الرسائل أو شبكات التواصل." },
];

const useCases = [
  { icon: "🛍️", title: "المتاجر والمحلات", desc: "معلومات المحل، المنتجات، الأسعار وطرق الطلب." },
  { icon: "☕", title: "المطاعم والمقاهي", desc: "العنوان، أوقات العمل، قائمة المنتجات ووسائل التواصل." },
  { icon: "🧰", title: "أصحاب الخدمات", desc: "الخدمات المقدمة، الصور، معلومات الاتصال ومكان النشاط." },
  { icon: "✦", title: "المهنيون والمستقلون", desc: "نبذة عنك، أعمالك وروابطك المهنية في صفحة واحدة." },
];

const faqs = [
  { q: "ما هي بطاقتي؟", a: "بطاقتي منصة تساعدك على إنشاء صفحة رقمية لنشاطك تجمع معلوماتك وصورك وروابط التواصل في مكان واحد." },
  { q: "هل يحتاج الزبون إلى تطبيق؟", a: "لا، يمكن فتح الصفحة من رابطها مباشرة باستخدام متصفح الهاتف أو الكمبيوتر." },
  { q: "هل أحتاج إلى خبرة في البرمجة؟", a: "لا تحتاج إلى كتابة كود لإنشاء صفحتك؛ أضف المعلومات من الأدوات المتاحة في حسابك." },
  { q: "هل يمكنني تعديل معلوماتي لاحقًا؟", a: "يمكنك إدارة معلومات صفحتك وتعديل الحقول المتاحة من حسابك." },
  { q: "هل تعمل الصفحة على الهاتف؟", a: "الواجهة مصممة لتتكيّف مع شاشات الهواتف والكمبيوتر." },
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
                <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /> حضورك الرقمي يبدأ من هنا
              </div>
              <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                نشاطك كامل،
                <span className="lp-gradient-text block">في رابط واحد</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-9 text-slate-200">
                مع {SITE.name}، أنشئ صفحة رقمية تجمع معلومات نشاطك وصورك ومنتجاتك وطرق التواصل، وشاركها مع زبائنك بسهولة — من دون برمجة أو تطبيق إضافي.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup" className="lp-primary-btn">أنشئ صفحتك <span>←</span></Link>
                <a href="#features" className="lp-secondary-btn">اكتشف المميزات <span>⌄</span></a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                <span>✓ رابط سهل المشاركة</span><span>✓ يعمل من المتصفح</span><span>✓ مناسب للهاتف</span>
              </div>
            </div>

            <div className="lp-reveal lp-reveal-delay relative mx-auto w-full max-w-xl">
              <div className="lp-showcase">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-400"/><i className="h-2.5 w-2.5 rounded-full bg-amber-300"/><i className="h-2.5 w-2.5 rounded-full bg-emerald-400"/></div>
                  <span className="text-xs text-slate-300">مثال توضيحي لصفحة نشاط</span><span className="rounded-lg bg-blue-500/20 px-3 py-1 text-xs text-cyan-200">{SITE.name}</span>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
                    <div className="bg-gradient-to-br from-sky-50 via-white to-violet-100 p-5 sm:p-7">
                      <div className="flex items-center gap-3">
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-2xl text-white shadow-lg">م</div>
                        <div><p className="text-xs font-bold text-blue-700">صفحة نشاط رقمية</p><h3 className="mt-1 text-xl font-black">مساحة مشروعك</h3><p className="mt-1 text-xs text-slate-500">معلوماتك • خدماتك • طرق التواصل</p></div>
                      </div>
                      <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4">
                        <div className="flex items-center gap-2 text-sm font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50">✦</span> نبذة عن النشاط</div>
                        <div className="mt-3 space-y-2"><div className="h-2 w-full rounded-full bg-slate-100"/><div className="h-2 w-5/6 rounded-full bg-slate-100"/><div className="h-2 w-2/3 rounded-full bg-slate-100"/></div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {["المنتجات","الموقع","التواصل"].map((label,i)=><div key={label} className="rounded-xl border border-slate-100 bg-white p-3 text-center"><div className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-lg">{["▦","⌖","↗"][i]}</div><p className="mt-2 text-[11px] font-bold">{label}</p></div>)}
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-lg bg-emerald-600 py-3 text-center text-xs font-bold text-white">واتساب</div><div className="rounded-lg bg-blue-600 py-3 text-center text-xs font-bold text-white">اتصل الآن</div></div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[10px] text-slate-500"><span>صفحتك متاحة عبر الرابط</span><span>↗ مشاركة</span></div>
                  </div>
                </div>
              </div>
              <div className="lp-float-card absolute -bottom-5 -left-2 rounded-2xl border border-white/15 bg-slate-900/90 p-3 shadow-xl sm:-left-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/15 text-xl">✓</span><div><p className="text-sm font-bold">كل شيء في مكان واحد</p><p className="text-xs text-slate-400">رابط واحد سهل المشاركة</p></div></div></div>
            </div>
          </div>
          <div className="lp-marquee-wrap border-t border-white/10 py-4"><div className="lp-marquee"><span>صفحة رقمية ✦ معلومات النشاط ✦ صورك الخاصة ✦ المنتجات والخدمات ✦ روابط التواصل ✦ صفحة رقمية ✦ معلومات النشاط ✦ صورك الخاصة ✦</span></div></div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="lp-reveal mx-auto max-w-3xl text-center">
            <span className="lp-eyebrow">بلا تعقيد</span>
            <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-4xl">صفحتك تفتح مباشرة، بلا تطبيق</h2>
            <p className="mt-4 leading-8 text-slate-600">شارك رابط {SITE.name} مع الزبون، يفتحه من متصفح هاتفه ويصل إلى معلوماتك وطرق التواصل من دون خطوات إضافية.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[{icon:"↗",title:"رابط مباشر",desc:"أرسل الرابط في الرسائل أو ضعه في حساباتك الاجتماعية."},{icon:"📱",title:"على مختلف الشاشات",desc:"واجهة متجاوبة لسهولة التصفح على الهاتف والكمبيوتر."},{icon:"✎",title:"معلومات قابلة للتحديث",desc:"حدّث تفاصيل صفحتك من حسابك عند الحاجة."}].map((item,i)=><div key={item.title} className="lp-feature-card lp-reveal text-center" style={{animationDelay:(i*80)+"ms"}}><span className="lp-feature-icon mx-auto">{item.icon}</span><h3 className="mt-4 text-lg font-extrabold text-slate-900">{item.title}</h3><p className="mt-2 leading-7 text-slate-600">{item.desc}</p></div>)}
          </div>
        </section>

        <section id="features" className="lp-feature-section px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="lp-reveal mx-auto max-w-2xl text-center"><span className="lp-eyebrow">مميزات بطاقتي</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">كل ما يحتاجه نشاطك في مكان واحد</h2><p className="mt-4 leading-8 text-slate-600">واجهة واضحة تساعد الزبائن على اكتشاف نشاطك والوصول إليك بسهولة.</p></div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map((f,i)=><div key={f.title} className="lp-feature-card lp-reveal" style={{animationDelay:(i*70)+"ms"}}><span className="lp-feature-icon">{f.icon}</span><h3 className="mt-5 text-lg font-extrabold text-slate-900">{f.title}</h3><p className="mt-2 leading-7 text-slate-600">{f.desc}</p></div>)}</div>
          </div>
        </section>

        <section id="templates" className="lp-section mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="lp-reveal mb-10 text-center"><span className="lp-eyebrow">مناسبة لمختلف الأنشطة</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">منصتك تخدم طبيعة نشاطك</h2><p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">رتّب المعلومات التي يحتاجها زبائنك، سواء كنت تبيع منتجات أو تقدم خدمات.</p></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{useCases.map((item,i)=><article key={item.title} className="lp-template lp-reveal" style={{animationDelay:(i*70)+"ms"}}><div className="lp-template-art bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700"><span className="lp-template-symbol">{item.icon}</span><div className="lp-template-mini"><span/><span/><span/></div><div className="lp-template-lines"><i/><i/><i/></div><span className="lp-template-label">بطاقتي • صفحة نشاط</span></div><div className="p-5"><h3 className="text-lg font-extrabold text-slate-900">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p></div></article>)}</div>
        </section>

        <section id="how" className="lp-feature-section px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="lp-reveal text-center"><span className="lp-eyebrow">طريقة العمل</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">أربع خطوات وتكون صفحتك جاهزة</h2><p className="mt-3 text-slate-600">ابدأ بالمعلومات الأساسية ثم شارك صفحتك مع عملائك.</p></div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{steps.map((s,i)=><div key={s.n} className="lp-step lp-reveal" style={{animationDelay:(i*100)+"ms"}}><span className="lp-step-number">{s.n}</span><div className="mt-5 text-2xl">{["♙","▦","✎","↗"][i]}</div><h3 className="mt-3 text-lg font-extrabold">{s.title}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{s.desc}</p></div>)}</div>
          </div>
        </section>

        <section id="faq" className="px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="lp-reveal text-center"><span className="lp-eyebrow">أسئلة شائعة</span><h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">قبل ما تبدأ</h2><p className="mt-3 leading-7 text-slate-600">إجابات مختصرة عن إنشاء صفحتك ومشاركتها.</p></div>
            <div className="mt-9 space-y-3">{faqs.map((f)=><details key={f.q} className="group rounded-2xl border border-slate-200 bg-white p-5 open:border-blue-200 open:shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-extrabold text-slate-900"><span>{f.q}</span><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700 transition group-open:rotate-45">＋</span></summary><p className="mt-3 pr-1 text-sm leading-7 text-slate-600">{f.a}</p></details>)}</div>
          </div>
        </section>

        <section id="pricing" className="px-5 py-20 sm:px-8">
          <div className="lp-cta mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-12 text-center text-white sm:px-12 sm:py-16"><span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">ابدأ اليوم</span><h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">خلّي معلومات نشاطك قريبة من زبائنك</h2><p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-200">أنشئ صفحتك على {SITE.name}، رتّب معلوماتك وشارك رابطك أينما يتواجد عملاؤك.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/signup" className="lp-primary-btn">أنشئ حسابك <span>←</span></Link><Link href="/login" className="lp-secondary-btn">عندي حساب بالفعل</Link></div></div>
        </section>
      </main>
      <Footer />
    </>
  );
}
