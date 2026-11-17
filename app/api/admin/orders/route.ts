import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasNoQueryParams, hasOnlyKeys, isValidUuid, readBoundedJson } from "@/lib/server/input-validation";

export const dynamic = "force-dynamic";

async function getAdminClient() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) return { response: NextResponse.json({ error: "إعدادات الإدارة غير مكتملة." }, { status: 503 }) };
  if (!user || user.email?.trim().toLowerCase() !== adminEmail) return { response: NextResponse.json({ error: "غير مسموح." }, { status: 403 }) };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { response: NextResponse.json({ error: "إعدادات الإدارة غير مكتملة." }, { status: 503 }) };
  return { client: createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) };
}

export async function GET(request: Request) {
  try {
    const result = await getAdminClient();
    if ("response" in result) return result.response;
    const url = new URL(request.url);
    const params = url.searchParams;
    if ([...params.keys()].some((key) => key !== "page") || params.getAll("page").length > 1) {
      return NextResponse.json({ error: "معايير البحث غير صالحة." }, { status: 400 });
    }
    const pageValue = params.get("page") || "1";
    if (!/^\d{1,6}$/.test(pageValue)) return NextResponse.json({ error: "رقم الصفحة غير صالح." }, { status: 400 });
    const page = Number(pageValue);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000) {
      return NextResponse.json({ error: "رقم الصفحة غير صالح." }, { status: 400 });
    }
    const pageSize = 20;
    const { data, error, count } = await result.client.from("platform_orders")
      .select("id,source,product_id,customer_name,customer_phone,customer_address,items,total_amount,status,notes,created_at", { count: "exact" })
      .order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
    if (error) {
      console.error("Platform orders read failed.");
      return NextResponse.json({ error: "تعذر تحميل طلبات المنصة." }, { status: 503 });
    }
    return NextResponse.json({ orders: data || [], total: count || 0, page, pageSize }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "تعذر تحميل الطلبات." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!hasNoQueryParams(request)) return NextResponse.json({ error: "بيانات التحديث غير صالحة." }, { status: 400 });
  try {
    const result = await getAdminClient();
    if ("response" in result) return result.response;
    const parsed = await readBoundedJson(request, 4096);
    if (!parsed.ok) {
      const status = parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
      return NextResponse.json({ error: "بيانات التحديث غير صالحة." }, { status });
    }
    const body = parsed.value;
    const orderId = body.orderId;
    const statusValue = body.status;
    if (
      !hasOnlyKeys(body, ["orderId", "status"]) ||
      !isValidUuid(orderId) ||
      typeof statusValue !== "string" ||
      !["new", "confirmed", "shipped", "completed", "cancelled"].includes(statusValue)
    ) {
      return NextResponse.json({ error: "بيانات تحديث الطلب غير صالحة." }, { status: 400 });
    }
    const { data, error } = await result.client.from("platform_orders").update({
      status: statusValue,
      updated_at: new Date().toISOString(),
    }).eq("id", orderId).select("id").maybeSingle();
    if (error || !data) {
      console.error("Platform order update failed.");
      return NextResponse.json({ error: "تعذر تحديث حالة الطلب." }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!hasNoQueryParams(request)) return NextResponse.json({ error: "بيانات حذف الطلب غير صالحة." }, { status: 400 });
  try {
    const result = await getAdminClient();
    if ("response" in result) return result.response;
    const parsed = await readBoundedJson(request, 2048);
    if (!parsed.ok) {
      const status = parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
      return NextResponse.json({ error: "بيانات حذف الطلب غير صالحة." }, { status });
    }
    const body = parsed.value;
    if (!hasOnlyKeys(body, ["orderId"]) || !isValidUuid(body.orderId)) {
      return NextResponse.json({ error: "رقم الطلب غير صالح." }, { status: 400 });
    }
    const { data, error } = await result.client.from("platform_orders").delete().eq("id", body.orderId).select("id").maybeSingle();
    if (error || !data) {
      console.error("Platform order delete failed.");
      return NextResponse.json({ error: "تعذر حذف الطلب." }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }
}
