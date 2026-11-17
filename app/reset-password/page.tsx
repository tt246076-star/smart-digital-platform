"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { csrfHeaders } from "@/lib/client/csrf";
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8 || password.length > 256) {
      setError("كلمة المرور يجب أن تكون بين 8 و256 حرفًا.");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error || "الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.");
        return;
      }
      router.push("/login?error=password-updated");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخدمة. حاول مجددًا.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-extrabold">تعيين كلمة مرور جديدة</h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">أدخل كلمة مرور جديدة بين 8 و256 حرفًا.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-bold">
          كلمة المرور الجديدة
          <input
            type="password"
            dir="ltr"
            minLength={8}
            maxLength={256}
            required
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          />
        </label>
        <label className="block text-sm font-bold">
          تأكيد كلمة المرور
          <input
            type="password"
            dir="ltr"
            minLength={8}
            required
            autoComplete="new-password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
          />
        </label>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-brand py-3 font-bold text-white disabled:opacity-60">
          {loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور الجديدة"}
        </button>
      </form>
    </main>
  );
}
