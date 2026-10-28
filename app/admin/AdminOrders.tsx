"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Order = {
  id: string; page_id: string; customer_name: string; customer_phone: string; customer_address: string;
  items: Array<{name?:string;price?:string;quantity?:number}>; total_amount: number | null;
  status: "new" | "confirmed" | "shipped" | "completed" | "cancelled"; notes: string; created_at: string;
  landing_pages?: { business_name?: string; slug?: string } | Array<{ business_name?: string; slug?: string }> | null;
};
const statusLabels: Record<Order["status"],string> = {new:"طلب جديد",confirmed:"تم التأكيد",shipped:"خرج للتوصيل",completed:"مكتمل",cancelled:"ملغي"};
const statusStyles: Record<Order["status"],string> = {new:"bg-amber-100 text-amber-800",confirmed:"bg-blue-100 text-blue-800",shipped:"bg-violet-100 text-violet-800",completed:"bg-emerald-100 text-emerald-800",cancelled:"bg-slate-100 text-slate-600"};

export default function AdminOrders({ initialOrders }: { initialOrders: Order[] }) {
  const [orders,setOrders] = useState(initialOrders);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const knownIds = useRef(new Set(initialOrders.map(o=>o.id)));
  const firstPoll = useRef(true);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تحميل الطلبات");
      const fresh: Order[] = data.orders || [];
      if (!firstPoll.current) {
        const newOrders = fresh.filter(o => !knownIds.current.has(o.id));
        if (newOrders.length) {
          setNotice(`وصل ${newOrders.length} طلب جديد!`);
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("طلب جديد على بطاقتي", { body: newOrders.map(o=>o.customer_name).join("، ") });
          }
        }
      }
      firstPoll.current = false;
      fresh.forEach(o=>knownIds.current.add(o.id));
      setOrders(fresh); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر تحميل الطلبات"); }
    finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => { void refresh(true); }, 15000);
    return () => window.clearInterval(id);
  }, [refresh]);

  async function changeStatus(orderId: string, status: Order["status"]) {
    setError("");
    try {
      const response = await fetch("/api/admin/orders", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({orderId,status}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تحديث حالة الطلب");
      setOrders(old=>old.map(o=>o.id===orderId?{...o,status}:o));
      setNotice("تم تحديث حالة الطلب.");
    } catch(e) { setError(e instanceof Error ? e.message : "تعذر تحديث الطلب"); }
  }

  async function enableNotifications() {
    if (!("Notification" in window)) { setNotice("المتصفح لا يدعم إشعارات النظام؛ الطلبات ستظهر هنا تلقائيًا."); return; }
    const permission = await Notification.requestPermission();
    setNotice(permission === "granted" ? "تم تفعيل إشعارات الطلبات على هذا الجهاز." : "الإشعارات غير مفعّلة؛ ستظل الطلبات تظهر في اللوحة كل 15 ثانية.");
  }

  const newCount = orders.filter(o=>o.status==="new").length;
  return <section className="mt-8 rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><div className="flex items-center gap-2"><h2 className="text-2xl font-black">طلبات الزبائن</h2>{newCount>0&&<span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white">{newCount} جديد</span>}</div><p className="mt-1 text-sm text-slate-500">تتحدّث القائمة تلقائيًا كل 15 ثانية.</p></div>
      <div className="flex flex-wrap gap-2"><button onClick={enableNotifications} className="rounded-xl border border-emerald-200 px-3 py-2 text-sm font-bold text-emerald-800">تفعيل الإشعارات</button><button onClick={()=>void refresh()} disabled={loading} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{loading?"جاري التحديث...":"تحديث الطلبات ↻"}</button></div>
    </div>
    {notice&&<p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{notice}</p>}
    {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
    <div className="mt-5 space-y-3">
      {orders.map(order=>{
        const page = Array.isArray(order.landing_pages) ? order.landing_pages[0] : order.landing_pages;
        const items = Array.isArray(order.items) ? order.items : [];
        return <article key={order.id} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-900">{order.customer_name}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-black ${statusStyles[order.status]||statusStyles.new}`}>{statusLabels[order.status]||order.status}</span></div><p className="mt-1 text-xs text-slate-500">{page?.business_name||"متجر"} · {new Date(order.created_at).toLocaleString("ar-DZ")}</p></div><a href={`tel:${order.customer_phone}`} className="rounded-xl bg-emerald-600 px-4 py-2 font-black text-white">اتصال بالزبون</a></div>
          <p className="mt-3 text-sm font-bold text-slate-700" dir="ltr">{order.customer_phone}</p>
          {order.customer_address&&<p className="mt-1 text-sm text-slate-600">العنوان: {order.customer_address}</p>}
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">{items.map((item,i)=><p key={i} className="font-bold text-slate-800">{item.name||"منتج"} × {item.quantity||1}{item.price? ` — ${item.price} دج` : ""}</p>)}{order.total_amount!==null&&order.total_amount!==undefined&&<p className="mt-2 font-black text-emerald-700">المجموع التقديري: {Number(order.total_amount).toLocaleString("ar-DZ")} دج</p>}{order.notes&&<p className="mt-2 leading-6 text-slate-500">ملاحظة: {order.notes}</p>}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2"><label className="text-xs font-bold text-slate-500" htmlFor={`status-${order.id}`}>حالة الطلب</label><select id={`status-${order.id}`} value={order.status} onChange={e=>void changeStatus(order.id,e.target.value as Order["status"])} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold">{Object.entries(statusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><a href={`/p/${page?.slug||""}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-700">فتح صفحة المتجر ↗</a></div>
        </article>;
      })}
      {!orders.length&&<div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center"><span className="text-3xl">🛍️</span><h3 className="mt-3 font-black text-slate-800">ما كاين حتى طلب جديد لحد الآن</h3><p className="mt-1 text-sm leading-6 text-slate-500">كي يطلب زبون منتج من صفحة متجر، الطلب يبان هنا تلقائيًا.</p></div>}
    </div>
  </section>;
}
