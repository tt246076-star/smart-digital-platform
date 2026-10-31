"use client";

import { useEffect, useState } from "react";
import EcotrackSettingsForm from "@/components/EcotrackSettingsForm";

type Provider = { id: string; name: string; detail: string; supported: boolean };

const providers: Provider[] = [
  { id: "dhd", name: "DHD / Ecotrack", detail: "إعدادات الربط الحالية", supported: true },
  { id: "anderson", name: "Anderson", detail: "يلزم اعتماد API الرسمي قبل تفعيل الربط", supported: false },
  { id: "z", name: "Z Express", detail: "يلزم اعتماد API الرسمي قبل تفعيل الربط", supported: false },
];

export default function DeliveryCompaniesPanel() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("dhd");
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refreshStatus() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/ecotrack/settings", { cache: "no-store" });
      const data = await response.json();
      setConfigured(Boolean(response.ok && data.configured));
    } catch {
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refreshStatus(); }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">شركات التوصيل</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">إدارة إعدادات شركات التوصيل من مكان واحد.</p>
        </div>
        <button type="button" onClick={() => { setSelected("dhd"); setOpen(true); }} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-700">
          + إضافة شركة التوصيل
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const isDhd = provider.id === "dhd";
          const active = isDhd && configured;
          return (
            <div key={provider.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500 dark:bg-slate-800"}`}>
                {active ? "✓" : "🚚"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{provider.name}</div>
                <div className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {loading && isDhd ? "جارٍ التحقق..." : active ? "الإعدادات محفوظة" : provider.detail}
                </div>
              </div>
              {isDhd && <button type="button" onClick={() => { setSelected("dhd"); setOpen(true); }} className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">إعدادات</button>}
              {!isDhd && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">غير مفعّل</span>}
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="delivery-modal-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="delivery-modal-title" className="text-xl font-black">إضافة / إعداد شركة توصيل</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">اختر الشركة لعرض الإعدادات المتاحة.</p>
              </div>
              <button type="button" aria-label="إغلاق" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1 text-2xl leading-none hover:bg-slate-100 dark:hover:bg-slate-800">×</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {providers.map((provider) => (
                <button key={provider.id} type="button" onClick={() => setSelected(provider.id)} className={`rounded-xl border p-3 text-right transition ${selected === provider.id ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" : "border-slate-200 dark:border-slate-700"}`}>
                  <span className="block font-bold">{provider.name}</span>
                  <span className="mt-1 block text-xs text-slate-500">{provider.supported ? "متاح للإعداد" : "قريباً — يتطلب تكاملاً برمجياً"}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              {selected === "dhd" ? (
                <EcotrackSettingsForm />
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  <p className="font-extrabold">هذا الربط غير مفعّل بعد</p>
                  <p className="mt-1">ما نقدرش نتحقق من الاتصال أو نحفظ الشركة كأنها مربوطة قبل إضافة API الرسمي واختبار المصادقة وجلب الشحنات. إعدادات DHD الحالية تبقى محفوظة كما هي.</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setOpen(false); void refreshStatus(); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white dark:bg-slate-100 dark:text-slate-900">إغلاق وتحديث الحالة</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
