"use client";

import { useEffect, useState } from "react";
import {
  loadAdminMfaStatus,
  redeemAdminRecoveryCode,
  regenerateAdminRecoveryCodes,
  startAdminTotpEnrollment,
  verifyAdminTotp,
} from "@/app/admin/mfa/actions";

type Mode = "loading" | "setup" | "challenge" | "backup" | "codes";

export default function AdminMfaPanel() {
  const [mode, setMode] = useState<Mode>("loading");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [verifiedFactorId, setVerifiedFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [remainingCodes, setRemainingCodes] = useState<number | null>(null);
  const [setupJustStarted, setSetupJustStarted] = useState(false);

  useEffect(() => {
    let active = true;
    loadAdminMfaStatus().then((result) => {
      if (!active) return;
      if (!result.ok) {
        setMessage(result.message);
        setMode("setup");
        return;
      }

      const verified = result.factors.filter((factor) => factor.status === "verified");
      setRemainingCodes(result.recoveryCodesRemaining);
      if (result.recoveryMode) {
        setMode("setup");
        setMessage("تم قبول رمز الاسترداد. أضف تطبيق مصادقة جديدًا لإعادة حماية الحساب.");
      } else if (verified.length > 0) {
        setVerifiedFactorId(verified[0].id);
        setMode("challenge");
      } else {
        setMode("setup");
      }
    }).catch(() => {
      if (!active) return;
      setMessage("تعذر تحميل إعدادات الأمان. أعد تحميل الصفحة.");
      setMode("setup");
    });
    return () => { active = false; };
  }, []);

  async function beginSetup() {
    setBusy(true);
    setMessage("");
    try {
      const result = await startAdminTotpEnrollment();
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setFactorId(result.factorId);
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setSetupJustStarted(true);
    } finally {
      setBusy(false);
    }
  }

  async function confirmTotp() {
    const activeFactor = mode === "setup" ? factorId : verifiedFactorId;
    if (!activeFactor) {
      setMessage("ابدأ إعداد التطبيق أولًا.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await verifyAdminTotp(activeFactor, code, mode === "setup" ? "setup" : "login");
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setCode("");
      if (mode === "setup" || (result.recoveryCodes && result.recoveryCodes.length > 0)) {
        let codes = result.recoveryCodes || [];
        if (codes.length === 0) {
          const generated = await regenerateAdminRecoveryCodes();
          if (generated.ok) codes = generated.codes;
        }
        setRecoveryCodes(codes);
        setMessage(result.message);
        setQrCode("");
        setSecret("");
        setMode("codes");
      } else {
        window.location.assign("/admin");
      }
    } finally {
      setBusy(false);
    }
  }

  async function useBackupCode() {
    setBusy(true);
    setMessage("");
    try {
      const result = await redeemAdminRecoveryCode(backupCode);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setBackupCode("");
      setMessage(result.message);
      setMode("setup");
      setSetupJustStarted(false);
      setQrCode("");
      setSecret("");
      setFactorId("");
    } finally {
      setBusy(false);
    }
  }

  async function createNewRecoveryCodes() {
    setBusy(true);
    setMessage("");
    try {
      const result = await regenerateAdminRecoveryCodes();
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setRecoveryCodes(result.codes);
      setMode("codes");
      setMessage("تم إنشاء رموز جديدة. الرموز القديمة لم تعد صالحة.");
    } finally {
      setBusy(false);
    }
  }

  function copyCodes() {
    void navigator.clipboard.writeText(recoveryCodes.join("\n"))
      .then(() => setMessage("تم نسخ الرموز. احفظها في مكان آمن خارج الموقع."))
      .catch(() => setMessage("تعذر النسخ تلقائيًا. انسخ الرموز يدويًا."));
  }

  function finishSetup() {
    setRecoveryCodes([]);
    window.location.assign("/admin");
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold text-blue-700">أمان منصة بطاقتي</p>
        <h1 className="mt-2 text-2xl font-black">التحقق بخطوتين للمدير</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          لوحة الإدارة محمية برمز من تطبيق المصادقة. لا ترسل رمزك أو رموز الاسترداد لأي شخص.
        </p>

        {message && (
          <p role="status" className="mt-5 rounded-xl bg-blue-50 p-4 text-sm font-bold leading-7 text-blue-900">
            {message}
          </p>
        )}

        {mode === "loading" && <p className="mt-6 text-sm text-slate-500">جارٍ فحص إعدادات المصادقة...</p>}

        {mode === "setup" && !setupJustStarted && (
          <section className="mt-6 space-y-4">
            <h2 className="font-extrabold">إعداد تطبيق المصادقة</h2>
            <p className="text-sm leading-7 text-slate-600">
              افتح Google Authenticator أو تطبيقًا متوافقًا، ثم امسح رمز QR الذي سيظهر لك.
            </p>
            <button
              type="button"
              onClick={beginSetup}
              disabled={busy}
              className="w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50"
            >
              {busy ? "جارٍ التحضير..." : "إعداد تطبيق المصادقة"}
            </button>
            {verifiedFactorId && (
              <button type="button" onClick={() => setMode("challenge")} className="w-full rounded-xl border px-5 py-3 text-sm font-bold">
                لديّ تطبيق مصادقة مرتبط بالفعل
              </button>
            )}
          </section>
        )}

        {mode === "setup" && setupJustStarted && (
          <section className="mt-6 space-y-4">
            <h2 className="font-extrabold">امسح رمز QR</h2>
            <img src={qrCode} alt="رمز ربط تطبيق المصادقة" className="mx-auto max-h-64 w-full max-w-64 rounded-xl border p-3" />
            <p className="text-xs text-slate-500">إن تعذر المسح، أدخل هذا المفتاح يدويًا في تطبيق المصادقة:</p>
            <code dir="ltr" className="block break-all rounded-lg bg-slate-100 p-3 text-center text-sm">{secret}</code>
            <label className="block text-sm font-bold">
              رمز التحقق
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
                maxLength={8}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-center text-xl tracking-widest"
                placeholder="000000"
              />
            </label>
            <button
              type="button"
              onClick={confirmTotp}
              disabled={busy || code.length < 6}
              className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white disabled:opacity-50"
            >
              {busy ? "جارٍ التحقق..." : "تأكيد تفعيل المصادقة"}
            </button>
          </section>
        )}

        {mode === "challenge" && (
          <section className="mt-6 space-y-4">
            <h2 className="font-extrabold">أدخل رمز تطبيق المصادقة</h2>
            <label className="block text-sm font-bold">
              رمز من 6 أرقام
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
                maxLength={8}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-center text-xl tracking-widest"
                placeholder="000000"
              />
            </label>
            <button
              type="button"
              onClick={confirmTotp}
              disabled={busy || code.length < 6}
              className="w-full rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50"
            >
              {busy ? "جارٍ التحقق..." : "تحقق وافتح لوحة الإدارة"}
            </button>
            <button type="button" onClick={() => setMode("backup")} className="w-full rounded-xl border px-5 py-3 text-sm font-bold">
              لا أستطيع استخدام تطبيق المصادقة
            </button>
            {remainingCodes === 0 && (
              <button type="button" onClick={createNewRecoveryCodes} disabled={busy} className="w-full rounded-xl border border-blue-200 px-5 py-3 text-sm font-bold text-blue-800">
                إنشاء رموز استرداد جديدة
              </button>
            )}
          </section>
        )}

        {mode === "backup" && (
          <section className="mt-6 space-y-4">
            <h2 className="font-extrabold">استخدام رمز استرداد</h2>
            <p className="text-sm leading-7 text-slate-600">
              كل رمز يعمل مرة واحدة فقط. بعد استعماله ستحتاج إلى ربط تطبيق مصادقة جديد.
            </p>
            <label className="block text-sm font-bold">
              رمز الاسترداد
              <input
                dir="ltr"
                autoComplete="off"
                value={backupCode}
                onChange={(event) => setBackupCode(event.target.value.toUpperCase().slice(0, 40))}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-center font-mono tracking-wide"
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
              />
            </label>
            <button
              type="button"
              onClick={useBackupCode}
              disabled={busy || backupCode.trim().length < 20}
              className="w-full rounded-xl bg-amber-700 px-5 py-3 font-bold text-white disabled:opacity-50"
            >
              {busy ? "جارٍ التحقق..." : "استعمال رمز الاسترداد"}
            </button>
            <button type="button" onClick={() => setMode("challenge")} className="w-full rounded-xl border px-5 py-3 text-sm font-bold">
              الرجوع إلى رمز التطبيق
            </button>
          </section>
        )}

        {mode === "codes" && (
          <section className="mt-6 space-y-4">
            <h2 className="font-extrabold">احفظ رموز الاسترداد الآن</h2>
            <p className="text-sm leading-7 text-amber-800">
              تظهر هذه الرموز مرة واحدة فقط. كل رمز يُستهلك بعد استعماله. لا تحفظها في صورة عامة أو ترسلها في محادثة.
            </p>
            {recoveryCodes.length > 0 ? (
              <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                {recoveryCodes.map((item) => (
                  <code key={item} dir="ltr" className="rounded-lg border bg-white px-3 py-2 text-center font-mono text-sm font-bold">
                    {item}
                  </code>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                لم نستطع إنشاء الرموز تلقائيًا. أنشئها الآن بعد تأكدك من تفعيل المصادقة.
              </p>
            )}
            <button
              type="button"
              onClick={copyCodes}
              disabled={recoveryCodes.length === 0}
              className="w-full rounded-xl border px-5 py-3 font-bold disabled:opacity-50"
            >
              نسخ الرموز
            </button>
            <button type="button" onClick={createNewRecoveryCodes} disabled={busy} className="w-full rounded-xl border px-5 py-3 text-sm font-bold">
              {busy ? "جارٍ الإنشاء..." : "إلغاء الرموز الحالية وإنشاء مجموعة جديدة"}
            </button>
            <button
              type="button"
              onClick={finishSetup}
              className="w-full rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white"
            >
              حفظت الرموز، افتح لوحة الإدارة
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
