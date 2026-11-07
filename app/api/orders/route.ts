import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const HOME_PACKAGES: Record<string, { name: string; price: number }> = {
  "desk-card": { name: "بطاقة مكتب", price: 2000 },
  "door-card": { name: "بطاقة باب", price: 2500 },
  "smart-display": { name: "بطاقة عرض ذكية", price: 4500 },
  "three-card-bundle": { name: "حزمة 3 بطاقات", price: 8500 },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const source = body.source === "homepage" || body.source === "catalog" ? body.source : "";
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const packageId = typeof body.packageId === "string" ? body.packageId : "";
    const idempotencyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 100) : "";
    const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.trim().slice(0, 30) : "";
    const customerAddress = typeof body.customerAddress === "string" ? body.customerAddress.trim().slice(0, 250) : "";
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";
    const normalizedPhone = customerPhone.replace(/[\s-]/g, "");

    if (!source || customerName.length < 2 || !/^0[567][0-9]{8}$/.test(normalizedPhone) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey) ||
        (source === "homepage" && !HOME_PACKAGES[packageId]) ||
        (source === "catalog" && !productId)) {
      return NextResponse.json({ error: "راجع الاسم ورقم الهاتف والمنتج والطلب." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "الطلبات غير مفعّلة حاليًا. حاول لاحقًا." }, { status: 503 });
    }
    const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    let itemName = "";
    let priceText = "";
    let totalAmount: number | null = null;
    let imageUrl = "";

    if (source === "catalog") {
      const { data: product, error: productError } = await admin
        .from("storefront_products")
        .select("id,name,price,image_url,is_active")
        .eq("id", productId)
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
      const item = HOME_PACKAGES[packageId];
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
      console.error("Platform order creation failed:", insertError?.message);
      return NextResponse.json({ error: "ما قدرناش نسجلو الطلب الآن. حاول مجددًا." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, orderId: order.id, message: "تم استلام الطلب." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }
}
