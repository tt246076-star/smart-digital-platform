"use client";

import { useState } from "react";

type Product = { id: string; name: string; description: string; price: number; image_url: string };
const wilayas = ["01 - أدرار","02 - الشلف","03 - الأغواط","04 - أم البواقي","05 - باتنة","06 - بجاية","07 - بسكرة","08 - بشار","09 - البليدة","10 - البويرة","11 - تمنراست","12 - تبسة","13 - تلمسان","14 - تيارت","15 - تيزي وزو","16 - الجزائر","17 - الجلفة","18 - جيجل","19 - سطيف","20 - سعيدة","21 - سكيكدة","22 - سيدي بلعباس","23 - عنابة","24 - قالمة","25 - قسنطينة","26 - المدية","27 - مستغانم","28 - المسيلة","29 - معسكر","30 - ورقلة","31 - وهران","32 - البيض","33 - إليزي","34 - برج بوعريريج","35 - بومرداس","36 - الطارف","37 - تندوف","38 - تسمسيلت","39 - الوادي","40 - خنشلة","41 - سوق أهراس","42 - تيبازة","43 - ميلة","44 - عين الدفلى","45 - النعامة","46 - عين تموشنت","47 - غرداية","48 - غليزان","49 - تيميمون","50 - برج باجي مختار","51 - أولاد جلال","52 - بني عباس","53 - عين صالح","54 - عين قزام","55 - تقرت","56 - جانت","57 - المغير","58 - المنيعة"];
export default function StoreProductOrderForm({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "catalog", productId: product.id, customerName: name, customerPhone: phone, customerAddress: [wilaya, municipality, address].filter(Boolean).join("، "), notes }) });
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
        <label className="block text-sm font-bold">رقم الهاتف الجزائري<input required type="tel" inputMode="numeric" autoComplete="tel-national" pattern="0[567][0-9]{8}" minLength={10} maxLength={10} title="أدخل رقمًا جزائريًا من 10 أرقام يبدأ بـ 05 أو 06 أو 07" dir="ltr" value={phone} onChange={e=>{const v=e.target.value.replace(/[^0-9]/g,"").slice(0,10);setPhone(v);setPhoneError(v.length===10&&!/^0[567][0-9]{8}$/.test(v)?"الرقم لازم يبدأ بـ 05 أو 06 أو 07 ويتكون من 10 أرقام.":"");}} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-3 text-left"/><span className="mt-1 block text-xs font-normal text-slate-500">مثال: 0557829036</span>{phoneError&&<span className="mt-1 block text-xs text-red-700">{phoneError}</span>}</label>
        <label className="block text-sm font-bold">الولاية (اختار بالرقم)<select required value={wilaya} onChange={e=>setWilaya(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-3"><option value="">اختار الولاية</option>{wilayas.map(w=><option key={w} value={w}>{w}</option>)}</select></label>
        <label className="block text-sm font-bold">البلدية<input required value={municipality} onChange={e=>setMunicipality(e.target.value)} placeholder="اكتب اسم البلدية" className="mt-1.5 w-full rounded-xl border bg-white px-3 py-3"/></label>
        <label className="block text-sm font-bold">العنوان بالتفصيل<input required value={address} onChange={e=>setAddress(e.target.value)} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-3"/></label>
        <label className="block text-sm font-bold">ملاحظات (اختياري)<textarea value={notes} onChange={e=>setNotes(e.target.value)} maxLength={500} className="mt-1.5 w-full rounded-xl border bg-white px-3 py-3"/></label>
        {error && <p role="alert" className="rounded-xl bg-red-100 p-3 text-sm font-bold text-red-800">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 font-black text-white disabled:opacity-50">{busy ? "جاري إرسال الطلب..." : "تأكيد الطلب"}</button>
      </form>}
    </div>
  </article>;
}
