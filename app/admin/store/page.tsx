import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { saveStoreProduct, deleteStoreProduct } from "./actions";

export const dynamic = "force-dynamic";

type Product = { id: string; name: string; description: string; price: number; image_url: string; is_active: boolean; sort_order: number };

export default async function StoreProductsPage({ searchParams }: { searchParams: { saved?: string; deleted?: string; error?: string } }) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) redirect("/login");
  const adminEmail = (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase();
  if (user.email?.trim().toLowerCase() !== adminEmail) redirect("/dashboard");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return <main dir="rtl" className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-4xl rounded-2xl bg-white p-6"><h1 className="text-2xl font-black">إعداد المنتجات</h1><p className="mt-3">أضف SUPABASE_SERVICE_ROLE_KEY في إعدادات Vercel، ثم أعد النشر.</p></div></main>;
  const admin = createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin.from("storefront_products").select("id,name,description,price,image_url,is_active,sort_order").order("sort_order").order("created_at", { ascending: false });
  const products = (data || []) as Product[];
  return <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-emerald-700">إدارة المتجر</p><h1 className="mt-1 text-3xl font-black">المنتجات والأسعار</h1><p className="mt-2 text-slate-500">المنتجات النشطة تظهر للزبائن في الصفحة الرئيسية.</p></div><div className="flex gap-2"><Link href="/admin" className="rounded-xl border bg-white px-4 py-2 font-bold">لوحة الإدارة</Link><Link href="/#pricing" className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">عرض المتجر ↗</Link></div></div>
      {searchParams.saved === "1" && <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">تم حفظ المنتج.</p>}
      {searchParams.deleted === "1" && <p className="mt-5 rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">تم حذف المنتج.</p>}
      {searchParams.error && <p className="mt-5 rounded-xl bg-red-50 p-4 font-bold text-red-800">{searchParams.error === "config" ? "إعدادات الإدارة غير مكتملة." : searchParams.error === "image" ? "رابط الصورة لازم يبدأ بـ https://" : searchParams.error === "fields" ? "راجع اسم المنتج والسعر والترتيب." : "تعذر حفظ البيانات. تأكد أنك نفذت ملف SQL في Supabase."}</p>}
      {error && <p className="mt-5 rounded-xl bg-red-50 p-4 font-bold text-red-800">جدول المنتجات غير جاهز. نفّذ ملف supabase/storefront_products.sql في SQL Editor داخل Supabase.</p>}
      <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-black">إضافة منتج جديد</h2><form action={saveStoreProduct} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold">اسم المنتج<input name="name" required maxLength={120} className="mt-1.5 w-full rounded-xl border px-3 py-3" placeholder="مثال: بطاقة NFC"/></label>
        <label className="text-sm font-bold">السعر بالدينار الجزائري<input name="price" required type="number" min="0" step="1" className="mt-1.5 w-full rounded-xl border px-3 py-3" placeholder="2500"/></label>
        <label className="text-sm font-bold sm:col-span-2">رابط صورة المنتج (https)<input name="image_url" type="url" className="mt-1.5 w-full rounded-xl border px-3 py-3" placeholder="https://..."/></label>
        <label className="text-sm font-bold sm:col-span-2">وصف المنتج<textarea name="description" maxLength={1000} rows={3} className="mt-1.5 w-full rounded-xl border px-3 py-3" placeholder="اكتب تفاصيل المنتج"/></label>
        <label className="text-sm font-bold">ترتيب العرض<input name="sort_order" type="number" defaultValue="0" className="mt-1.5 w-full rounded-xl border px-3 py-3"/></label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="is_active" defaultChecked className="h-4 w-4"/> عرض المنتج في الموقع</label>
        <button className="rounded-xl bg-emerald-600 px-5 py-3 font-black text-white sm:col-span-2">إضافة المنتج</button>
      </form></section>
      <section className="mt-8"><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-black">منتجاتك ({products.length})</h2></div>
        {products.map(product => <article key={product.id} className="mb-4 rounded-2xl border bg-white p-5 shadow-sm">
          <form action={saveStoreProduct} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="id" value={product.id}/>
            <div className="sm:col-span-2 flex items-center gap-4">{product.image_url ? <img src={product.image_url} alt={product.name} className="h-24 w-24 rounded-xl border object-cover"/> : <div className="grid h-24 w-24 place-items-center rounded-xl bg-emerald-50 text-3xl">▣</div>}<div><p className="font-black">{product.name}</p><p className="mt-1 text-emerald-700 font-black">{Number(product.price).toLocaleString("ar-DZ")} دج</p><p className="mt-1 text-xs text-slate-500">{product.is_active ? "ظاهر للزبائن" : "مخفي من الموقع"}</p></div></div>
            <label className="text-sm font-bold">اسم المنتج<input name="name" required defaultValue={product.name} maxLength={120} className="mt-1.5 w-full rounded-xl border px-3 py-3"/></label>
            <label className="text-sm font-bold">السعر (دج)<input name="price" required type="number" min="0" step="1" defaultValue={product.price} className="mt-1.5 w-full rounded-xl border px-3 py-3"/></label>
            <label className="text-sm font-bold sm:col-span-2">رابط الصورة<input name="image_url" type="url" defaultValue={product.image_url} className="mt-1.5 w-full rounded-xl border px-3 py-3"/></label>
            <label className="text-sm font-bold sm:col-span-2">الوصف<textarea name="description" defaultValue={product.description} maxLength={1000} rows={2} className="mt-1.5 w-full rounded-xl border px-3 py-3"/></label>
            <label className="text-sm font-bold">ترتيب العرض<input name="sort_order" type="number" defaultValue={product.sort_order} className="mt-1.5 w-full rounded-xl border px-3 py-3"/></label>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" name="is_active" defaultChecked={product.is_active} className="h-4 w-4"/> عرض المنتج في الموقع</label>
            <button className="rounded-xl bg-emerald-600 px-4 py-3 font-black text-white">حفظ التعديلات</button>
          </form>
          <form action={deleteStoreProduct} className="mt-2"><input type="hidden" name="id" value={product.id}/><button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700" formAction={deleteStoreProduct}>حذف المنتج</button></form>
        </article>)}
        {!products.length && !error && <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-slate-500">ما زدت حتى منتج بعد. استعمل النموذج اللي فوق.</div>}
      </section>
    </div>
  </main>;
}
