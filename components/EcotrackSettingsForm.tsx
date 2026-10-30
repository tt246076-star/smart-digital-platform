"use client";

import { useEffect, useState } from "react";

export default function EcotrackSettingsForm() {
  const [baseUrl, setBaseUrl] = useState("https://platform.dhd-dz.com");
  const [token, setToken] = useState("");
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);\n  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/ecotrack/settings", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "تعذر تحميل الإعدادات");
        if (data.baseUrl) setBaseUrl(data.baseUrl);
        setConfigured(Boolean(data.configured));
      })
      .catch((error) => setNotice({ kind: "error", text: error.message || "تعذر تحميل الإعدادات" }))
      .finally(() => setLoading(false));
  }, []);

  async function testConnection() {
    setTesting(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/ecotrack/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, token })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "فشل اختبار الاتصال");
      setNotice({ kind: data.ok ? "ok" : "error", text: data.message || data.error || "تعذر التحقق من الاتصال" });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "تعذر اختبار الاتصال" });
    } finally {
      setTesting(false);
    }
  }

  async function save() {
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/ecotrack/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, token })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "فشل الحفظ");
      setConfigured(true);
      setToken("");
      setNotice({ kind: "ok", text: "تم حفظ API Token مشفّرًا في قاعدة البيانات. الربط الفعلي وجلب الشحنات يحتاجان تحديد مسار API الصحيح." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "تعذر حفظ الإعدادات" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section dir="rtl" className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl sm:p-7">
      <header className="flex items-center justify-between border-b border-slate-700 pb-5">
        <div className="flex items-center gap-3"><span className="text-3xl">🟢</span><div><h2 className="text-2xl font-black">Ecotrack</h2><p className="mt-1 text-sm text-slate-400">إعداد ربط شركة التوصيل</p></div></div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold">{configured ? "إعداد محفوظ" : "غير مربوط"}</span>
      </header>
      <div className="mt-5">
        <label htmlFor="ecotrack-url" className="mb-2 block font-bold">رابط المنصة</label>
        <input id="ecotrack-url" type="url" autoComplete="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://platform.dhd-dz.com" className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-left text-base outline-none focus:border-emerald-400" />
      </div>
      <div className="mt-5 rounded-2xl border border-amber-400 bg-amber-400/10 p-4">
        <h3 className="text-lg font-black">🔑 API Token تاع حسابك</h3>
        <p className="mt-2 leading-7 text-slate-300">ألصق المفتاح هنا. ما يبانش في الصفحة بعد الحفظ، ويتخزّن مشفّرًا في السيرفر.</p>
      </div>
      <div className="mt-5">
        <label htmlFor="ecotrack-token" className="mb-2 block font-bold">API Token</label>
        <input id="ecotrack-token" type="password" autoComplete="new-password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={configured ? "أدخل مفتاحًا جديدًا للتغيير" : "ألصق API Token هنا"} className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-4 text-left outline-none focus:border-emerald-400" />
      </div>
      {notice && <p role="status" className={`mt-4 rounded-xl p-3 text-sm leading-6 ${notice.kind === "ok" ? "bg-emerald-950 text-emerald-200" : notice.kind === "error" ? "bg-red-950 text-red-200" : "bg-slate-800 text-slate-200"}`}>{notice.text}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={save} disabled={saving || loading || !baseUrl.trim() || !token.trim()} className="rounded-xl bg-emerald-500 px-6 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "جارٍ الحفظ..." : "💾 حفظ"}</button>
        <button type="button" onClick={testConnection} disabled={testing || loading || !baseUrl.trim() || !token.trim()} className="rounded-xl border border-slate-700 px-5 py-3 font-bold hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{testing ? "جارٍ اختبار الاتصال..." : "🔌 اختبار الاتصال"}</button>
      </div>
      <p className="mt-4 text-xs leading-6 text-slate-400"> {loading ? "جارٍ تحميل حالة الربط..." : "لا تدخل المفتاح إلا في هذه الخانة الخاصة. الاختبار يتحقق من صلاحية المفتاح؛ مزامنة الشحنات وإشعارات واتساب تحتاج مراحل ربط إضافية."}</p>
    </section>
  );
}
