import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasNoQueryParams, hasOnlyKeys, readBoundedJson } from "@/lib/server/input-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasNoQueryParams(request)) {
    return NextResponse.json({ error: "بيانات التتبع غير صالحة." }, { status: 400 });
  }
  const parsed = await readBoundedJson(request, 2048);
  if (!parsed.ok) {
    const status = parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
    return NextResponse.json({ error: "بيانات التتبع غير صالحة." }, { status });
  }

  const body = parsed.value;
  if (
    !hasOnlyKeys(body, ["slug", "eventType"]) ||
    typeof body.slug !== "string" ||
    body.slug.length < 1 || body.slug.length > 120 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(body.slug) ||
    (body.eventType !== "contact_click" && body.eventType !== "view")
  ) {
    return NextResponse.json({ error: "بيانات التتبع غير صالحة." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: page, error: pageError } = await supabase
      .from("landing_pages")
      .select("id")
      .eq("slug", body.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (pageError || !page) return NextResponse.json({ error: "الصفحة غير متاحة." }, { status: 404 });

    const { error } = await supabase.from("landing_page_events").insert({
      page_id: page.id,
      event_type: body.eventType,
    });
    if (error) return NextResponse.json({ error: "تعذر تسجيل الحدث." }, { status: 503 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "تعذر معالجة الطلب." }, { status: 400 });
  }
}
