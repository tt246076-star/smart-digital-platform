import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = typeof body.slug === "string" ? body.slug.trim().slice(0, 120) : "";
    const productIndex = Number(body.productIndex);
    const quantity = Number(body.quantity);
    const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 100) : "";
    const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.trim().slice(0, 30) : "";
    const customerAddress = typeof body.customerAddress === "string" ? body.customerAddress.trim().slice(0, 250) : "";
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";

    if (!slug || !Number.isInteger(productIndex) || productIndex < 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 20 ||
        customerName.length < 2 || !/[0-9]{7,}/.test(customerPhone.replace(/\D/g, ""))) {
      return NextResponse.json({ error: "راجع الاسم ورقم الهاتف والمنتج والكمية." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "الطلبات غير مفعّلة حاليًا. حاول لاحقًا." }, { status: 503 });

    const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: page, error: pageError } = await admin.from("landing_pages")
      .select("id, user_id, business_name, template, sections, is_published")
      .eq("slug", slug).eq("is_published", true).maybeSingle();
    if (pageError || !page) return NextResponse.json({ error: "هذه الصفحة غير متاحة للطلب." }, { status: 404 });

    const template = String(page.template || "");
    if (!["store", "restaurant", "aurora"].includes(template)) {
      return NextResponse.json({ error: "الطلب المباشر غير مفعّل لهذا النوع من الصفحات." }, { status: 400 });
    }
    const sections = page.sections && typeof page.sections === "object" && !Array.isArray(page.sections) ? page.sections as Record<string, unknown> : {};
    const products = Array.isArray(sections.products) ? sections.products as Array<Record<string, unknown>> : [];
    const product = products[productIndex];
    if (!product || typeof product.name !== "string" || !product.name.trim()) return NextResponse.json({ error: "المنتج المختار غير موجود." }, { status: 400 });

    const priceText = typeof product.price === "string" ? product.price : String(product.price || "");
    const priceMatch = priceText.replace(/\s/g, "").replace(/,/g, ".").match(/\d+(?:\.\d+)?/);
    const unitPrice = priceMatch ? Number(priceMatch[0]) : null;
    const totalAmount = unitPrice !== null && Number.isFinite(unitPrice) ? unitPrice * quantity : null;
    const { data: order, error: insertError } = await admin.from("store_orders").insert({
      page_id: page.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      items: [{ name: product.name, price: priceText, quantity, image_url: typeof product.image_url === "string" ? product.image_url : "" }],
      total_amount: totalAmount,
      status: "new",
      notes
    }).select("id").single();

    if (insertError || !order) {
      console.error("Order creation failed:", insertError?.message);
      return NextResponse.json({ error: "ما قدرناش نسجلو الطلب الآن. حاول بعد قليل." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, orderId: order.id, message: "تم استلام الطلب." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }
}
