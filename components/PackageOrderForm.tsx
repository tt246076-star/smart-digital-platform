"use client";

import { useState } from "react";

export const ORDER_PACKAGES = [
  { id:"desk-card", name:"بطاقة مكتب", description:"بطاقة تعريف ذكية مناسبة للمكتب أو مكان الاستقبال.", price:2000, oldPrice:3000, icon:"▣" },
  { id:"door-card", name:"بطاقة باب", description:"عرّف الزوار بنشاطك من أمام المحل أو المكتب.", price:2500, oldPrice:3500, icon:"▤" },
  { id:"smart-display", name:"بطاقة عرض ذكية", description:"حل عملي لعرض معلومات نشاطك ومشاركة بياناتك بسرعة.", price:4500, oldPrice:6500, icon:"▧" },
  { id:"three-card-bundle", name:"حزمة 3 بطاقات", description:"بطاقة مكتب + بطاقة باب + بطاقة محفظة في حزمة واحدة.", price:8500, oldPrice:14000, icon:"✦" },
] as const;

export default function PackageOrderForm({ packageId }: { packageId: string }) {
  const item = ORDER_PACKAGES.find(p=>p.id===packageId);
  const [open,setOpen]=useState(false);
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [wilaya,setWilaya]=useState("");
  const [address,setAddress]=useState("");
  const [notes,setNotes]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  if(!item) return null;

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault(); setBusy(true);setError("");setSuccess("");
    try{
      const response=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source:"homepage",packageId:item.id,customerName:name,customerPhone:phone,customerAddress:[wilaya,address].filter(Boolean).join("، "),notes})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"تعذر إرسال الطلب.");
      setSuccess("تم تسجيل طلبك بنجاح! نتواصل معك قريبًا لتأكيد العنوان والتفاصيل.");
    }catch(e){setError(e instanceof Error?e.message:"تعذر إرسال الطلب.");}
    finally{setBusy(false);}
  }

  return <article className="lp-product-card">
    <div className="lp-product-art"><span className="lp-product-symbol">{item.icon}</span><span className="lp-product-tag">بطاقتي الذكية</span></div>
    <div className="p-5 sm:p-6">
      {item.id==="three-card-bundle"&&<span className="mb-3 inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">عرض خاص · وفّر {item.oldPrice-item.price} دج</span>}
      <h3 className="text-xl font-black text-slate-900">{item.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-7 text-slate-600">{item.description}</p>
      <div className="mt-4 flex items-end gap-3"><strong className="text-3xl font-black text-emerald-700">{item.price.toLocaleString("ar-DZ")} دج</strong><span className="pb-1 text-sm text-slate-400 line-through">{item.oldPrice.toLocaleString("ar-DZ")} دج</span></div>
      <button onClick={()=>setOpen(v=>!v)} className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-black text-white shadow-md shadow-emerald-700/15 transition hover:-translate-y-0.5 hover:bg-emerald-700">{open?"إخفاء نموذج الطلب":"اطلب الآن  ↗"}</button>
      {success&&<p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold leading-6 text-emerald-800">{success}</p>}
      {open&&!success&&<form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl bg-emerald-50/70 p-4">
        <p className="font-black text-slate-900">طلب: {item.name}</p><p className="text-sm font-black text-emerald-700">{item.price.toLocaleString("ar-DZ")} دج</p>
        <label className="block text-sm font-bold">الاسم الكامل<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3"/></label>
        <label className="block text-sm font-bold">رقم الهاتف<input required type="tel" minLength={7} maxLength={30} autoComplete="tel" dir="ltr" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+213..." className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left"/></label>
        <label className="block text-sm font-bold">الولاية<input required maxLength={80} value={wilaya} onChange={e=>setWilaya(e.target.value)} placeholder="مثال: الجزائر" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3"/></label>
        <label className="block text-sm font-bold">العنوان بالتفصيل<input maxLength={250} autoComplete="street-address" value={address} onChange={e=>setAddress(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3" placeholder="البلدية، الحي، الشارع"/></label>
        <label className="block text-sm font-bold">ملاحظات (اختياري)<textarea maxLength={500} rows={2} value={notes} onChange={e=>setNotes(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3"/></label>
        {error&&<p role="alert" className="rounded-xl bg-red-100 p-3 text-sm font-bold text-red-800">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 font-black text-white disabled:opacity-50">{busy?"جاري إرسال الطلب...":"تأكيد الطلب"}</button>
        <p className="text-xs leading-5 text-slate-500">السعر النهائي والتوصيل يؤكَّدان معك هاتفيًا.</p>
      </form>}
    </div>
  </article>;
}
