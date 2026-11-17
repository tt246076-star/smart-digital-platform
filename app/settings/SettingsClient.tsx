"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadSettingsProfile, startSettingsTotpEnrollment, verifySettingsTotp } from "./actions";
import { csrfHeaders } from "@/lib/client/csrf";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfa, setMfa] = useState<any>(null);

  useEffect(() => {
    let active = true;
    loadSettingsProfile().then((result) => {
      if (!active) return;
      if (result.ok) {
        setEmail(result.email);
        setName(result.name);
      } else {
        setMessage(result.message);
      }
    }).catch(() => {
      if (active) setMessage("تعذر تحميل إعدادات الحساب. حدّث الصفحة وحاول مجددًا.");
    });
    return () => { active = false; };
  }, []);

  async function saveProfile() {
    const normalizedName = name.trim();
    if (normalizedName.length > 80) { setMessage("الاسم الظاهر يجب ألا يتجاوز 80 حرفًا."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
        body: JSON.stringify({ display_name: normalizedName }),
      });
      const result = await response.json();
      setMessage(response.ok ? "تم حفظ الملف الشخصي." : (result.error || "تعذر حفظ الملف الشخصي. حاول مجددًا."));
    } catch {
      setMessage("تعذر الاتصال بالخدمة. حاول مجددًا.");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword() {
    if (password.length < 8 || password.length > 256) {
      setMessage("كلمة السر لازم تكون بين 8 و256 حرفًا.");
      return;
    }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result?.error || "تعذر تغيير كلمة السر. تحقق من البيانات وحاول مجددًا.");
      } else {
        setMessage(result?.sessionsEnded
          ? "تم تغيير كلمة السر وإنهاء الجلسات الأخرى."
          : "تم تغيير كلمة السر، لكن تعذر إنهاء الجلسات الأخرى. سجّل الخروج من الأجهزة الأخرى يدويًا.");
        setPassword("");
      }
    } catch {
      setMessage("تعذر الاتصال بالخدمة. حاول مجددًا.");
    } finally {
      setBusy(false);
    }
  }

  async function setupMfa() {
    setBusy(true); setMessage(""); setMfa(null);
    try {
      const result = await startSettingsTotpEnrollment();
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setMfa(result.mfa);
      setMessage("امسح رمز QR بتطبيق مصادقة، ثم أدخل الرمز للتحقق.");
    } catch {
      setMessage("تعذر بدء إعداد المصادقة الثنائية. حاول مجددًا.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyMfa() {
    if (!mfa?.id) return;
    setBusy(true);
    try {
      if (typeof mfa.id !== "string") {
        setMessage("عامل المصادقة غير صالح. أعد إعداد المصادقة الثنائية.");
        return;
      }
      const code = window.prompt("أدخل رمز التحقق من تطبيق المصادقة");
      if (!code) return;
      if (!/^[0-9]{6,8}$/.test(code.trim())) {
        setMessage("أدخل رمز تحقق صحيحًا من 6 إلى 8 أرقام.");
        return;
      }
      const result = await verifySettingsTotp(mfa.id, code.trim());
      setMessage(result.ok ? "تم تفعيل المصادقة الثنائية." : result.message);
      if (result.ok) setMfa(null);
    } catch {
      setMessage("تعذر التحقق من الرمز. حاول مجددًا.");
    } finally {
      setBusy(false);
    }
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
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border p-3" minLength={8} autoComplete="new-password" maxLength={256} />
        <button onClick={changePassword} disabled={busy} className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50">تحديث كلمة السر</button>
      </section>
      <section className="mt-5 rounded-2xl border bg-white p-6">
        <h2 className="text-xl font-extrabold">المصادقة الثنائية (2FA)</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">اربط تطبيق مصادقة بحسابك. تأكد من إعداد MFA في مشروع Supabase.</p>
        <button onClick={setupMfa} disabled={busy} className="mt-4 rounded-xl border px-5 py-3 font-bold disabled:opacity-50">إعداد المصادقة الثنائية</button>
        {mfa?.totp?.qr_code && <div className="mt-4"><img alt="رمز QR للمصادقة الثنائية" src={mfa.totp.qr_code} className="max-w-xs" /><p className="mt-2 break-all text-xs" dir="ltr">{mfa.totp.secret}</p><button onClick={verifyMfa} disabled={busy} className="mt-3 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white">تحقق وفعّل</button></div>}
      </section>
    </div>
  </main>;
}
