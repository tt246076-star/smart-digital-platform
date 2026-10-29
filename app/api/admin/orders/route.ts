import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getAdminClient() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  const adminEmail = (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase();
  if (!user || user.email?.trim().toLowerCase() !== adminEmail) return { response: NextResponse.json({ error: "غير مسموح." }, { status: 403 }) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { response: NextResponse.json({ error: "إعدادات الإدارة غير مكتملة." }, { status: 503 }) };
  return { client: createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) };
}

export async function GET() {
  try {
    const result = await getAdminClient();
    if ("response" in result) return result.response;
    const { data, error } = await result.client.from("store_orders")
      .select("id,page_id,customer_name,customer_phone,customer_address,items,total_amount,status,notes,created_at,landing_pages(business_name,slug)")
      .order("created_at", { ascending: false }).limit(100);
    if (error) {
      console.error("Admin orders read failed:", error.message);
      return NextResponse.json({ error: "تعذر تحميل الطلبات. تأكد من إعداد جدول store_orders في Supabase." }, { status: 503 });
    }
    return NextResponse.json({ orders: data || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "تعذر تحميل الطلبات." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await getAdminClient();
    if ("response" in result) return result.response;
    const body = await request.json();
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    const status = body.status;
    if (!orderId || !["new", "confirmed", "shipped", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "بيانات تحديث الطلب غير صالحة." }, { status: 400 });
    }
    const { error } = await result.client.from("store_orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (error) {
      console.error("Admin order update failed:", error.message);
      return NextResponse.json({ error: "تعذر تحديث حالة الطلب." }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }
}


export async function DELETE(request: Request) {
  try {
    const result = await getAdminClient();
    if ("response" in result) return result.response;
    const body = await request.json();
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    if (!orderId) return NextResponse.json({ error: "رقم الطلب غير صالح." }, { status: 400 });
    const { error } = await result.client.from("store_orders").delete().eq("id", orderId);
    if (error) {
      console.error("Admin order delete failed:", error.message);
      return NextResponse.json({ error: "تعذر حذف الطلب." }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }
}
