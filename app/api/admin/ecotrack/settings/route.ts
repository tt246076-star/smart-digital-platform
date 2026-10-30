import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { encryptSecret } from "@/lib/ecotrack-secrets";

export const runtime = "nodejs";

async function authorizedAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return false;
  const adminEmail = (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase();
  return user.email.trim().toLowerCase() === adminEmail;
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Server-side Supabase service credentials are not configured");
  return createSupabaseAdmin(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET() {
  if (!(await authorizedAdmin())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  try {
    const { data, error } = await db().from("private_integrations").select("base_url, updated_at").eq("id", "ecotrack").maybeSingle();
    if (error) throw error;
    return NextResponse.json({ configured: Boolean(data), baseUrl: data?.base_url ?? "https://platform.dhd-dz.com", updatedAt: data?.updated_at ?? null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر قراءة الإعدادات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await authorizedAdmin())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  try {
    const body = await request.json();
    const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!baseUrl || !token) return NextResponse.json({ error: "أدخل رابط المنصة و API Token" }, { status: 400 });
    let parsed: URL;
    try { parsed = new URL(baseUrl); } catch { return NextResponse.json({ error: "رابط المنصة غير صحيح" }, { status: 400 }); }
    if (parsed.protocol !== "https:") return NextResponse.json({ error: "يجب استخدام رابط HTTPS آمن" }, { status: 400 });
    const encryptedSecret = encryptSecret(token);
    const { error } = await db().from("private_integrations").upsert({
      id: "ecotrack",
      encrypted_secret: encryptedSecret,
      base_url: parsed.origin,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });
    if (error) throw error;
    return NextResponse.json({ ok: true, message: "تم حفظ إعدادات Ecotrack بشكل مشفّر." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر حفظ الإعدادات" }, { status: 500 });
  }
}
