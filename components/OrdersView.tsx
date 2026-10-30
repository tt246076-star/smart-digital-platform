"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";

type Shipment = {
  id: string;
  carrier: string;
  carrier_label: string | null;
  tracking: string;
  customer_name: string | null;
  phone: string | null;
  product_name: string | null;
  total_price: string | null;
  wilaya: string | null;
  commune: string | null;
  stage: string | null;
  stage_label: string | null;
  stage_at: string | null;
  is_final: boolean;
  carrier_status: string | null;
  payment_status: string | null;
  reason: string | null;
  center_name: string | null;
  office_name: string | null;
  office_address: string | null;
  office_phone: string | null;
  office_map_url: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  updated_at: string;
};

function dateLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusText(row: Shipment) {
  const labels: Record<string, string> = {
    delivered: "تم التسليم",
    returned: "راجع",
    cancelled: "ملغى",
    delivery_attempted: "محاولة توصيل فاشلة",
    out_for_delivery: "خرج للتوصيل",
    in_transit: "في الطريق",
    at_hub: "وصل إلى مركز / مكتب",
    picked_up: "تم الاستلام",
    on_hold: "معلّق",
    unknown: "بانتظار تحديث",
  };
  return row.stage_label || labels[row.stage || "unknown"] || row.stage || "غير معروف";
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

  const loadOrders = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    setError("");
    try {
      const result = await apiGet<Shipment[]>("/api/orders?limit=100");
      setRows(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الشحنات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const stats = useMemo(() => ({
    total: rows.length,
    moving: rows.filter((row) => !row.is_final && row.stage !== "unknown").length,
    delivered: rows.filter((row) => row.stage === "delivered").length,
    returned: rows.filter((row) => row.stage === "returned").length,
  }), [rows]);

  return (
    <section dir="rtl" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black">شحنات Yalidine</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            تتحدث القائمة عند وصول أحداث Webhook وتُقرأ من قاعدة بيانات بطاقتي.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOrders(true)}
          disabled={loading || refreshing}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {refreshing ? "جارٍ التحديث..." : "↻ تحديث القائمة"}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat title="إجمالي الشحنات" value={stats.total} />
        <Stat title="قيد التوصيل" value={stats.moving} />
        <Stat title="تم التسليم" value={stats.delivered} />
        <Stat title="راجع" value={stats.returned} />
      </div>

      {error && (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[1050px] text-right text-sm">
          <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
            <tr>
              <th className="px-3 py-3 font-bold">رقم التتبع</th>
              <th className="px-3 py-3 font-bold">الزبون</th>
              <th className="px-3 py-3 font-bold">الهاتف</th>
              <th className="px-3 py-3 font-bold">المنتج</th>
              <th className="px-3 py-3 font-bold">الولاية / البلدية</th>
              <th className="px-3 py-3 font-bold">الحالة</th>
              <th className="px-3 py-3 font-bold">مركز / مكتب</th>
              <th className="px-3 py-3 font-bold">آخر تحديث</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-12 text-center text-slate-500">جارٍ تحميل الشحنات...</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center">
                  <div className="text-3xl">📦</div>
                  <p className="mt-3 font-extrabold">لم تصل أي شحنات عبر Webhook بعد</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    بعد تسجيل رابط Webhook في حساب Yalidine ووصول أول تحديث، سيظهر رقم التتبع والحالة هنا.
                  </p>
                </td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-3 font-bold text-blue-700 dark:text-blue-300">{row.tracking}</td>
                <td className="px-3 py-3">{row.customer_name || "غير متوفر من حدث Webhook"}</td>
                <td className="px-3 py-3" dir="ltr">{row.phone || "—"}</td>
                <td className="max-w-[240px] px-3 py-3">{row.product_name || "—"}</td>
                <td className="px-3 py-3">{[row.wilaya, row.commune].filter(Boolean).join(" · ") || "—"}</td>
                <td className="px-3 py-3">
                  <span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold " + statusClass(row.stage)}>
                    {statusText(row)}
                  </span>
                  {row.reason && <p className="mt-1 max-w-[200px] text-xs text-amber-700 dark:text-amber-300">{row.reason}</p>}
                </td>
                <td className="px-3 py-3">
                  <p>{row.office_name || row.center_name || "—"}</p>
                  {row.office_address && <p className="mt-1 max-w-[220px] text-xs text-slate-500">{row.office_address}</p>}
                  {row.office_phone && <p className="mt-1 text-xs" dir="ltr">{row.office_phone}</p>}
                  {row.office_map_url && <a className="mt-1 inline-block text-xs font-bold text-blue-600 hover:underline" href={row.office_map_url} target="_blank" rel="noreferrer">موقع المكتب</a>}
                </td>
                <td className="px-3 py-3 text-xs text-slate-500">{dateLabel(row.stage_at || row.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
        ملاحظة: Webhook الحالة لا يرسل دائمًا اسم الزبون ورقم هاتفه والمنتج؛ هذه المعلومات تحتاج استيرادًا أوليًا من API الطرود أو ربطها بطلبات المتجر.
      </p>
    </section>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}
