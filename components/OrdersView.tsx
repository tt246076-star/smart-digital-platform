"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";

type Shipment = {
  id: string; carrier: string; carrier_label: string | null; tracking: string;
  customer_name: string | null; phone: string | null; product_name: string | null;
  total_price: string | null; wilaya: string | null; commune: string | null;
  stage: string | null; stage_label: string | null; stage_at: string | null;
  is_final: boolean; carrier_status: string | null; payment_status: string | null;
  reason: string | null; center_name: string | null; office_name: string | null;
  office_address: string | null; office_phone: string | null; office_map_url: string | null;
  driver_name: string | null; driver_phone: string | null; updated_at: string;
};

const labels: Record<string, string> = {
  delivered: "تم التسليم", returned: "راجع", cancelled: "ملغى",
  delivery_attempted: "محاولة توصيل فاشلة", out_for_delivery: "خرج للتوصيل",
  in_transit: "في الطريق", at_hub: "وصل إلى مركز / مكتب",
  picked_up: "تم الاستلام", on_hold: "معلّق", unknown: "بانتظار تحديث",
};

function dateLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-DZ", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
function statusClass(status: string | null) {
  if (status === "delivered") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  if (status === "returned" || status === "cancelled") return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
  if (status === "delivery_attempted" || status === "on_hold") return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
  return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
}

export default function OrdersView() {
  const [rows, setRows] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadOrders = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const result = await apiGet<Shipment[]>("/api/orders?limit=200");
      setRows(Array.isArray(result) ? result : []);
      setLastSync(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الشحنات");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
    const timer = window.setInterval(() => { void loadOrders(true); }, 60_000);
    return () => window.clearInterval(timer);
  }, [loadOrders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.stage !== statusFilter) return false;
      if (carrierFilter !== "all" && row.carrier !== carrierFilter) return false;
      if (!q) return true;
      return [row.tracking, row.customer_name, row.phone, row.product_name, row.wilaya, row.commune,
        row.office_name, row.center_name, row.driver_name].some((value) => String(value || "").toLocaleLowerCase().includes(q));
    });
  }, [rows, query, statusFilter, carrierFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    moving: rows.filter((r) => !r.is_final && r.stage !== "unknown").length,
    delivered: rows.filter((r) => r.stage === "delivered").length,
    attempted: rows.filter((r) => r.stage === "delivery_attempted").length,
  }), [rows]);

  const carriers = useMemo(() => [...new Set(rows.map((r) => r.carrier).filter(Boolean))], [rows]);
  const active = rows.find((row) => row.id === selected) || null;

  return (
    <section dir="rtl" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black">كل الشحنات</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">تتحدث القائمة تلقائياً كل دقيقة، ويمكنك تحديثها يدوياً.</p>
        </div>
        <button type="button" onClick={() => void loadOrders(true)} disabled={loading || refreshing}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800">
          {refreshing ? "جارٍ التحديث..." : "↻ تحديث الآن"}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat title="إجمالي الشحنات" value={stats.total} />
        <Stat title="قيد المعالجة" value={stats.moving} />
        <Stat title="تم التسليم" value={stats.delivered} />
        <Stat title="محاولات فاشلة" value={stats.attempted} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_190px_190px]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-500">بحث في الشحنات</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="رقم التتبع، اسم الزبون، الهاتف، الولاية..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-500">الحالة</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
            <option value="all">كل الحالات</option>
            {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-500">شركة التوصيل</span>
          <select value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
            <option value="all">كل الشركات</option>
            {carriers.map((carrier) => <option key={carrier} value={carrier}>{carrier}</option>)}
          </select>
        </label>
      </div>

      {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</div>}

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[1120px] text-right text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
            <tr>{["رقم التتبع","شركة التوصيل","الزبون","الهاتف","الولاية / البلدية","الحالة","المكتب / السائق","آخر تحديث",""].map((h) => <th key={h} className="px-3 py-3 font-bold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? <tr><td colSpan={9} className="px-3 py-12 text-center text-slate-500">جارٍ تحميل الشحنات...</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={9} className="px-3 py-12 text-center">
                <div className="text-3xl">📦</div>
                <p className="mt-3 font-extrabold">{rows.length === 0 ? "لا توجد شحنات مسجلة في قاعدة البيانات بعد" : "لا توجد نتائج مطابقة"}</p>
                <p className="mt-1 text-xs leading-6 text-slate-500">{rows.length === 0 ? "ستظهر الشحنات بعد ربط مصدر بيانات الشركة وإتمام أول مزامنة أو استقبال Webhook." : "غيّر كلمات البحث أو عوامل التصفية."}</p>
              </td></tr>
            : filtered.map((row) => <tr key={row.id} className={"border-t border-slate-100 dark:border-slate-800 " + (selected === row.id ? "bg-blue-50/60 dark:bg-blue-950/20" : "")}>
                <td className="px-3 py-3 font-bold text-blue-700 dark:text-blue-300">{row.tracking}</td>
                <td className="px-3 py-3">{row.carrier_label || row.carrier}</td>
                <td className="px-3 py-3">{row.customer_name || "—"}</td>
                <td className="px-3 py-3" dir="ltr">{row.phone || "—"}</td>
                <td className="px-3 py-3">{[row.wilaya,row.commune].filter(Boolean).join(" · ") || "—"}</td>
                <td className="px-3 py-3"><span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold " + statusClass(row.stage)}>{row.stage_label || labels[row.stage || "unknown"] || row.stage || "غير معروف"}</span>
                  {row.reason && <p className="mt-1 max-w-[180px] text-xs text-amber-700 dark:text-amber-300">{row.reason}</p>}
                </td>
                <td className="px-3 py-3"><p>{row.office_name || row.center_name || "—"}</p>{row.driver_name && <p className="mt-1 text-xs text-slate-500">الموزّع: {row.driver_name}</p>}</td>
                <td className="px-3 py-3 text-xs text-slate-500">{dateLabel(row.stage_at || row.updated_at)}</td>
                <td className="px-3 py-3"><button type="button" onClick={() => setSelected(selected === row.id ? null : row.id)} className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">{selected === row.id ? "إغلاق" : "التفاصيل"}</button></td>
              </tr>)}
          </tbody>
        </table>
      </div>

      {active && <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black">تفاصيل الشحنة · {active.tracking}</h3><span className="text-xs text-slate-500">آخر مزامنة للوحة: {dateLabel(lastSync)}</span></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail title="المنتج والمبلغ" value={[active.product_name, active.total_price ? active.total_price + " دج" : null].filter(Boolean).join(" · ")} />
          <Detail title="حالة الدفع" value={active.payment_status} />
          <Detail title="المركز" value={active.center_name} />
          <Detail title="اسم المكتب" value={active.office_name} />
          <Detail title="عنوان المكتب" value={active.office_address} />
          <Detail title="هاتف المكتب" value={active.office_phone} direction="ltr" />
          <Detail title="اسم الموزّع" value={active.driver_name} />
          <Detail title="هاتف الموزّع" value={active.driver_phone} direction="ltr" />
          <Detail title="سبب آخر تحديث" value={active.reason} />
        </div>
        {active.office_map_url && <a href={active.office_map_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">فتح موقع المكتب على الخريطة</a>}
      </div>}

      <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">البيانات المعروضة هي الشحنات التي وصلت فعلياً إلى قاعدة بيانات بطاقتي؛ هذه الصفحة لا تدّعي استيراد طرود حساب الشركة قبل تفعيل واجهة الجلب الرسمية.</p>
    </section>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800"><p className="text-xs font-bold text-slate-500 dark:text-slate-400">{title}</p><p className="mt-2 text-2xl font-black tabular-nums">{value}</p></div>;
}
function Detail({ title, value, direction }: { title: string; value: string | null | undefined; direction?: "ltr" }) {
  return <div className="rounded-xl bg-white/80 p-3 dark:bg-slate-900/70"><p className="text-xs font-bold text-slate-500">{title}</p><p dir={direction} className="mt-1 break-words text-sm font-semibold">{value || "غير متوفر من شركة التوصيل"}</p></div>;
}
