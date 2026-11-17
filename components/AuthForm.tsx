"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { csrfHeaders } from "@/lib/client/csrf";
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone("");
    if (!isLogin && name.trim().length < 2) {
      setError("الاسم يجب أن يحتوي على حرفين على الأقل.");
      return;
    }
    if (!isLogin && (password.length < 8 || password.length > 256)) {
      setError("كلمة المرور يجب أن تكون بين 8 و256 حرفًا.");
      return;
    }
    if (isLogin && (!password || password.length > 1024)) {
      setError("أدخل كلمة المرور الصحيحة.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(isLogin ? "/api/auth/login" : "/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
        body: JSON.stringify(isLogin
          ? { email, password }
          : { name: name.trim(), email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error || (isLogin
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
          : "تعذر إنشاء الحساب. تحقق من البيانات وحاول مجددًا."));
        return;
      }
      if (isLogin || result?.hasSession) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setDone("إذا كانت البيانات صالحة، ستصلك رسالة تأكيد إلى بريدك. افتحها واضغط الرابط ثم سجّل الدخول.");
    } catch {
      setError("تعذر الاتصال بالخدمة. حاول مجددًا.");
    } finally {
      setLoading(false);
    }
  }

  const input = "mt-1 w-full rounded-lg border border-slate-300 p-3 focus:border-brand focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {!isLogin && (
        <label className="block text-sm font-bold">
          الاسم
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} autoComplete="name" className={input} />
        </label>
      )}
      <label className="block text-sm font-bold">
        البريد الإلكتروني
        <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} autoComplete="email" className={input} />
      </label>
      <label className="block text-sm font-bold">
        كلمة المرور
        <input type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={isLogin ? 1024 : 256} autoComplete={isLogin ? "current-password" : "new-password"} className={input} />
      </label>
      {isLogin && <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center"><Link href="/forgot-password" className="inline-block text-sm font-extrabold text-blue-800 underline underline-offset-4 hover:text-blue-950">نسيت كلمة المرور؟ اضغط هنا لاسترجاع حسابك</Link></div>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {done && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-800">{done}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "لحظة..." : isLogin ? "دخول" : "إنشاء الحساب"}
      </button>
    </form>
  );
}
