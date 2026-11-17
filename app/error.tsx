"use client";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: AppErrorProps) {
  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 text-slate-900"
    >
      <section
        role="alert"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        <h1 className="mb-3 text-2xl font-bold">حدث خطأ غير متوقع</h1>
        <p className="mb-7 leading-8 text-slate-600">
          تعذر إكمال العملية الآن. لم تُعرض التفاصيل التقنية حفاظًا على أمان الموقع.
          يرجى إعادة المحاولة.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            العودة للرئيسية
          </a>
        </div>
      </section>
    </main>
  );
}
