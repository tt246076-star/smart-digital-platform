import Link from "next/link";
import Header from "./Header";

export default function AuthPlaceholder({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-14">
        <h1 className="text-3xl font-extrabold">{isLogin ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
        <p className="mt-3 rounded-xl bg-amber/20 p-4 text-sm leading-7">
          الحسابات غير مفعّلة بعد. سنربطها في المرحلة الثانية مع Supabase، وهذه الصفحة مجرد تمهيد لها.
        </p>
        <div className="mt-6 space-y-4">
          {!isLogin && (
            <label className="block text-sm font-bold">
              الاسم
              <input disabled className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 p-3" />
            </label>
          )}
          <label className="block text-sm font-bold">
            البريد الإلكتروني
            <input disabled type="email" dir="ltr" className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 p-3" />
          </label>
          <label className="block text-sm font-bold">
            كلمة المرور
            <input disabled type="password" dir="ltr" className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-100 p-3" />
          </label>
          <button disabled className="w-full cursor-not-allowed rounded-lg bg-slate-300 py-3 font-bold text-slate-600">
            {isLogin ? "دخول (قريبًا)" : "إنشاء الحساب (قريبًا)"}
          </button>
        </div>
        <p className="mt-6 text-sm text-slate-600">
          {isLogin ? "ليس لديك حساب؟ " : "لديك حساب؟ "}
          <Link href={isLogin ? "/signup" : "/login"} className="font-bold text-brand">
            {isLogin ? "إنشاء حساب" : "تسجيل الدخول"}
          </Link>
          {" · "}
          <Link href="/" className="font-bold text-brand">العودة للرئيسية</Link>
        </p>
      </main>
    </>
  );
}
