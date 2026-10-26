import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CardMock from "@/components/CardMock";

const features = [
  { t: "رابط واحد لكل شيء", d: "اجمع أرقامك وحساباتك ومواقعك في صفحة واحدة مرتبة." },
  { t: "رمز QR جاهز للمشاركة", d: "اطبعه على بطاقتك أو واجهة محلك ليفتح الناس صفحتك بمسح واحد." },
  { t: "تعديل فوري بلا إعادة طباعة", d: "غيّر رقمك أو عرضك في أي وقت وتتحدث البطاقة عند الجميع." },
  { t: "إحصائيات الزيارات", d: "اعرف كم شخصًا فتح بطاقتك وأي رابط ضغطوا عليه." },
  { t: "تصميم عربي من اليمين لليسار", d: "واجهة مصممة للعربية أولًا، وتعمل بسلاسة على الهاتف." },
  { t: "متجر للقوالب", d: "اختر شكل بطاقتك من قوالب جاهزة." },
];

const steps = [
  { t: "أنشئ حسابك", d: "سجّل ببريدك الإلكتروني." },
  { t: "صمّم بطاقتك", d: "أضف اسمك وصورتك وروابطك واختر القالب." },
  { t: "شاركها", d: "أرسل الرابط أو اعرض رمز QR على من تقابله." },
];

const plans = [
  { n: "مجاني", p: "0$", items: ["بطاقة واحدة", "رابط خاص بك", "رمز QR"], hi: false },
  { n: "احترافي", p: "9$", items: ["حتى 5 بطاقات", "إحصائيات الزيارات", "قوالب إضافية"], hi: true },
  { n: "أعمال", p: "29$", items: ["بطاقات للفريق", "هوية موحدة", "دعم أولوية"], hi: false },
];

const faqs = [
  { q: "ما هي البطاقة الرقمية الذكية؟", a: "صفحة على الإنترنت تجمع بياناتك وروابطك، تشاركها برابط أو رمز QR بدل البطاقة الورقية." },
  { q: "هل أحتاج إلى معرفة تقنية؟", a: "لا. ستملأ بياناتك وتختار القالب فقط." },
  { q: "هل الخدمة جاهزة الآن؟", a: "هذه نسخة المرحلة الأولى: التصميم والصفحات فقط. الحسابات والبطاقات الفعلية تُضاف في المراحل القادمة." },
  { q: "هل الأسعار نهائية؟", a: "لا، الأسعار المعروضة تجريبية وقد تتغير قبل الإطلاق." },
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-mist to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 md:grid-cols-2 md:py-24">
            <div>
              <h1 className="text-4xl font-extrabold leading-snug md:text-5xl md:leading-snug">
                بطاقة أعمال تعيش في هاتف كل من تقابله
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
                أنشئ بطاقة رقمية بتصميم عربي أنيق، وشاركها برابط أو رمز QR، وحدّثها متى شئت دون إعادة طباعة.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup" className="rounded-xl bg-brand px-6 py-3 font-bold text-white hover:bg-blue-700">
                  أنشئ حسابك
                </Link>
                <Link href="/login" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold hover:border-brand">
                  تسجيل الدخول
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-500">المرحلة الأولى: واجهة الموقع. الحسابات تُفعَّل لاحقًا.</p>
            </div>
            <CardMock />
          </div>
        </section>

        <section id="features" className="scroll-mt-28 mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-extrabold">كل ما تحتاجه بطاقتك</h2>
          <p className="mt-2 text-slate-600">المميزات التي نبنيها على مراحل.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.t} className="rounded-2xl border border-slate-200 p-6">
                <h3 className="text-lg font-extrabold">{f.t}</h3>
                <p className="mt-2 leading-7 text-slate-600">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-28 bg-ink text-white">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-3xl font-extrabold">ثلاث خطوات وتبدأ</h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.t} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber font-extrabold text-ink">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold">{s.t}</h3>
                    <p className="mt-1 leading-7 text-slate-300">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-28 mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-extrabold">الأسعار</h2>
          <p className="mt-2 text-slate-600">أسعار تجريبية للعرض فقط، ولا يوجد دفع حاليًا.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.n}
                className={`rounded-2xl p-6 ${p.hi ? "border-2 border-brand bg-mist" : "border border-slate-200"}`}
              >
                <h3 className="text-lg font-extrabold">{p.n}</h3>
                <p className="mt-2 text-4xl font-extrabold">
                  {p.p}
                  <span className="text-base font-semibold text-slate-500"> / شهريًا</span>
                </p>
                <ul className="mt-5 space-y-2 text-slate-700">
                  {p.items.map((i) => (
                    <li key={i}>✓ {i}</li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`mt-6 block rounded-xl py-3 text-center font-bold ${p.hi ? "bg-brand text-white" : "border border-slate-300"}`}
                >
                  أنشئ حسابك
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="scroll-mt-28 mx-auto max-w-3xl px-4 pb-20">
          <h2 className="text-3xl font-extrabold">الأسئلة الشائعة</h2>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {faqs.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex cursor-pointer items-center justify-between font-bold">
                  {f.q}
                  <span className="text-brand transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-7 text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
