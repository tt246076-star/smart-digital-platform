import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "اتصل بنا",
  description: "تواصل مع فريق منصة بطاقتي عبر واتساب أو الهاتف أو البريد الإلكتروني.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    type: "website",
    locale: "ar_DZ",
    title: "اتصل بنا | بطاقتي",
    description: "قنوات التواصل الرسمية مع منصة بطاقتي.",
    url: "/contact",
    siteName: SITE.name,
  },
};

const whatsappNumber = `213${SITE.phone.replace(/\D/g, "").replace(/^0/, "")}`;
const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("مرحبًا، أريد التواصل مع منصة بطاقتي.")}`;

export default function ContactPage() {
  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-[70vh] bg-slate-50 px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">قنوات التواصل الرسمية</span>
            <h1 className="mt-5 text-3xl font-black text-slate-950 sm:text-5xl">اتصل بفريق بطاقتي</h1>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              لديك استفسار حول البطاقة الرقمية أو المنتجات أو حسابك؟ اختر وسيلة التواصل المناسبة، وسيتم فتح القناة مباشرة.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700" aria-hidden="true">◉</span>
              <h2 className="mt-4 text-xl font-black text-slate-900">WhatsApp</h2>
              <p className="mt-2 text-sm text-slate-600">راسل فريق بطاقتي مباشرة</p>
              <span className="mt-5 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 font-bold text-white">ابدأ المحادثة</span>
            </a>

            <a href={`tel:${SITE.phone}`} className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl text-slate-700" aria-hidden="true">☎</span>
              <h2 className="mt-4 text-xl font-black text-slate-900">الهاتف</h2>
              <p className="mt-2 text-sm text-slate-600" dir="ltr">{SITE.phone}</p>
              <span className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-2.5 font-bold text-white">اتصل الآن</span>
            </a>

            <a href={`mailto:${SITE.email}`} className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl text-slate-700" aria-hidden="true">✉</span>
              <h2 className="mt-4 text-xl font-black text-slate-900">البريد الإلكتروني</h2>
              <p className="mt-2 break-all text-sm text-slate-600">{SITE.email}</p>
              <span className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-2.5 font-bold text-white">أرسل رسالة</span>
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
