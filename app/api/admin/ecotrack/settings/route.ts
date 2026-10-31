import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { encryptSecret } from "@/lib/ecotrack-secrets";

export const runtime = "nodejs";

type Provider = "dhd" | "anderson";

function providerFrom(request: Request): Provider | null {
  const value = new URL(request.url).searchParams.get("provider") || "dhd";
  return value === "dhd" || value === "anderson" ? value : null;
}

function integrationId(provider: Provider) {
  return provider === "anderson" ? "ecotrack_anderson" : "ecotrack";
}

function defaultBaseUrl(provider: Provider) {
  return provider === "anderson"
    ? "https://anderson-ecommerce.ecotrack.dz"
    : "https://platform.dhd-dz.com";
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    const value = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const parts = [value.message, value.details, value.hint]
      .filter((part): part is string => typeof part === "string" && Boolean(part.trim()));
    if (parts.length) return parts.join(" — ");
    if (typeof value.code === "string") return `${fallback} (code: ${value.code})`;
  }
  return fallback;
}

async function authorizedAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return false;
  return user.email.trim().toLowerCase() === "tt246076@gmail.com";
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Server-side Supabase service credentials are not configured");
  return createSupabaseAdmin(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function validProviderUrl(value: string, provider: Provider) {
  let parsed: URL;
  try { parsed = new URL(value); } catch { return null; }
  const expectedHost = provider === "anderson"
    ? "anderson-ecommerce.ecotrack.dz"
    : "platform.dhd-dz.com";
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname.toLowerCase() !== expectedHost ||
    parsed.pathname !== "/" ||
    parsed.port ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) return null;
  return parsed;
}

export async function GET(request: Request) {
  if (!(await authorizedAdmin())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const provider = providerFrom(request);
  if (!provider) return NextResponse.json({ error: "شركة التوصيل غير معروفة" }, { status: 400 });
  try {
    const { data, error } = await db().from("private_integrations")
      .select("base_url, updated_at")
      .eq("id", integrationId(provider))
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({
      provider,
      configured: Boolean(data),
      baseUrl: data?.base_url ?? defaultBaseUrl(provider),
      updatedAt: data?.updated_at ?? null
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error, "تعذر قراءة الإعدادات") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await authorizedAdmin())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const provider = providerFrom(request);
  if (!provider) return NextResponse.json({ error: "شركة التوصيل غير معروفة" }, { status: 400 });
  try {
    const body = await request.json();
    const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!baseUrl || !token) return NextResponse.json({ error: "أدخل رابط المنصة و API Token" }, { status: 400 });
    const parsed = validProviderUrl(baseUrl, provider);
    if (!parsed) {
      const expected = provider === "anderson" ? defaultBaseUrl("anderson") : defaultBaseUrl("dhd");
      return NextResponse.json({ error: `رابط المنصة غير صحيح. استعمل ${expected}` }, { status: 400 });
    }
    const encryptedSecret = encryptSecret(token);
    const { error } = await db().from("private_integrations").upsert({
      id: integrationId(provider),
      encrypted_secret: encryptedSecret,
      base_url: parsed.origin,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" });
    if (error) throw error;
    return NextResponse.json({ ok: true, message: `تم حفظ إعدادات ${provider === "anderson" ? "Anderson" : "DHD / Ecotrack"} بشكل مشفّر.` });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error, "تعذر حفظ الإعدادات") }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await authorizedAdmin())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const provider = providerFrom(request);
  if (!provider) return NextResponse.json({ error: "شركة التوصيل غير معروفة" }, { status: 400 });
  try {
    const { error } = await db().from("private_integrations").delete().eq("id", integrationId(provider));
    if (error) throw error;
    return NextResponse.json({ ok: true, message: "تم حذف إعدادات الشركة." });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error, "تعذر حذف الإعدادات") }, { status: 500 });
  }
}
