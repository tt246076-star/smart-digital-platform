"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Row = Record<string, unknown> & { tracking: string; statusText: string; statusKey: string };
const filters = [
  { key: "all", label: "كل الطرود" },
  { key: "preparing", label: "قيد التحضير" },
  { key: "pickup", label: "في انتظار الإنتقاط" },
  { key: "hub", label: "إلى المركز" },
  { key: "moving", label: "التوصيلات الجارية" },
  { key: "hold", label: "المعلقة" },
  { key: "returning", label: "الطرود قيد الإرجاع" },
  { key: "returned", label: "الطرود المرجعة" },
  { key: "payment_pending", label: "تحصيل غير مسوّى" },
  { key: "delivered", label: "التوصيلات التامة" },
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function first(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
}
function text(value: unknown) { return value === null || value === undefined ? "" : String(value); }

function field(record: Record<string, unknown>, keys: string[]) {
  const sources = [
    record,
    asRecord(record.OrderInfo),
    asRecord(record.order),
    asRecord(record.data),
    asRecord(record.recipient),
    asRecord(record.customer),
    asRecord(record.client),
    asRecord(record.destination),
  ].filter(Boolean) as Record<string, unknown>[];
  for (const source of sources) {
    const value = first(source, keys);
    if (value !== null) return value;
  }
  return null;
}

function findRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.map(asRecord).filter((v): v is Record<string, unknown> => Boolean(v));
  const obj = asRecord(payload);
  if (!obj) return [];
  for (const key of ["orders", "parcels", "shipments", "results", "data", "result"]) {
    if (obj[key] !== undefined) {
      const nested = findRows(obj[key]);
      if (nested.length || Array.isArray(obj[key])) return nested;
    }
  }
  return [];
}
function classify(status: string): string {
  const s = status
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[\s-]+/g, "_");

  // EcoTrack order-state values: return progress and financial settlement
  // are kept separate from successful delivery.
  if (/retour.*(traitement|cours|dispatched|transmis|expedie)|return.*(process|transit|dispatch)/.test(s)) return "returning";
  if (/retour.*(recu|stock)|return.*(received|returned)|returned|راجع|ارجاع|مرتجع/.test(s)) return "returned";
  if (/encaisse.*non.*paye|collected.*unpaid|cash.*unpaid/.test(s)) return "payment_pending";
  if (/annul|cancel/.test(s)) return "cancelled";
  if (/livre|deliver|تم_التسليم/.test(s) && !/out_for|out_for_delivery|جاري/.test(s)) return "delivered";
  if (/echec|failed|absent|injoignable|refus|delivery_attempt/.test(s)) return "failed";
  if (/hold|pending|suspend|معلق|en_attente/.test(s)) return "hold";
  if (/out_for_delivery|delivery|distribut|توصيل|livraison|جاري/.test(s)) return "moving";
  if (/hub|center|centre|مركز|مكتب|arriv/.test(s)) return "hub";
  if (/pickup|pick_up|ramass|انتقاط|التقاط|استلام/.test(s)) return "pickup";
  if (/prepar|prepare|قيد_التحضير|new|created/.test(s)) return "preparing";
  return "other";
}
function normalized(payload: unknown): Row[] {
  return findRows(payload).map((item, index) => {
    const tracking = text(field(item, ["tracking", "tracking_number", "tracking_code", "code_suivi", "tracking_id", "reference"]));
    const statusText = text(field(item, ["status", "status_label", "state", "etat", "statut", "last_status", "order_status"]) || "غير معروف");
    const customerName = field(item, ["name", "client", "nom_client", "nom", "customer_name", "receiver", "client_name", "destinataire", "recipientName", "recipient_name", "full_name"]);
    const customerPhone = field(item, ["phone", "telephone", "customer_phone", "receiver_phone", "phone_client", "telephone_client", "telephone_1", "phone1", "gsm"]);
    const wilaya = field(item, ["wilaya", "wilaya_name", "wilayaName", "destination_wilaya", "destinationWilaya", "dest_wilaya", "code_wilaya", "wilaya_id", "originCity", "destLocationCity"]);
    const commune = field(item, ["commune", "commune_name", "communeName", "destination_commune", "destinationCommune", "dest_commune", "destCommune", "municipality"]);
    return {
      ...item,
      tracking,
      statusText,
      statusKey: classify(statusText),
      customerName,
      customerPhone,
      wilaya,
      commune,
      _key: tracking || text(field(item, ["id", "order_id"])) || String(index),
    };
  }).filter((item) => item.tracking);
}
function label(key: string) { return filters.find((f) => f.key === key)?.label || "حالة أخرى"; }
function dateLabel(value: unknown) {
  if (!value) return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? text(value) : new Intl.DateTimeFormat("ar-DZ", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "غير متوفر من شركة التوصيل";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
function pickNested(payload: unknown, keys: string[]) {
  const root = asRecord(payload);
  if (!root) return null;
  const candidates = [root, asRecord(root.data), asRecord(root.result), asRecord(root.tracking), asRecord(root.order)].filter(Boolean) as Record<string, unknown>[];
  for (const obj of candidates) {
    const v = first(obj, keys);
    if (v !== null) return v;
  }
  return null;
}
function historyRows(payload: unknown): Record<string, unknown>[] {
  const root = asRecord(payload);
  if (!root) return [];
  for (const obj of [root, asRecord(root.data), asRecord(root.result), asRecord(root.tracking), asRecord(root.order)]) {
    if (!obj) continue;
    const value = first(obj, ["historique", "history", "events", "activity", "tracking_history", "tracking_info", "operations", "movements"]);
    if (Array.isArray(value)) return value.map(asRecord).filter((v): v is Record<string, unknown> => Boolean(v));
  }
  return [];
}

function courierPhoneFromOrder(order: Row | null) {
  if (!order) return null;
  const direct = first(order, [
    "driver_phone", "driverPhone", "livreur_phone", "livreurPhone", "phone_livreur",
    "telephone_livreur", "telephoneLivreur", "tel_livreur", "numero_livreur",
    "courier_phone", "courierPhone", "delivery_phone", "deliveryPhone",
    "distributor_phone", "distributorPhone", "driver_mobile", "livreur_mobile",
  ]);
  if (direct) return direct;

  for (const [key, value] of Object.entries(order)) {
    if (!/(driver|livreur|courier|delivery|distributor|rider)/i.test(key)) continue;
    if (!/(phone|tel|mobile|gsm|numero|number|num)/i.test(key)) continue;
    if (value !== null && value !== undefined && String(value).trim()) return value;
    const nested = asRecord(value);
    const nestedPhone = nested ? first(nested, ["phone", "tel", "telephone", "mobile", "gsm", "numero", "number"]) : null;
    if (nestedPhone) return nestedPhone;
  }
  for (const key of ["driver", "livreur", "courier", "delivery_man", "distributor", "rider"]) {
    const nested = asRecord(order[key]);
    const nestedPhone = nested ? first(nested, ["phone", "tel", "telephone", "mobile", "gsm", "numero", "number"]) : null;
    if (nestedPhone) return nestedPhone;
  }
  return null;
}

function destinationLabel(order: Row | null) {
  if (!order) return null;
  const commune = first(order, [
    "destination_commune", "destinationCommune", "dest_commune", "destCommune",
    "commune", "commune_name", "communeName", "destLocation", "destination",
  ]);
  const wilaya = first(order, [
    "destination_wilaya", "destinationWilaya", "dest_wilaya", "destWilaya",
    "wilaya", "wilaya_name", "wilayaName", "province",
  ]);
  const parts = [commune, wilaya, "Algérie"].filter((value) => value !== null && value !== undefined && String(value).trim());
  return parts.length > 1 ? parts.map(text).join(", ") : parts.length === 1 ? `${text(parts[0])}, Algérie` : null;
}

export default function OrdersView({ provider = "dhd" }: { provider?: "dhd" | "anderson" }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [details, setDetails] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [providerPayload, setProviderPayload] = useState<unknown>(null);

  const loadOrders = useCallback(async (nextPage = page, manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ecotrack/orders?provider=${provider}&page=${nextPage}&start_date=2024-01-01&end_date=2026-12-31`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "تعذر جلب قائمة الطرود");
      setProviderPayload(body.data);
      setRows(normalized(body.data));
      setPage(nextPage);
      setLastSync(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر جلب قائمة الطرود");
      setRows([]);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [page, provider]);

  useEffect(() => { void loadOrders(1); }, [provider]); // Reload when the selected courier changes.
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return rows.filter((row) => (filter === "all" || row.statusKey === filter) &&
      (!q || [row.tracking, row.statusText, row.customerName, row.customerPhone, row.wilaya, row.commune].some(v => text(v).toLocaleLowerCase().includes(q))));
  }, [rows, query, filter]);
  const counts = useMemo(() => Object.fromEntries(filters.map(f => [f.key, f.key === "all" ? rows.length : rows.filter(r => r.statusKey === f.key).length])), [rows]);

  const openTracking = async (row: Row) => {
    setSelected(row); setDetails(null); setDetailError(""); setDetailLoading(true);
    try {
      const res = await fetch(`/api/ecotrack/tracking?provider=${provider}&tracking=${encodeURIComponent(row.tracking)}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "تعذر جلب تفاصيل الطرد");
      setDetails(body.data);
    } catch (e) { setDetailError(e instanceof Error ? e.message : "تعذر جلب تفاصيل الطرد"); }
    finally { setDetailLoading(false); }
  };

  const currentStation = pickNested(details, ["currentStation", "bureau_actuel", "current_office", "office", "bureau", "current_station", "station"]);
  const history = historyRows(details);
  const driverFromHistory = [...history].reverse()
    .map((event) => first(event, ["driver", "livreur", "delivery_agent", "distributor"]))
    .find((value) => value !== null) ?? null;
  const driverName = pickNested(details, ["livreur", "driver", "delivery_agent", "distributor"]) || driverFromHistory;
  const office = asRecord(currentStation);
  const driver = asRecord(driverName);
  const latestReason = [...history].reverse()
    .map((event) => first(event, ["reason", "details", "content"]))
    .find((value) => value !== null) ?? pickNested(details, ["retour_raison", "return_reason", "reason"]);


  return <section dir="rtl" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-black">{provider === "anderson" ? "تتبع طرود Anderson Delivery" : "تتبع طرود DHD / Ecotrack"}</h2><p className="mt-1 text-sm text-slate-500">القائمة تجي مباشرة من API الشركة. آخر تحديث: {dateLabel(lastSync)}</p></div>
      <button onClick={() => void loadOrders(page, true)} disabled={loading || refreshing} className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50 dark:border-slate-700">{refreshing ? "جارٍ التحديث…" : "↻ تحديث"}</button>
    </div>
    <div className="mt-5 flex flex-wrap gap-2">
      {filters.map(f => <button key={f.key} onClick={() => setFilter(f.key)} className={"rounded-full border px-3 py-2 text-sm font-bold " + (filter === f.key ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800")}>{f.label} <span className="mr-1 opacity-75">({counts[f.key] ?? 0})</span></button>)}
    </div>
    <div className="mt-4 flex flex-wrap gap-3">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث برقم التتبع، الحالة، الزبون أو الهاتف…" className="min-w-[230px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
      <button onClick={() => void loadOrders(page + 1)} disabled={loading || refreshing} className="rounded-xl border px-4 py-3 text-sm font-bold dark:border-slate-700">الصفحة التالية ←</button>
      {page > 1 && <button onClick={() => void loadOrders(page - 1)} disabled={loading || refreshing} className="rounded-xl border px-4 py-3 text-sm font-bold dark:border-slate-700">→ السابقة</button>}
    </div>
    {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</div>}
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[720px] text-right text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800"><tr>{["رقم التتبع","الحالة من الشركة","الزبون","الهاتف","الولاية / البلدية","التفاصيل"].map(h => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={6} className="px-3 py-12 text-center">جارٍ جلب الطرود من شركة التوصيل…</td></tr>
          : filtered.length === 0 ? <tr><td colSpan={6} className="px-3 py-12 text-center text-slate-500">{error ? "تعذر تحميل القائمة؛ راجع رسالة الخطأ أعلاه." : "ما كاين حتى طرد في نتائج هذي الصفحة أو الفلتر."}</td></tr>
          : filtered.map((row, i) => <tr key={String(row._key || i)} className="border-t border-slate-100 dark:border-slate-800">
            <td className="px-3 py-3 font-black text-blue-700 dark:text-blue-300" dir="ltr">{row.tracking}</td>
            <td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold dark:bg-slate-800">{row.statusText}</span><p className="mt-1 text-xs text-slate-500">{label(row.statusKey)}</p></td>
            <td className="px-3 py-3">{display(row.customerName)}</td>
            <td className="px-3 py-3" dir="ltr">{display(row.customerPhone)}</td>
            <td className="px-3 py-3">{[row.wilaya, row.commune].filter(Boolean).map(text).join(" · ") || "—"}</td>
            <td className="px-3 py-3"><button onClick={() => void openTracking(row)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-extrabold text-white">تفاصيل وسجل الحركة</button></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    {selected && <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black">الطرد {selected.tracking}</h3><button onClick={() => { setSelected(null); setDetails(null); }} className="rounded-lg border px-3 py-1.5 text-sm dark:border-slate-700">إغلاق</button></div>
      {detailLoading && <p className="mt-4 text-sm">جارٍ جلب تفاصيل الطرد وسجل الحركة…</p>}
      {detailError && <p role="alert" className="mt-4 rounded-xl bg-red-100 p-3 text-sm font-bold text-red-800 dark:bg-red-950 dark:text-red-200">{detailError}</p>}
      {details !== null && details !== undefined && <>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Detail title="المكتب / المحطة الحالية" value={first(office || {}, ["nom", "name", "office_name", "label"]) || currentStation} />
          <Detail title="هاتف المكتب" value={first(office || {}, ["tel", "phone", "telephone", "office_phone", "currentStationPhone"])} />
          <Detail title="GPS المكتب (من بيانات الشركة)" value={first(office || {}, ["gps", "coordinates", "location", "map_url", "google_maps_url"])} link />
          <Detail title="الموزّع" value={first(driver || {}, ["nom", "name", "driver_name", "label"]) || driverName} />
          <Detail title="هاتف الموزّع" value={first(driver || {}, ["tel", "phone", "telephone", "driver_phone", "mobile", "gsm"]) || courierPhoneFromOrder(selected)} />
          <Detail title="موقع وجهة الطرد (تقريبي)" value={destinationLabel(selected)} link />
          <Detail title="آخر سبب أو تعليق مسجل" value={latestReason} />
        </div>
        <h4 className="mt-5 font-black">سجل الحركة</h4>
        {history.length ? <ol className="mt-3 space-y-2">{history.map((event, i) => {
          const rawStatus = text(first(event, ["status", "operation", "event", "label", "description", "action"]));
          const statusNames: Record<string, string> = {
            order_information_received_by_carrier: "استلمت شركة التوصيل معلومات الطلب",
            accepted_by_carrier: "استلمت شركة التوصيل الطرد",
            dispatched_to_driver: "تم إرسال الطرد إلى الموزّع",
            attempt_delivery: "محاولة توصيل",
            returned: "تم إرجاع الطرد",
            delivered: "تم تسليم الطرد",
          };
          const eventDate = [first(event, ["date", "created_at", "datetime", "date_operation"]), first(event, ["time"])].filter(Boolean).map(text).join(" · ");
          const station = first(event, ["station", "lieu", "location", "bureau"]);
          const driverOnEvent = first(event, ["driver", "livreur"]);
          const reason = first(event, ["reason", "details", "content"]);
          return <li key={i} className="rounded-xl bg-white p-3 text-sm dark:bg-slate-900">
            <p className="font-bold">{statusNames[rawStatus] || rawStatus || "تحديث حالة"}</p>
            {eventDate && <p className="mt-1 text-xs text-slate-500">{eventDate}</p>}
            {station && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">المحطة: {text(station)}</p>}
            {driverOnEvent && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">الموزّع: {text(driverOnEvent)}</p>}
            {reason && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">ملاحظة: {text(reason)}</p>}
            {first(event, ["scanLocation"]) && <p className="mt-1 text-xs text-slate-500">مكان المسح: {text(first(event, ["scanLocation"]))}</p>}
          </li>;
        })}</ol> : <p className="mt-2 rounded-xl bg-white p-3 text-sm text-slate-500 dark:bg-slate-900">الشركة لم ترجع سجل حركة قابلًا للعرض في الاستجابة.</p>}
        <details className="mt-4"><summary className="cursor-pointer text-xs font-bold text-slate-500">عرض حقول الاستجابة الأصلية (للتشخيص)</summary><pre className="mt-2 max-h-80 overflow-auto rounded-xl bg-slate-950 p-3 text-left text-xs text-slate-100" dir="ltr">{JSON.stringify(details, null, 2)}</pre></details>
      </>}
    </div>}
    <p className="mt-4 text-xs leading-6 text-slate-500">الحالات المعروضة تُصنّف من النص الذي ترجعه الشركة، وقد تحتاج بعض الحالات إلى مطابقة أدق حسب شكل استجابة API الفعلي. لا يتم إنشاء بيانات تجريبية.</p>
  </section>;
}

function Detail({ title, value, link = false }: { title: string; value: unknown; link?: boolean }) {
  const shown = value === null || value === undefined || value === "" ? "غير متوفر من شركة التوصيل" : display(value);
  const href = link && value ? (String(value).startsWith("http") ? String(value) : `https://maps.google.com/?q=${encodeURIComponent(String(value))}`) : null;
  return <div className="rounded-xl bg-white p-3 dark:bg-slate-900"><p className="text-xs font-bold text-slate-500">{title}</p>{href ? <a href={href} target="_blank" rel="noreferrer" className="mt-1 block break-words text-sm font-semibold text-blue-700 underline dark:text-blue-300">{shown} · فتح الخريطة</a> : <p className="mt-1 break-words text-sm font-semibold">{shown}</p>}</div>;
}
