import { redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import VIPImageUpload from "@/components/VIPImageUpload";
import VIPCustomizer from "@/components/dashboard/VIPCustomizer";

async function createVIPCard(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: plan } = await supabase.from("user_access_plans").select("plan_type,expires_at,max_pages,advanced_features").eq("user_id",user.id).maybeSingle();
  const active = !!plan && (!plan.expires_at || new Date(plan.expires_at).getTime() > Date.now());
  if (!active || plan.plan_type === "trial" || !plan.advanced_features || (plan.max_pages ?? 0) < 1) redirect("/dashboard?vipError=plan");
  const { count } = await supabase.from("landing_pages").select("id",{count:"exact",head:true}).eq("user_id",user.id);
  const { data: limits } = await supabase.from("user_page_limits").select("max_pages").eq("user_id",user.id).maybeSingle();
  const max = Math.min(limits?.max_pages ?? plan.max_pages, plan.max_pages ?? 0);
  if ((count ?? 0) >= max) redirect("/dashboard?vipError=limit");
  const name = String(formData.get("name") || "").trim().slice(0,100);
  if (!name) redirect("/vip/new?error=name");
  const cleanUrl = (raw: FormDataEntryValue | null) => { try { const u = new URL(String(raw || "")); return ["https:","http:"].includes(u.protocol) ? u.toString() : ""; } catch { return ""; } };
  const days = ["saturday","sunday","monday","tuesday","wednesday","thursday","friday"];
  const hours: Record<string,{open:boolean;from:string;to:string}> = {};
  for (const day of days) hours[day] = { open: formData.get(day+"_open") === "on", from: String(formData.get(day+"_from") || "09:00"), to: String(formData.get(day+"_to") || "18:00") };
  const gallery = [1,2,3,4].map(i=>cleanUrl(formData.get("gallery_"+i))).filter(Boolean);
  const requestedTheme = String(formData.get("theme") || "gold");
  const theme = ["gold","silver","emerald","ruby","lavender","pink","dark"].includes(requestedTheme) ? requestedTheme : "gold";
  const requestedLayout = String(formData.get("layout") || "classic");
  const layout = ["classic","salon"].includes(requestedLayout) ? requestedLayout : "classic";
  const vip_card = { name, theme, layout, backgroundImage:cleanUrl(formData.get("backgroundImage")), animation:formData.get("animation") === "on", logo:cleanUrl(formData.get("logo")), bio:String(formData.get("bio")||"").trim().slice(0,400), coverImage:cleanUrl(formData.get("cover")), phone:String(formData.get("phone")||"").trim().slice(0,30), whatsapp:String(formData.get("whatsapp")||"").trim().slice(0,30), instagram:cleanUrl(formData.get("instagram")), tiktok:cleanUrl(formData.get("tiktok")), facebook:cleanUrl(formData.get("facebook")), address:String(formData.get("address")||"").trim().slice(0,200), mapUrl:cleanUrl(formData.get("map")), googleLink:cleanUrl(formData.get("google")), gallery, hours };
  const slug = (name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,30)||"vip-shop")+"-vip-"+crypto.randomUUID().slice(0,8);
  const { error } = await supabase.from("landing_pages").insert({ user_id:user.id,slug,business_name:name,headline:"بطاقة VIP",description:vip_card.bio,phone:vip_card.phone,whatsapp:vip_card.whatsapp,instagram_url:vip_card.instagram,facebook_url:vip_card.facebook,tiktok_url:vip_card.tiktok,logo_url:vip_card.logo,template:"vip",theme:"gold",sections:{vip_card},is_published:true });
  if (error) { console.error("VIP card creation failed",error.message); redirect("/vip/new?error=save"); }
  redirect("/dashboard?vipCreated=1");
}
const input = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100";
const fields = [["phone","رقم الهاتف","tel"],["whatsapp","رقم واتساب مع رمز الدولة","tel"],["instagram","رابط إنستغرام","url"],["tiktok","رابط تيك توك","url"],["facebook","رابط فيسبوك","url"],["google","رابط تقييم Google","url"],["map","رابط Google Maps","url"],["address","العنوان","text"]] as const;
const days = [["saturday","السبت"],["sunday","الأحد"],["monday","الإثنين"],["tuesday","الثلاثاء"],["wednesday","الأربعاء"],["thursday","الخميس"],["friday","الجمعة"]] as const;
export default async function NewVIPPage({searchParams}:{searchParams:{error?:string}}) {
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login");
 const {data:plan}=await supabase.from("user_access_plans").select("plan_type,expires_at,advanced_features").eq("user_id",user.id).maybeSingle();
 if(!plan?.advanced_features||plan.plan_type==="trial"||(plan.expires_at&&new Date(plan.expires_at).getTime()<=Date.now())) redirect("/dashboard?vipError=plan");
 return <><Header/><main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:py-12"><div className="mx-auto max-w-3xl"><Link href="/dashboard" className="text-sm font-bold text-slate-500">← العودة إلى لوحة التحكم</Link><div className="mt-6 rounded-3xl border border-amber-200 bg-white p-5 shadow-xl shadow-amber-900/5 sm:p-9"><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">VIP · بطاقتي</span><h1 className="mt-4 text-3xl font-black">إنشاء بطاقة</h1><p className="mt-2 leading-7 text-slate-500">بطاقة عرض فاخرة للمحل، فيها معلومات النشاط والصور وطرق التواصل والخريطة، بدون أسعار أو بيع منتجات.</p>{searchParams.error&&<p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{searchParams.error==="name"?"اسم المحل مطلوب.":"تعذر حفظ البطاقة، حاول مجددًا."}</p>}<form action={createVIPCard} className="mt-7 space-y-7"><section className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className="text-sm font-bold" htmlFor="name">اسم المحل *</label><input className={input} name="name" id="name" required maxLength={100} placeholder="مثال: Guerfi Boutique"/></div><div className="sm:col-span-2"><label className="text-sm font-bold" htmlFor="bio">وصف قصير</label><textarea className={input} name="bio" id="bio" rows={3} maxLength={400} placeholder="عرّف الزبائن بالمحل..."/></div><div><VIPImageUpload name="logo" label="شعار المحل"/></div><div><VIPImageUpload name="cover" label="صورة الغلاف"/></div><div className="sm:col-span-2"><VIPCustomizer currentTheme="gold" currentBackground="" animationOn={true} currentLayout="classic"/></div>{fields.map(([name,label,type])=><div key={name}><label className="text-sm font-bold" htmlFor={name}>{label}</label><input className={input} name={name} id={name} type={type} placeholder={type==="url"?"https://...":""}/></div>)}<div className="sm:col-span-2"><h2 className="text-lg font-extrabold">صور المعرض (4 صور)</h2><p className="mt-1 text-xs text-slate-500">ارفع الصور مباشرة من جهازك، حتى 5 ميغابايت للصورة.</p></div>{[1,2,3,4].map(n=><div key={n}><VIPImageUpload name={"gallery_"+n} label={"صورة المعرض "+n}/></div>)}</section><section><h2 className="text-lg font-extrabold">أوقات العمل</h2><p className="mt-1 text-sm text-slate-500">تُحسب حالة المحل حسب توقيت الجزائر.</p><div className="mt-4 space-y-3">{days.map(([day,label])=><div key={day} className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 rounded-xl border border-slate-100 p-3"><label className="flex min-w-20 items-center gap-2 text-sm font-bold"><input type="checkbox" name={day+"_open"} defaultChecked={day!=="friday"} className="accent-amber-600"/>{label}</label><input aria-label={label+" من"} name={day+"_from"} type="time" defaultValue="09:00" className="rounded-lg border border-slate-200 px-2 py-2 text-sm"/><input aria-label={label+" إلى"} name={day+"_to"} type="time" defaultValue="18:00" className="rounded-lg border border-slate-200 px-2 py-2 text-sm"/></div>)}</div></section><button className="w-full rounded-xl bg-amber-500 px-5 py-4 font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400" type="submit">إنشاء بطاقة</button></form></div></div></main></>;
}
