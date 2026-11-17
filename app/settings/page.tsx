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
    const normalizedName = name.trim();
    if (normalizedName.length > 80) { setMessage("الاسم الظاهر يجب ألا يتجاوز 80 حرفًا."); return; }
    setBusy(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("سجّل الدخول من جديد."); setBusy(false); return; }
    const { error: authError } = await supabase.auth.updateUser({ data: { display_name: normalizedName } });
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, display_name: normalizedName }, { onConflict: "id" });
    const error = authError || profileError;
    setMessage(error ? "تعذر حفظ الملف الشخصي. تحقق من البيانات وحاول مجددًا." : "تم حفظ الملف الشخصي.");
    setBusy(false);
  }

  async function changePassword() {
    if (password.length < 8 || password.length > 256) { setMessage("كلمة السر لازم تكون بين 8 و256 حرفًا."); return; }
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("تعذر تغيير كلمة السر. تحقق من البيانات وحاول مجددًا.");
      setBusy(false);
      return;
    }
    const { error: sessionsError } = await supabase.auth.signOut({ scope: "others" });
    setMessage(
      sessionsError
        ? "تم تغيير كلمة السر، لكن تعذر إنهاء الجلسات الأخرى. سجّل الخروج من الأجهزة الأخرى يدويًا."
        : "تم تغيير كلمة السر وإنهاء الجلسات الأخرى."
    );
    setPassword("");
    setBusy(false);
  }

  async function setupMfa() {
    setBusy(true);
    setMessage("");
    setMfa(null);

    // Supabase requires friendly names to be unique per user. Never reuse
    // the legacy "بطاقاتي" name, which may already exist on this account.
    const friendlyName = `Bitaqati Authenticator ${crypto.randomUUID()}`;
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName,
    });

    if (error) {
      setMessage(
        error.code === "mfa_factor_name_conflict"
          ? "اسم تطبيق المصادقة مستخدم مسبقًا. أعد المحاولة لإنشاء اسم جديد."
          : "تعذر بدء إعداد المصادقة الثنائية. حاول مجددًا."
      );
      setBusy(false);
      return;
    }

    setMfa(data || null);
    setMessage("امسح رمز QR بتطبيق مصادقة، ثم أدخل الرمز للتحقق.");
    setBusy(false);
  }

  async function verifyMfa() {
    if (!mfa?.id) return;
    setBusy(true);
    if (typeof mfa.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(mfa.id)) {
      setMessage("عامل المصادقة غير صالح. أعد إعداد المصادقة الثنائية.");
      setBusy(false);
      return;
    }
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfa.id });
    if (challengeError || !challenge) { setMessage("تعذر بدء التحقق. حاول مجددًا."); setBusy(false); return; }
    const code = window.prompt("أدخل رمز التحقق من تطبيق المصادقة");
    if (!code) { setBusy(false); return; }
    if (!/^[0-9]{6,8}$/.test(code.trim())) { setMessage("أدخل رمز تحقق صحيحًا من 6 إلى 8 أرقام."); setBusy(false); return; }
    const { error } = await supabase.auth.mfa.verify({ factorId: mfa.id, challengeId: challenge.id, code: code.trim() });
    setMessage(error ? "رمز التحقق غير صحيح أو انتهت صلاحيته." : "تم تفعيل المصادقة الثنائية.");
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
