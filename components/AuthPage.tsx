import Link from "next/link";
import Header from "./Header";
import AuthForm from "./AuthForm";

export default function AuthPage({ mode, notice }: { mode: "login" | "signup"; notice?: string }) {
  const isLogin = mode === "login";
  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-4 py-14">
        <h1 className="text-3xl font-extrabold">{isLogin ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
        {notice && <p className="mt-4 rounded-lg bg-amber/20 p-3 text-sm font-semibold">{notice}</p>}
        <AuthForm mode={mode} />
        <p className="mt-6 text-sm text-slate-600">
          {isLogin ? "ليس لديك حساب؟ " : "لديك حساب؟ "}
          <Link href={isLogin ? "/signup" : "/login"} className="font-bold text-brand">
            {isLogin ? "إنشاء حساب" : "تسجيل الدخول"}
          </Link>
        </p>
      </main>
    </>
  );
}
