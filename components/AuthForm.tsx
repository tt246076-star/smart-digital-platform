"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
    if (!isLogin && password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(
          error.message.toLowerCase().includes("not confirmed")
            ? "لم يتم تأكيد بريدك بعد. افتح رسالة التأكيد في بريدك."
            : "البريد الإلكتروني أو كلمة المرور غير صحيحة."
        );
        return;
      }
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError("تعذّر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.");
      return;
    }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError("هذا البريد مسجّل مسبقًا. جرّب تسجيل الدخول.");
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setDone("تم إنشاء الحساب. أرسلنا رسالة تأكيد إلى بريدك، افتحها واضغط الرابط ثم سجّل الدخول.");
  }

  const input = "mt-1 w-full rounded-lg border border-slate-300 p-3 focus:border-brand focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {!isLogin && (
        <label className="block text-sm font-bold">
          الاسم
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className={input} />
        </label>
      )}
      <label className="block text-sm font-bold">
        البريد الإلكتروني
        <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={input} />
      </label>
      <label className="block text-sm font-bold">
        كلمة المرور
        <input type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={isLogin ? "current-password" : "new-password"} className={input} />
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
