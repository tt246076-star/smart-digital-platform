import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const HOME_PACKAGES: Record<string,{name:string;price:number}> = {
  "desk-card": { name:"بطاقة مكتب", price:2000 },
  "door-card": { name:"بطاقة باب", price:2500 },
  "smart-display": { name:"بطاقة عرض ذكية", price:4500 },
  "three-card-bundle": { name:"حزمة 3 بطاقات", price:8500 },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const source = body.source === "homepage" ? "homepage" : body.source === "catalog" ? "catalog" : "store";
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim().slice(0, 120) : "";
    const productIndex = Number(body.productIndex);
    const quantity = Number(body.quantity);
    const packageId = typeof body.packageId === "string" ? body.packageId : "";
    const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 100) : "";
    const customerPhone = typeof body.customerPhone === "string" ? body.customerPhone.trim().slice(0, 30) : "";
    const customerAddress = typeof body.customerAddress === "string" ? body.customerAddress.trim().slice(0, 250) : "";
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "";

    if (customerName.length < 2 || !/[0-9]{7,}/.test(customerPhone.replace(/\D/g, "")) ||
        (source === "store" && (!slug || !Number.isInteger(productIndex) || productIndex < 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 20)) ||
        (source === "homepage" && !HOME_PACKAGES[packageId]) || (source === "catalog" && !productId)) {
      return NextResponse.json({ error: "راجع الاسم ورقم الهاتف والمنتج والكمية." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "الطلبات غير مفعّلة حاليًا. حاول لاحقًا." }, { status: 503 });
    const admin = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    let pageId: string | null = null;
    let itemName = "";
    let priceText = "";
    let finalQuantity = 1;
    let totalAmount: number | null = null;
    let imageUrl = "";

    if (source === "catalog") {
      const { data: product, error: productError } = await admin.from("storefront_products").select("id,name,description,price,image_url,is_active").eq("id", productId).eq("is_active", true).maybeSingle();
      if (productError || !product) return NextResponse.json({ error: "هذا المنتج غير متوفر حاليًا." }, { status: 404 });
      itemName = String(product.name).slice(0, 100);
      priceText = String(product.price);
      totalAmount = Number(product.price);
      imageUrl = typeof product.image_url === "string" ? product.image_url.slice(0, 1000) : "";
    } else if (source === "homepage") {
      const item = HOME_PACKAGES[packageId];
      itemName = item.name;
      priceText = String(item.price);
      totalAmount = item.price;
    } else {
      const { data: page, error: pageError } = await admin.from("landing_pages")
        .select("id, template, sections, is_published").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (pageError || !page) return NextResponse.json({ error: "هذه الصفحة غير متاحة للطلب." }, { status: 404 });
      if (!["store", "restaurant", "aurora"].includes(String(page.template || ""))) {
        return NextResponse.json({ error: "الطلب المباشر غير مفعّل لهذا النوع من الصفحات." }, { status: 400 });
      }
      const sections = page.sections && typeof page.sections === "object" && !Array.isArray(page.sections) ? page.sections as Record<string, unknown> : {};
      const products = Array.isArray(sections.products) ? sections.products as Array<Record<string, unknown>> : [];
      const product = products[productIndex];
      if (!product || typeof product.name !== "string" || !product.name.trim()) return NextResponse.json({ error: "المنتج المختار غير موجود." }, { status: 400 });
      pageId = page.id;
      itemName = product.name.trim().slice(0, 100);
      priceText = typeof product.price === "string" ? product.price.slice(0, 30) : String(product.price || "");
      finalQuantity = quantity;
      imageUrl = typeof product.image_url === "string" ? product.image_url.slice(0, 1000) : "";
      const priceMatch = priceText.replace(/\s/g, "").replace(/,/g, ".").match(/\d+(?:\.\d+)?/);
      const unitPrice = priceMatch ? Number(priceMatch[0]) : null;
      totalAmount = unitPrice !== null && Number.isFinite(unitPrice) ? unitPrice * quantity : null;
    }

    const { data: order, error: insertError } = await admin.from("store_orders").insert({
      page_id: pageId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      items: [{ name: itemName, price: priceText, quantity: finalQuantity, image_url: imageUrl }],
      total_amount: totalAmount,
      status: "new",
      notes: source === "homepage" ? `طلب من الصفحة الرئيسية. ${notes}`.trim() : source === "catalog" ? `طلب منتج من المتجر الرئيسي. ${notes}`.trim() : notes
    }).select("id").single();

    if (insertError || !order) {
      console.error("Order creation failed:", insertError?.message);
      return NextResponse.json({ error: "ما قدرناش نسجلو الطلب الآن. تأكد من إعداد جدول الطلبات ثم حاول مجددًا." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, orderId: order.id, message: "تم استلام الطلب." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }
}
