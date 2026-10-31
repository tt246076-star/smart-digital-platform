"use client";

import { useEffect, useState } from "react";

type DiagnosticResult = {
  ok: boolean;
  tokenValid: boolean;
  checks: Record<string, { ok: boolean; httpStatus: number }>;
  summary: { wilayasCount: number; communesCount: number; stopDeskCommunesCount: number; feeWilayasCount: number };
  wilayas: Array<{ id: number; name: string }>;
  communesSample: Array<{ name: string; wilayaId: number | null; postalCode: string; hasStopDesk: boolean }>;
  fees: Array<{ wilayaId: number; home?: number | null; stopDesk?: number | null; returnHome?: number | null; returnStopDesk?: number | null; exchangeHome?: number | null; exchangeStopDesk?: number | null }>;
  note: string;
};

const checkLabels: Record<string, string> = {
  token: "صلاحية المفتاح",
  wilayas: "الولايات",
  communes: "البلديات",
  fees: "أسعار التوصيل"
};

export default function EcotrackSettingsForm({ provider = "dhd" }: { provider?: "dhd" | "anderson" }) {
  const companyName = provider === "anderson" ? "Anderson Delivery" : "DHD / Ecotrack";
  const settingsUrl = `/api/admin/ecotrack/settings?provider=${provider}`;
  const testUrl = `/api/admin/ecotrack/test?provider=${provider}`;
  const [baseUrl, setBaseUrl] = useState(provider === "anderson" ? "https://anderson-ecommerce.ecotrack.dz" : "https://platform.dhd-dz.com");
  const [token, setToken] = useState("");
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [diagnosticError, setDiagnosticError] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    fetch(settingsUrl, { cache: "no-store" })
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
      const response = await fetch(testUrl, {
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

  async function diagnose() {
    setDiagnosing(true);
    setDiagnosticError("");
    setDiagnostics(null);
    try {
      if (provider === "anderson") throw new Error("الفحص التفصيلي للولايات والأسعار متاح حالياً لـ DHD فقط؛ اختبار الاتصال وحفظ Anderson يعملان بشكل مستقل.");
      const response = await fetch("/api/admin/ecotrack/diagnostics", { method: "POST", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر فحص بيانات الشركة");
      setDiagnostics(data as DiagnosticResult);
    } catch (error) {
      setDiagnosticError(error instanceof Error ? error.message : "تعذر فحص بيانات الشركة");
    } finally {
      setDiagnosing(false);
    }
  }

  async function save() {
    setSaving(true);
    setNotice(null);
    setDiagnostics(null);
    try {
      const response = await fetch(settingsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, token })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "فشل الحفظ");
      setConfigured(true);
      setToken("");
      setNotice({ kind: "ok", text: "تم حفظ المفتاح مشفّرًا. استعمل «فحص بيانات الشركة» للتحقق من الولايات والبلديات والأسعار المتاحة." });
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "تعذر حفظ الإعدادات" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section dir="rtl" className="rounded-3xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl sm:p-7">
      <header className="flex items-center justify-between border-b border-slate-700 pb-5">
        <div className="flex items-center gap-3"><span className="text-3xl">🟢</span><div><h2 className="text-2xl font-black">{companyName}</h2><p className="mt-1 text-sm text-slate-400">إعداد وفحص ربط شركة التوصيل</p></div></div>
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
        <button type="button" onClick={testConnection} disabled={testing || loading || !baseUrl.trim() || !token.trim()} className="rounded-xl border border-slate-700 px-5 py-3 font-bold hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{testing ? "جارٍ اختبار الاتصال..." : "🔌 اختبار الاتصال بالمفتاح"}</button>
        <button type="button" onClick={diagnose} disabled={diagnosing || loading || !configured} className="rounded-xl bg-sky-500 px-5 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{diagnosing ? "نفحص بيانات DHD..." : "🔎 فحص بيانات الشركة المحفوظة"}</button>
      </div>
      {diagnosticError && <p role="alert" className="mt-5 rounded-xl bg-red-950 p-3 text-sm font-bold text-red-200">{diagnosticError}</p>}
      {diagnostics && <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-black">نتيجة الفحص المباشر</h3><span className={`rounded-full px-3 py-1 text-xs font-black ${diagnostics.ok ? "bg-emerald-900 text-emerald-200" : "bg-amber-900 text-amber-200"}`}>{diagnostics.ok ? "كل المسارات الأساسية تعمل" : "بعض المسارات تحتاج مراجعة"}</span></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["الولايات", diagnostics.summary.wilayasCount],
            ["البلديات", diagnostics.summary.communesCount],
            ["بلديات فيها مكتب استلام", diagnostics.summary.stopDeskCommunesCount],
            ["ولايات بأسعار", diagnostics.summary.feeWilayasCount]
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-800 p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-black tabular-nums">{value}</p></div>)}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {Object.entries(diagnostics.checks).map(([key, check]) => <div key={key} className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-sm"><span>{checkLabels[key] || key}</span><span className={check.ok ? "font-bold text-emerald-300" : "font-bold text-red-300"}>{check.ok ? "ناجح" : `فشل HTTP ${check.httpStatus}`}</span></div>)}
        </div>
        <h4 className="mt-5 font-black">أسعار التوصيل حسب الولاية</h4>
        <div className="mt-2 max-h-80 overflow-auto rounded-xl border border-slate-800">
          <table className="w-full text-right text-xs">
            <thead className="sticky top-0 bg-slate-800 text-slate-300"><tr><th className="p-2">الولاية</th><th className="p-2">للمنزل</th><th className="p-2">مكتب</th><th className="p-2">إرجاع للمنزل</th><th className="p-2">إرجاع مكتب</th></tr></thead>
            <tbody>{diagnostics.fees.map((fee) => <tr key={fee.wilayaId} className="border-t border-slate-800"><td className="p-2">{diagnostics.wilayas.find((w) => w.id === fee.wilayaId)?.name || fee.wilayaId}</td><td className="p-2">{fee.home ?? "—"} دج</td><td className="p-2">{fee.stopDesk ?? "—"} دج</td><td className="p-2">{fee.returnHome ?? "—"} دج</td><td className="p-2">{fee.returnStopDesk ?? "—"} دج</td></tr>)}</tbody>
          </table>
        </div>
        <h4 className="mt-5 font-black">عينة من البلديات ومكاتب الاستلام</h4>
        <div className="mt-2 space-y-2">{diagnostics.communesSample.map((commune, index) => <div key={`${commune.wilayaId}-${commune.name}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm"><span>{commune.name} · ولاية {commune.wilayaId ?? "—"}</span><span className={commune.hasStopDesk ? "text-emerald-300" : "text-slate-400"}>{commune.hasStopDesk ? "يتوفر مكتب استلام" : "توصيل فقط"}{commune.postalCode ? ` · ${commune.postalCode}` : ""}</span></div>)}</div>
        <p className="mt-4 text-xs leading-6 text-slate-400">{diagnostics.note}</p>
      </div>}
      <p className="mt-4 text-xs leading-6 text-slate-400">{loading ? "جارٍ تحميل حالة الربط..." : "فحص بيانات الشركة قراءة فقط: لا ينشئ شحنات ولا يغيّر طلبات الزبائن. مزامنة التتبع تحتاج أرقام تتبع حقيقية."}</p>
    </section>
  );
}
