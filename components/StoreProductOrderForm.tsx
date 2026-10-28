"use client";

import { useState } from "react";

type Product = { id: string; name: string; description: string; price: number; image_url: string };
export default function StoreProductOrderForm({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "catalog", productId: product.id, customerName: name, customerPhone: phone, customerAddress: [wilaya, address].filter(Boolean).join("، "), notes }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر إرسال الطلب.");
      setSuccess("تم تسجيل طلبك بنجاح! نتواصل معك قريبًا لتأكيد العنوان والتفاصيل.");
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر إرسال الطلب."); }
    finally { setBusy(false); }
  }
  return <article className="lp-product-card">
    <div className="lp-product-art">{product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover"/> : <span className="lp-product-symbol">▣</span>}<span className="lp-product-tag">منتج متوفر</span></div>
    <div className="p-5 sm:p-6"><h3 className="text-xl font-black text-slate-900">{product.name}</h3><p className="mt-2 min-h-12 text-sm leading-7 text-slate-600">{product.description}</p><strong className="mt-4 block text-3xl font-black text-emerald-700">{Number(product.price).toLocaleString("ar-DZ")} دج</strong>
      <button onClick={() => setOpen(v => !v)} className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-black text-white">{open ? "إخفاء نموذج الطلب" : "اطلب الآن ↗"}</button>
      {success && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold leading-6 text-emerald-800">{success}</p>}
      {open && !success && <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl bg-emerald-50/70 p-4">
        <label className="block text-sm font-bold">الاسم الكامل<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-3"/></label>
        <label className="block text-sm font-bold">رقم الهاتف<input required type="tel" minLength={7} maxLength={30} dir="ltr" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-3 text-left"/></label>
        <label className="block text-sm font-bold">الولاية<input required value={wilaya} onChange={e=>setWilaya(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-3"/></label>
        <label className="block text-sm font-bold">العنوان بالتفصيل<input value={address} onChange={e=>setAddress(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-3"/></label>
        <label className="block text-sm font-bold">ملاحظات (اختياري)<textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={500} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-3"/></label>
        {error && <p role="alert" className="rounded-xl bg-red-100 p-3 text-sm font-bold text-red-800">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 font-black text-white disabled:opacity-50">{busy ? "جاري إرسال الطلب..." : "تأكيد الطلب"}</button>
      </form>}
    </div>
  </article>;
}
