"use client";

import { useEffect, useState } from "react";
import EcotrackSettingsForm from "@/components/EcotrackSettingsForm";
import OrdersView from "@/components/OrdersView";

type Provider = "dhd" | "anderson";

const companies: Array<{ id: Provider; name: string; subtitle: string; baseUrl: string }> = [
  { id: "dhd", name: "DHD / Ecotrack", subtitle: "ربط API ومتابعة الطرود", baseUrl: "https://platform.dhd-dz.com" },
  { id: "anderson", name: "Anderson Delivery", subtitle: "ربط API ومتابعة الطرود", baseUrl: "https://anderson-ecommerce.ecotrack.dz" },
];

export default function DeliveryCompaniesPanel() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Provider>("dhd");
  const [configured, setConfigured] = useState<Record<Provider, boolean>>({ dhd: false, anderson: false });
  const [baseUrls, setBaseUrls] = useState<Record<Provider, string>>({
    dhd: companies[0].baseUrl,
    anderson: companies[1].baseUrl,
  });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [trackingProvider, setTrackingProvider] = useState<Provider | null>(null);
  const [deleteProvider, setDeleteProvider] = useState<Provider | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refreshStatus(provider: Provider) {
    try {
      const response = await fetch(`/api/admin/ecotrack/settings?provider=${provider}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تحميل حالة الربط");
      setConfigured((current) => ({ ...current, [provider]: Boolean(data.configured) }));
      if (typeof data.baseUrl === "string" && data.baseUrl) {
        setBaseUrls((current) => ({ ...current, [provider]: data.baseUrl }));
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر تحميل حالة الربط");
    }
  }

  async function refreshAll() {
    setLoading(true);
    await Promise.all(companies.map((company) => refreshStatus(company.id)));
    setLoading(false);
  }

  useEffect(() => { void refreshAll(); }, []);

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`تم نسخ ${label}.`);
    } catch {
      setNotice("تعذر النسخ تلقائياً. انسخ الرابط يدوياً.");
    }
  }

  async function removeIntegration() {
    if (!deleteProvider) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/ecotrack/settings?provider=${deleteProvider}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر حذف الإعدادات");
      setConfigured((current) => ({ ...current, [deleteProvider]: false }));
      setDeleteProvider(null);
      setNotice(`تم حذف إعدادات ${deleteProvider === "anderson" ? "Anderson" : "DHD"}.`);
      await refreshStatus(deleteProvider);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر حذف الإعدادات");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section dir="rtl" className="rounded-3xl border border-slate-800 bg-[#07131d] p-4 text-slate-100 shadow-2xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">شركات التوصيل 🚚</h2>
          <p className="mt-1 text-sm text-slate-400">شركتا التوصيل المعتمدتان في المنصة، ولكل واحدة إعدادات API مستقلة.</p>
        </div>
        <button type="button" onClick={() => { setSelected("dhd"); setOpen(true); setNotice(""); }} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400">
          + إضافة / ربط شركة
        </button>
      </div>

      {notice && (
        <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="text-slate-400 hover:text-white" aria-label="إغلاق التنبيه">×</button>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {companies.map((company) => (
          <article key={company.id} className="overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1b27] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-950 text-2xl">{company.id === "dhd" ? "🚚" : "📦"}</span>
                <div>
                  <h3 className="font-black">{company.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-400">{company.subtitle}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${loading ? "bg-slate-700 text-slate-200" : configured[company.id] ? "bg-emerald-950 text-emerald-300" : "bg-amber-950 text-amber-200"}`}>
                {loading ? "جارٍ التحقق..." : configured[company.id] ? "● الإعدادات محفوظة" : "● غير مربوط"}
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-950/80 to-indigo-950/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-violet-100">رابط منصة الشركة (API)</h4>
                <span className="text-violet-300">↗</span>
              </div>
              <p dir="ltr" className="mt-3 break-all rounded-lg bg-slate-950/70 px-3 py-3 text-left font-mono text-sm text-violet-100">{baseUrls[company.id]}</p>
              <p className="mt-2 text-xs leading-6 text-violet-200/80">التوكن محفوظ بشكل مشفّر ولا يظهر في هذه البطاقة.</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-700 pt-4">
              <button type="button" onClick={() => { setSelected(company.id); setOpen(true); setNotice(""); }} className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400">✎ إعدادات / تعديل</button>
              <button type="button" onClick={() => void copyValue(baseUrls[company.id], "رابط المنصة")} className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">نسخ الرابط</button>
              <button type="button" onClick={() => setTrackingProvider(trackingProvider === company.id ? null : company.id)} className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">{trackingProvider === company.id ? "إخفاء الطرود" : "عرض الطرود"}</button>
              {configured[company.id] && <button type="button" onClick={() => setDeleteProvider(company.id)} className="mr-auto rounded-lg border border-rose-900/70 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-950/50">حذف الربط</button>}
            </div>
          </article>
        ))}
      </div>

      {trackingProvider && (
        <div className="mt-6">
          <OrdersView provider={trackingProvider} />
        </div>
      )}

      {deleteProvider && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-courier-title">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0b1b27] p-5 shadow-2xl">
            <h3 id="delete-courier-title" className="text-lg font-black">حذف ربط {deleteProvider === "anderson" ? "Anderson" : "DHD / Ecotrack"}؟</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">سيتم حذف بيانات الربط المشفّرة لهذه الشركة فقط. لن تتأثر إعدادات الشركة الأخرى أو الطلبات وسجلات الشحنات الموجودة.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={deleting} onClick={() => setDeleteProvider(null)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold">إلغاء</button>
              <button type="button" disabled={deleting} onClick={() => void removeIntegration()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50">{deleting ? "جارٍ الحذف..." : "تأكيد الحذف"}</button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="courier-modal-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="my-auto max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#0b1b27] p-4 text-slate-100 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="courier-modal-title" className="text-xl font-black">ربط / إعداد شركة توصيل</h3>
                <p className="mt-1 text-sm text-slate-400">اختر الشركة لعرض حقول الربط الخاصة بها.</p>
              </div>
              <button type="button" aria-label="إغلاق" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1 text-2xl leading-none text-slate-300 hover:bg-slate-800">×</button>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {companies.map((company) => (
                <button key={company.id} type="button" onClick={() => setSelected(company.id)} className={`rounded-xl border p-3 text-right transition ${selected === company.id ? "border-emerald-400 bg-emerald-950/50" : "border-slate-700 bg-slate-900 hover:bg-slate-800"}`}>
                  <span className="block font-bold">{company.name}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{company.baseUrl}</span>
                </button>
              ))}
            </div>

            <div className="mt-5">
              <EcotrackSettingsForm key={selected} provider={selected} />
            </div>

            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => { setOpen(false); void refreshStatus(selected); }} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-white">إغلاق وتحديث الحالة</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
