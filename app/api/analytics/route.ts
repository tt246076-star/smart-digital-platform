import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = typeof body.slug === "string" ? body.slug.slice(0, 120) : "";
    const eventType = body.eventType === "contact_click" ? "contact_click" : body.eventType === "view" ? "view" : null;
    if (!slug || !eventType) return NextResponse.json({ ok: false }, { status: 400 });

    const supabase = await createClient();
    const { data: page } = await supabase
      .from("landing_pages")
      .select("id")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!page) return NextResponse.json({ ok: false }, { status: 404 });

    const { error } = await supabase.from("landing_page_events").insert({
      page_id: page.id,
      event_type: eventType,
    });
    if (error) return NextResponse.json({ ok: false }, { status: 503 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
