"use client";

import { useState } from "react";

type Product = { name: string; price: string; image_url?: string; description?: string };

export default function StoreOrderWidget({ slug, products }: { slug: string; products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [productIndex, setProductIndex] = useState("0");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const selected = products[Number(productIndex)] || products[0];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, productIndex: Number(productIndex), quantity, customerName: name, customerPhone: phone, customerAddress: address, notes })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر إرسال الطلب.");
      setDone(true);
      setMessage("وصل طلبك بنجاح! سيتواصل معك صاحب النشاط لتأكيد التفاصيل.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "تعذر إرسال الطلب، حاول مجددًا.");
    } finally { setBusy(false); }
  }

  if (!products.length) return null;
  return <section className="mt-5 rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div><span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">طلب مباشر</span><h3 className="mt-3 text-lg font-black text-slate-900">عجبك منتج؟ اطلبه الآن</h3><p className="mt-1 text-sm leading-6 text-slate-500">عمّر معلوماتك، ويوصل الطلب لصاحب المتجر.</p></div>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-2xl">🛍️</span>
    </div>
    {!open && !done && <button onClick={() => setOpen(true)} className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-black text-white transition hover:bg-emerald-700">اطلب الآن <span aria-hidden="true">←</span></button>}
    {done && <div role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-bold leading-7 text-emerald-800">{message}</div>}
    {open && !done && <form onSubmit={submit} className="mt-5 space-y-3">
      <label className="block text-sm font-bold text-slate-700">اختار المنتج
        <select value={productIndex} onChange={e=>setProductIndex(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-900">{products.map((p,i)=><option key={i} value={i}>{p.name || `المنتج ${i+1}`}{p.price ? ` — ${p.price} دج` : ""}</option>)}</select>
      </label>
      {selected?.image_url && <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2"><img src={selected.image_url} alt={selected.name || "المنتج"} className="h-16 w-16 rounded-lg object-cover"/><div><p className="font-bold text-slate-900">{selected.name}</p>{selected.price && <p className="mt-1 text-sm font-black text-emerald-700">{selected.price} دج</p>}</div></div>}
      <label className="block text-sm font-bold text-slate-700">الكمية
        <input type="number" min={1} max={20} value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(20,Number(e.target.value)||1)))} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3"/>
      </label>
      <label className="block text-sm font-bold text-slate-700">الاسم الكامل
        <input value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={100} autoComplete="name" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="اكتب اسمك"/>
      </label>
      <label className="block text-sm font-bold text-slate-700">رقم الهاتف
        <input value={phone} onChange={e=>setPhone(e.target.value)} required minLength={7} maxLength={30} type="tel" autoComplete="tel" dir="ltr" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-left" placeholder="+213..."/>
      </label>
      <label className="block text-sm font-bold text-slate-700">العنوان / الولاية
        <input value={address} onChange={e=>setAddress(e.target.value)} maxLength={250} autoComplete="street-address" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="اختياري"/>
      </label>
      <label className="block text-sm font-bold text-slate-700">ملاحظة للمتجر
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={500} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3" placeholder="لون، مقاس، وقت مناسب..."/>
      </label>
      {message && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{message}</p>}
      <div className="flex gap-2"><button disabled={busy} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3.5 font-black text-white disabled:opacity-60">{busy ? "جاري إرسال الطلب..." : "تأكيد الطلب"}</button><button type="button" onClick={()=>setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-600">إلغاء</button></div>
      <p className="text-xs leading-5 text-slate-400">السعر النهائي والتوصيل يؤكدهما صاحب المتجر معك.</p>
    </form>}
  </section>;
}
