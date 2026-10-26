"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfa, setMfa] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email || "");
        setName(String(data.user.user_metadata?.display_name || ""));
      }
    });
  }, []);

  async function saveProfile() {
    setBusy(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("سجّل الدخول من جديد."); setBusy(false); return; }
    const { error: authError } = await supabase.auth.updateUser({ data: { display_name: name } });
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, display_name: name }, { onConflict: "id" });
    const error = authError || profileError;
    setMessage(error ? error.message : "تم حفظ الملف الشخصي.");
    setBusy(false);
  }

  async function changePassword() {
    if (password.length < 8) { setMessage("كلمة السر لازم تكون 8 أحرف على الأقل."); return; }
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "تم تغيير كلمة السر.");
    setPassword(""); setBusy(false);
  }

  async function setupMfa() {
    setBusy(true); setMessage("");
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "بطاقاتي" });
    setMfa(data || null);
    setMessage(error ? error.message : "امسح رمز QR بتطبيق مصادقة، ثم أدخل الرمز للتحقق.");
    setBusy(false);
  }

  async function verifyMfa() {
    if (!mfa?.id) return;
    setBusy(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfa.id });
    if (challengeError || !challenge) { setMessage(challengeError?.message || "تعذر بدء التحقق."); setBusy(false); return; }
    const code = window.prompt("أدخل رمز التحقق من تطبيق المصادقة");
    if (!code) { setBusy(false); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId: mfa.id, challengeId: challenge.id, code });
    setMessage(error ? error.message : "تم تفعيل المصادقة الثنائية.");
    setBusy(false);
  }

  return <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-sm font-bold text-blue-700">← العودة للوحة التحكم</Link>
      <h1 className="mt-5 text-3xl font-black">الإعدادات ⚙️</h1>
      <p className="mt-2 text-slate-600">إدارة معلوماتك وأمان حسابك.</p>
      {message && <p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-800">{message}</p>}
      <section className="mt-6 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-extrabold">الملف الشخصي</h2>
        <label className="mt-4 block text-sm font-bold">البريد الإلكتروني</label>
        <input value={email} readOnly className="mt-2 w-full rounded-xl border bg-slate-100 p-3 text-left" dir="ltr" />
        <label className="mt-4 block text-sm font-bold">الاسم الظاهر</label>
        <input value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border p-3" maxLength={80} />
        <button onClick={saveProfile} disabled={busy} className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50">حفظ الملف الشخصي</button>
      </section>
      <section className="mt-5 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-extrabold">تغيير كلمة السر</h2>
        <label className="mt-4 block text-sm font-bold">كلمة السر الجديدة</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border p-3" minLength={8} autoComplete="new-password" />
        <button onClick={changePassword} disabled={busy} className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50">تحديث كلمة السر</button>
      </section>
      <section className="mt-5 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-extrabold">المصادقة الثنائية (2FA)</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">اربط تطبيق مصادقة بحسابك. تأكد من إعداد MFA في مشروع Supabase.</p>
        <button onClick={setupMfa} disabled={busy} className="mt-4 rounded-xl border px-5 py-3 font-bold disabled:opacity-50">إعداد المصادقة الثنائية</button>
        {mfa?.totp?.qr_code && <div className="mt-4"><img alt="رمز QR للمصادقة الثنائية" src={mfa.totp.qr_code} className="max-w-xs" /><p className="mt-2 break-all text-xs" dir="ltr">{mfa.totp.secret}</p><button onClick={verifyMfa} className="mt-3 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white">تحقق وفعّل</button></div>}
      </section>
    </div>
  </main>;
}
