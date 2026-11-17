import { NextResponse } from "next/server";
import { recordSecuritySignal } from "@/lib/server/security-alerts";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { hasNoQueryParams,
  hasOnlyKeys,
  isValidAlgerianMobile,
  isValidAlgerianWilayaCode,
  isValidUuid,
  readBoundedJson,
  readJsonText,
} from "@/lib/server/input-validation";

export const dynamic = "force-dynamic";

const HOME_PACKAGES: Record<string, { name: string; price: number }> = {
  "desk-card": { name: "بطاقة مكتب", price: 2000 },
  "door-card": { name: "بطاقة باب", price: 2500 },
  "smart-display": { name: "بطاقة عرض ذكية", price: 4500 },
  "three-card-bundle": { name: "حزمة 3 بطاقات", price: 8500 },
};

const HOMEPAGE_FIELDS = ["source", "packageId", "idempotencyKey", "customerName", "customerPhone", "customerWilaya", "customerMunicipality", "customerAddress", "notes"] as const;
const CATALOG_FIELDS = ["source", "productId", "idempotencyKey", "customerName", "customerPhone", "customerWilaya", "customerMunicipality", "customerAddress", "notes"] as const;

export async function POST(request: Request) {
  if (!hasNoQueryParams(request)) {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة." }, { status: 400 });
  }
  const parsed = await readBoundedJson(request, 16_384);
  if (!parsed.ok) {
    const status = parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
    return NextResponse.json({ error: status === 413 ? "حجم الطلب كبير جدًا." : "بيانات الطلب غير صالحة." }, { status });
  }

  const body = parsed.value;
  if (body.source !== "homepage" && body.source !== "catalog") {
    return NextResponse.json({ error: "نوع الطلب غير صالح." }, { status: 400 });
  }
  const source = body.source;
  const allowedFields = source === "homepage" ? HOMEPAGE_FIELDS : CATALOG_FIELDS;
  if (!hasOnlyKeys(body, allowedFields)) {
    return NextResponse.json({ error: "بيانات الطلب غير مكتملة أو تحتوي على حقول غير معروفة." }, { status: 400 });
  }

  const customerName = readJsonText(body.customerName, 100, true);
  const phoneInput = readJsonText(body.customerPhone, 30, true);
  const customerWilaya = readJsonText(body.customerWilaya, 2, true);
  const customerMunicipality = readJsonText(body.customerMunicipality, 100, true);
  const customerAddress = readJsonText(body.customerAddress, 250, true);
  const notes = readJsonText(body.notes ?? "", 500);
  const idempotencyKey = body.idempotencyKey;
  const packageId = source === "homepage" ? body.packageId : undefined;
  const productId = source === "catalog" ? body.productId : undefined;
  const normalizedPhone = phoneInput?.replace(/[\s-]/g, "") ?? "";

  if (
    customerName === null || customerName.length < 2 ||
    phoneInput === null || !isValidAlgerianMobile(normalizedPhone) ||
    customerWilaya === null || !isValidAlgerianWilayaCode(customerWilaya) ||
    customerMunicipality === null || customerMunicipality.length < 2 ||
    customerAddress === null || customerAddress.length < 2 || notes === null ||
    !isValidUuid(idempotencyKey) ||
    (source === "homepage" && (typeof packageId !== "string" || !Object.prototype.hasOwnProperty.call(HOME_PACKAGES, packageId))) ||
    (source === "catalog" && !isValidUuid(productId))
  ) {
    return NextResponse.json({ error: "راجع الاسم ورقم الهاتف والولاية والبلدية والعنوان والمنتج." }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "الطلبات غير مفعّلة حاليًا. حاول لاحقًا." }, { status: 503 });
  }
  const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const forwardedIp =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "";
  const clientIp = forwardedIp.split(",")[0].trim() || (process.env.NODE_ENV === "production" ? "" : "127.0.0.1");
  if (!clientIp || clientIp.length > 64) {
    return NextResponse.json({ error: "تعذر التحقق من مصدر الطلب. حاول لاحقًا." }, { status: 503 });
  }

  const { data: withinLimit, error: rateLimitError } = await admin.rpc("consume_order_rate_limit", {
    p_client_ip: clientIp,
    p_limit: 2,
    p_window_seconds: 600,
  });
  if (rateLimitError || typeof withinLimit !== "boolean") {
    console.error("Platform order rate limit check failed.");
    return NextResponse.json({ error: "خدمة الطلبات مشغولة حاليًا. حاول لاحقًا." }, { status: 503 });
  }
  if (!withinLimit) {
    return NextResponse.json(
      { error: "وصلت إلى الحد المؤقت للطلبات. حاول بعد بضع دقائق." },
      { status: 429, headers: { "Retry-After": "600", "Cache-Control": "no-store" } }
    );
  }

  let itemName = "";
  let priceText = "";
  let totalAmount: number | null = null;
  let imageUrl = "";

  if (source === "catalog") {
    const { data: product, error: productError } = await admin
      .from("storefront_products")
      .select("id,name,price,image_url,is_active")
      .eq("id", productId as string)
      .eq("is_active", true)
      .maybeSingle();
    if (productError || !product) {
      return NextResponse.json({ error: "هذا المنتج غير متوفر حاليًا." }, { status: 404 });
    }
    itemName = String(product.name).slice(0, 100);
    priceText = String(product.price);
    totalAmount = Number(product.price);
    imageUrl = typeof product.image_url === "string" ? product.image_url.slice(0, 1000) : "";
  } else {
    const item = HOME_PACKAGES[packageId as string];
    itemName = item.name;
    priceText = String(item.price);
    totalAmount = item.price;
  }

  const { data: order, error: insertError } = await admin.from("platform_orders").insert({
    source,
    product_id: source === "catalog" ? productId : null,
    customer_name: customerName,
    customer_phone: normalizedPhone,
    customer_address: customerAddress,
    items: [{ name: itemName, price: priceText, quantity: 1, image_url: imageUrl }],
    total_amount: totalAmount,
    status: "new",
    notes,
    idempotency_key: idempotencyKey,
  }).select("id").single();

  if (insertError?.code === "23505") {
    const { data: existing, error: lookupError } = await admin
      .from("platform_orders").select("id").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (!lookupError && existing) {
      return NextResponse.json({ ok: true, orderId: existing.id, message: "تم استلام الطلب." }, { status: 200 });
    }
  }

  if (insertError || !order) {
    console.error("Platform order creation failed.");
    return NextResponse.json({ error: "ما قدرناش نسجلو الطلب الآن. حاول مجددًا." }, { status: 503 });
  }
  await recordSecuritySignal("order-volume", 6, 600, 1800);
  return NextResponse.json({ ok: true, orderId: order.id, message: "تم استلام الطلب." }, { status: 201 });
}
