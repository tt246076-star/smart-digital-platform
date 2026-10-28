"use server";

import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import VIPImageUpload from "@/components/VIPImageUpload";

const input = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-amber-500";
const fieldNames = ["phone","whatsapp","instagram","tiktok","facebook","google","map","address"] as const;
const fieldLabels: Record<string,string> = {phone:"رقم الهاتف",whatsapp:"رقم واتساب مع رمز الدولة",instagram:"رابط إنستغرام",tiktok:"رابط تيك توك",facebook:"رابط فيسبوك",google:"رابط تقييم Google",map:"رابط Google Maps",address:"العنوان"};\nconst days = [["saturday","السبت"],["sunday","الأحد"],["monday","الإثنين"],["tuesday","الثلاثاء"],["wednesday","الأربعاء"],["thursday","الخميس"],["friday","الجمعة"]] as const;

async function updateVIPCard(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const slug = String(formData.get("slug") || "");
  const { data: page } = await supabase.from("landing_pages").select("id,sections").eq("slug",slug).eq("user_id",user.id).eq("template","vip").maybeSingle();
  if (!page) redirect("/dashboard?vipEditError=1");
  const { data: plan } = await supabase.from("user_access_plans").select("plan_type,expires_at,max_pages,advanced_features").eq("user_id",user.id).maybeSingle();
  if (!plan || plan.plan_type === "trial" || !plan.advanced_features || (plan.expires_at && new Date(plan.expires_at).getTime() <= Date.now())) redirect("/dashboard?vipError=plan");
  const old = page.sections?.vip_card || {};
  const val = (key:string, fallback = "") => String(formData.get(key) ?? fallback).trim();
  const cleanUrl = (raw: string) => { try { const u = new URL(raw); return ["https:","http:"].includes(u.protocol) ? u.toString() : ""; } catch { return ""; } };
  const name = val("name",old.name).slice(0,100);
  if (!name) redirect("/dashboard?vipEditError=1");
  const gallery = [1,2,3,4].map(i => val("gallery_"+i,old.gallery?.[i-1] || "")).filter(Boolean).map(cleanUrl).filter(Boolean);
  const hours: Record<string,{open:boolean;from:string;to:string}> = {};\n  for (const [day] of days) hours[day] = { open: formData.get(day+"_open") === "on", from: val(day+"_from",old.hours?.[day]?.from || "09:00"), to: val(day+"_to",old.hours?.[day]?.to || "18:00") };\n  const vip_card = { ...old, name, bio:val("bio",old.bio).slice(0,400), logo:val("logo",old.logo), coverImage:val("cover",old.coverImage), phone:val("phone",old.phone).slice(0,30), whatsapp:val("whatsapp",old.whatsapp).slice(0,30), instagram:cleanUrl(val("instagram",old.instagram)), tiktok:cleanUrl(val("tiktok",old.tiktok)), facebook:cleanUrl(val("facebook",old.facebook)), address:val("address",old.address).slice(0,200), mapUrl:cleanUrl(val("map",old.mapUrl)), googleLink:cleanUrl(val("google",old.googleLink)), gallery, hours };
  const { error } = await supabase.from("landing_pages").update({ business_name:name, description:vip_card.bio, phone:vip_card.phone, whatsapp:vip_card.whatsapp, instagram_url:vip_card.instagram, facebook_url:vip_card.facebook, tiktok_url:vip_card.tiktok, logo_url:vip_card.logo, sections:{ ...(page.sections || {}), vip_card } }).eq("id",page.id).eq("user_id",user.id);
  if (error) { console.error("VIP card update failed",error.message); redirect("/dashboard?vipEditError=1"); }
  redirect("/dashboard?vipUpdated=1");
}

export default async function EditVIPPage({params}:{params:{slug:string}}) {
 const supabase = await createClient();
 const {data:{user}} = await supabase.auth.getUser();
 if (!user) redirect("/login");
 const {data:page} = await supabase.from("landing_pages").select("slug,sections,business_name").eq("slug",params.slug).eq("user_id",user.id).eq("template","vip").maybeSingle();
 if (!page) redirect("/dashboard");
 const {data:plan} = await supabase.from("user_access_plans").select("plan_type,expires_at,advanced_features").eq("user_id",user.id).maybeSingle();
 if (!plan?.advanced_features || plan.plan_type === "trial" || (plan.expires_at && new Date(plan.expires_at).getTime() <= Date.now())) redirect("/dashboard?vipError=plan");
 const shop = page.sections?.vip_card || {};
 return <><Header/><main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><div className="mx-auto max-w-3xl"><Link href="/dashboard" className="text-sm font-bold text-slate-500">← العودة إلى لوحة التحكم</Link><div className="mt-6 rounded-3xl border border-amber-200 bg-white p-5 shadow-xl sm:p-9"><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">VIP · تعديل البطاقة</span><h1 className="mt-4 text-3xl font-black">تعديل بطاقة المحل</h1><p className="mt-2 text-sm leading-6 text-slate-500">غيّر المعلومات أو ارفع صورًا جديدة. إذا لم تغيّر الصورة، ستبقى الصورة الحالية.</p><form action={updateVIPCard} className="mt-7 space-y-6"><input type="hidden" name="slug" value={page.slug}/><div><label className="text-sm font-bold">اسم المحل *</label><input className={input} name="name" required maxLength={100} defaultValue={shop.name || page.business_name || ""}/></div><div><label className="text-sm font-bold">وصف قصير</label><textarea className={input} name="bio" rows={3} maxLength={400} defaultValue={shop.bio || ""}/></div><div className="grid gap-5 sm:grid-cols-2"><VIPImageUpload name="logo" label="شعار المحل" initialValue={shop.logo || ""}/><VIPImageUpload name="cover" label="صورة الغلاف" initialValue={shop.coverImage || ""}/></div><div className="grid gap-4 sm:grid-cols-2">{fieldNames.map(key=><div key={key}><label className="text-sm font-bold">{fieldLabels[key]}</label><input className={input} name={key} defaultValue={key==="map" ? shop.mapUrl || "" : key==="google" ? shop.googleLink || "" : shop[key] || ""} type={["instagram","tiktok","facebook","google","map"].includes(key) ? "url" : "text"}/></div>)}</div><section><h2 className="mb-3 text-lg font-extrabold">صور المعرض</h2><div className="grid gap-5 sm:grid-cols-2">{[1,2,3,4].map(n=><VIPImageUpload key={n} name={"gallery_"+n} label={"صورة المعرض "+n} initialValue={shop.gallery?.[n-1] || ""}/>)}</div></section><section><h2 className="text-lg font-extrabold">أوقات العمل</h2><p className="mt-1 text-sm text-slate-500">تُحسب حالة المحل حسب توقيت الجزائر.</p><div className="mt-4 space-y-3">{days.map(([day,label])=>{const h=shop.hours?.[day] || {open:day!=="friday",from:"09:00",to:"18:00"};return <div key={day} className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 rounded-xl border border-slate-100 p-3"><label className="flex min-w-20 items-center gap-2 text-sm font-bold"><input type="checkbox" name={day+"_open"} defaultChecked={h.open} className="accent-amber-600"/>{label}</label><input aria-label={label+" من"} name={day+"_from"} type="time" defaultValue={h.from} className="rounded-lg border border-slate-200 px-2 py-2 text-sm"/><input aria-label={label+" إلى"} name={day+"_to"} type="time" defaultValue={h.to} className="rounded-lg border border-slate-200 px-2 py-2 text-sm"/></div>})}</div></section><button className="w-full rounded-xl bg-amber-500 px-5 py-4 font-black text-slate-950 hover:bg-amber-400" type="submit">حفظ التعديلات</button></form></div></div></main></>;
}
