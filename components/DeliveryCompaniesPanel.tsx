"use client";

import { useEffect, useState } from "react";
import EcotrackSettingsForm from "@/components/EcotrackSettingsForm";

type ProviderId = "dhd" | "anderson" | "z";

const providers: Array<{ id: ProviderId; name: string; description: string }> = [
  { id: "dhd", name: "DHD / Ecotrack", description: "إعداد API Token ورابط المنصة" },
  { id: "anderson", name: "Anderson", description: "يتطلب تكامل API رسمي قبل التفعيل" },
  { id: "z", name: "Z Express", description: "يتطلب تكامل API رسمي قبل التفعيل" },
];

export default function DeliveryCompaniesPanel() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ProviderId>("dhd");
  const [configured, setConfigured] = useState(false);
  const [baseUrl, setBaseUrl] = useState("https://platform.dhd-dz.com");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [origin, setOrigin] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function refreshStatus() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/ecotrack/settings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تحميل حالة الربط");
      setConfigured(Boolean(data.configured));
      if (typeof data.baseUrl === "string" && data.baseUrl) setBaseUrl(data.baseUrl);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر تحميل حالة الربط");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    void refreshStatus();
  }, []);

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`تم نسخ ${label}.`);
    } catch {
      setNotice("تعذر النسخ تلقائياً. انسخ الرابط يدوياً.");
    }
  }

  async function removeIntegration() {
    setDeleting(true);
    try {
      const response = await fetch("/api/admin/ecotrack/settings", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر حذف الإعدادات");
      setConfigured(false);
      setConfirmDelete(false);
      setNotice("تم حذف إعدادات DHD من المنصة.");
      await refreshStatus();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "تعذر حذف الإعدادات");
    } finally {
      setDeleting(false);
    }
  }

  const webhookUrl = `${origin || "https://bitaqati.online"}/api/webhook/yalidine`;

  return (
    <section dir="rtl" className="rounded-3xl border border-slate-800 bg-[#07131d] p-4 text-slate-100 shadow-2xl sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">شركات التوصيل 🚚</h2>
          <p className="mt-1 text-sm text-slate-400">إدارة روابط الربط وإعدادات شركات الشحن من مكان واحد.</p>
        </div>
        <button
          type="button"
          onClick={() => { setSelected("dhd"); setOpen(true); setNotice(""); }}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400"
        >
          + ربط شركة توصيل
        </button>
      </div>

      {notice && (
        <div role="status" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="text-slate-400 hover:text-white" aria-label="إغلاق التنبيه">×</button>
        </div>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1b27] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950 text-2xl">🚚</span>
              <div>
                <h3 className="font-black">DHD / Ecotrack</h3>
                <p className="mt-0.5 text-xs text-slate-400">ربط API لشركة التوصيل</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${loading ? "bg-slate-700 text-slate-200" : configured ? "bg-emerald-950 text-emerald-300" : "bg-amber-950 text-amber-200"}`}>
              {loading ? "جارٍ التحقق..." : configured ? "● الإعدادات محفوظة" : "● غير مربوط"}
            </span>
          </div>

          <div className="mt-5 rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-950/80 to-indigo-950/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-violet-100">رابط منصة الشركة (API)</h4>
              <span className="text-violet-300">↗</span>
            </div>
            <p dir="ltr" className="mt-3 break-all rounded-lg bg-slate-950/70 px-3 py-3 text-left font-mono text-sm text-violet-100">{baseUrl}</p>
            <p className="mt-2 text-xs leading-6 text-violet-200/80">هذا عنوان المنصة المحفوظ، وليس مفتاح API. المفتاح نفسه لا يظهر في البطاقة.</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-700 pt-4">
            <button type="button" onClick={() => { setSelected("dhd"); setOpen(true); setNotice(""); }} className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400">✎ إعدادات / تعديل</button>
            <button type="button" onClick={() => void copyValue(baseUrl, "رابط المنصة")} className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">نسخ الرابط</button>
            {configured && <button type="button" onClick={() => setConfirmDelete(true)} className="mr-auto rounded-lg border border-rose-900/70 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-950/50">حذف الربط</button>}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1b27] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-950 text-2xl">🔗</span>
              <div>
                <h3 className="font-black">Yalidine Webhook</h3>
                <p className="mt-0.5 text-xs text-slate-400">استقبال تحديثات حالة الطرود</p>
              </div>
            </div>
            <span className="rounded-full bg-amber-950 px-3 py-1 text-xs font-extrabold text-amber-200">يتطلب إعداد سر التوقيع</span>
          </div>
          <div className="mt-5 rounded-xl border border-violet-500/40 bg-gradient-to-br from-violet-950/80 to-indigo-950/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-violet-100">رابط الـ Webhook</h4>
              <span className="text-violet-300">↗</span>
            </div>
            <p dir="ltr" className="mt-3 break-all rounded-lg bg-slate-950/70 px-3 py-3 text-left font-mono text-sm text-violet-100">{webhookUrl}</p>
            <p className="mt-2 text-xs leading-6 text-violet-200/80">لاستقبال الأحداث بأمان، يجب إعداد YALIDINE_WEBHOOK_SECRET على السيرفر والتحقق من توقيع الشركة.</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-700 pt-4">
            <button type="button" onClick={() => void copyValue(webhookUrl, "رابط Webhook")} className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400">نسخ رابط Webhook</button>
            <span className="text-xs text-slate-500">المسار مخصص حالياً لـ Yalidine فقط.</span>
          </div>
        </article>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-courier-title">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0b1b27] p-5 shadow-2xl">
            <h3 id="delete-courier-title" className="text-lg font-black">حذف ربط DHD / Ecotrack؟</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">سيتم حذف بيانات الربط المشفّرة من المنصة. لن تتأثر الطلبات أو سجلات الشحنات الموجودة.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={deleting} onClick={() => setConfirmDelete(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold">إلغاء</button>
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
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {providers.map((provider) => (
                <button key={provider.id} type="button" onClick={() => setSelected(provider.id)} className={`rounded-xl border p-3 text-right transition ${selected === provider.id ? "border-emerald-400 bg-emerald-950/50" : "border-slate-700 bg-slate-900 hover:bg-slate-800"}`}>
                  <span className="block font-bold">{provider.name}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">{provider.description}</span>
                </button>
              ))}
            </div>
            <div className="mt-5">
              {selected === "dhd" ? (
                <EcotrackSettingsForm />
              ) : (
                <div className="rounded-xl border border-amber-800/70 bg-amber-950/40 p-4 text-sm leading-7 text-amber-100">
                  <p className="font-black">{providers.find((provider) => provider.id === selected)?.name} غير مفعّلة بعد</p>
                  <p className="mt-1">ما نعرضوش اتصالاً وهمياً. يلزم إضافة API الرسمي للشركة، ثم اختبار المصادقة وإرسال/قراءة الشحنات قبل حفظها كربط فعّال.</p>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => { setOpen(false); void refreshStatus(); }} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-950 hover:bg-white">إغلاق وتحديث الحالة</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
