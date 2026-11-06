"use client";

import { useState } from "react";

export const ORDER_PACKAGES = [
  { id:"desk-card", name:"بطاقة مكتب", description:"بطاقة تعريف ذكية مناسبة للمكتب أو مكان الاستقبال.", price:2000, oldPrice:3000, icon:"▣" },
  { id:"door-card", name:"بطاقة باب", description:"عرّف الزوار بنشاطك من أمام المحل أو المكتب.", price:2500, oldPrice:3500, icon:"▤" },
  { id:"smart-display", name:"بطاقة عرض ذكية", description:"حل عملي لعرض معلومات نشاطك ومشاركة بياناتك بسرعة.", price:4500, oldPrice:6500, icon:"▧" },
  { id:"three-card-bundle", name:"حزمة 3 بطاقات", description:"بطاقة مكتب + بطاقة باب + بطاقة محفظة في حزمة واحدة.", price:8500, oldPrice:14000, icon:"✦" },
] as const;

const wilayas = ["01 - أدرار","02 - الشلف","03 - الأغواط","04 - أم البواقي","05 - باتنة","06 - بجاية","07 - بسكرة","08 - بشار","09 - البليدة","10 - البويرة","11 - تمنراست","12 - تبسة","13 - تلمسان","14 - تيارت","15 - تيزي وزو","16 - الجزائر","17 - الجلفة","18 - جيجل","19 - سطيف","20 - سعيدة","21 - سكيكدة","22 - سيدي بلعباس","23 - عنابة","24 - قالمة","25 - قسنطينة","26 - المدية","27 - مستغانم","28 - المسيلة","29 - معسكر","30 - ورقلة","31 - وهران","32 - البيض","33 - إليزي","34 - برج بوعريريج","35 - بومرداس","36 - الطارف","37 - تندوف","38 - تسمسيلت","39 - الوادي","40 - خنشلة","41 - سوق أهراس","42 - تيبازة","43 - ميلة","44 - عين الدفلى","45 - النعامة","46 - عين تموشنت","47 - غرداية","48 - غليزان","49 - تيميمون","50 - برج باجي مختار","51 - أولاد جلال","52 - بني عباس","53 - عين صالح","54 - عين قزام","55 - تقرت","56 - جانت","57 - المغير","58 - المنيعة"] as const;

export default function PackageOrderForm({ packageId }: { packageId: string }) {
  const item = ORDER_PACKAGES.find(p=>p.id===packageId);
  const [open,setOpen]=useState(false);
  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [wilaya,setWilaya]=useState("");
  const [municipality,setMunicipality]=useState("");
  const [address,setAddress]=useState("");
  const [notes,setNotes]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  if(!item) return null;

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if (!item) { setError("المنتج غير متاح."); return; }
    setBusy(true);setError("");setSuccess("");
    try{
      const response=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source:"homepage",packageId:item.id,customerName:name,customerPhone:phone,customerAddress:[wilaya,municipality,address].filter(Boolean).join("، "),notes})});
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
        <label className="block text-sm font-bold">رقم الهاتف الجزائري<input required type="tel" inputMode="numeric" pattern="0[567][0-9]{8}" minLength={10} maxLength={10} title="10 أرقام تبدأ بـ 05 أو 06 أو 07" autoComplete="tel-national" dir="ltr" value={phone} onChange={e=>setPhone(e.target.value.replace(/[^0-9]/g,"").slice(0,10))} placeholder="0557829036" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left"/></label>
        <label className="block text-sm font-bold">الولاية<select required value={wilaya} onChange={e=>setWilaya(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3"><option value="">اختار الولاية</option>{wilayas.map(w=><option key={w} value={w}>{w}</option>)}</select></label>
        <label className="block text-sm font-bold">البلدية<input required maxLength={100} value={municipality} onChange={e=>setMunicipality(e.target.value)} placeholder="اكتب اسم البلدية" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3"/></label>
        <label className="block text-sm font-bold">العنوان بالتفصيل<input required maxLength={250} autoComplete="street-address" value={address} onChange={e=>setAddress(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3" placeholder="الحي، الشارع، رقم المنزل"/></label>
        <label className="block text-sm font-bold">ملاحظات (اختياري)<textarea maxLength={500} rows={2} value={notes} onChange={e=>setNotes(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3"/></label>
        {error&&<p role="alert" className="rounded-xl bg-red-100 p-3 text-sm font-bold text-red-800">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-emerald-700 px-4 py-3.5 font-black text-white disabled:opacity-50">{busy?"جاري إرسال الطلب...":"تأكيد الطلب"}</button>
        <p className="text-xs leading-5 text-slate-500">السعر النهائي والتوصيل يؤكَّدان معك هاتفيًا.</p>
      </form>}
    </div>
  </article>;
}
