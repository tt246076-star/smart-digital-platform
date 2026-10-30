import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 10;

async function authorizedAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return false;
  const adminEmail = (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase();
  return user.email.trim().toLowerCase() === adminEmail;
}

function allowedHost(url: URL) {
  const host = url.hostname.toLowerCase();
  return url.protocol === "https:" &&
    (host === "platform.dhd-dz.com" || host === "app.conexlog-dz.com" || host.endsWith(".ecotrack.dz"));
}

export async function POST(request: Request) {
  if (!(await authorizedAdmin())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  try {
    const body = await request.json();
    const rawBaseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!rawBaseUrl || !token) return NextResponse.json({ error: "أدخل رابط المنصة و API Token أولاً" }, { status: 400 });

    let base: URL;
    try { base = new URL(rawBaseUrl); } catch {
      return NextResponse.json({ error: "رابط المنصة غير صحيح" }, { status: 400 });
    }
    if (!allowedHost(base) || base.username || base.password || base.port || base.search || base.hash || base.pathname !== "/") {
      return NextResponse.json({ error: "استعمل رابط HTTPS الأساسي الذي أعطته لك شركة التوصيل (مثل https://platform.dhd-dz.com)" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let upstream: Response;
    try {
      upstream = await fetch(new URL("/api/v1/validate/token", base.origin), {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const text = await upstream.text();
    let data: unknown = null;
    try { data = JSON.parse(text); } catch { /* Some providers may return a non-JSON error page. */ }

    if (upstream.ok && typeof data === "object" && data !== null && "success" in data && (data as { success?: unknown }).success === true) {
      return NextResponse.json({ ok: true, message: "نجح الاتصال وEcotrack قبل الـ API Token." });
    }
    if (upstream.status === 401 || upstream.status === 403) {
      return NextResponse.json({ ok: false, error: "رفضت Ecotrack المفتاح. تأكد من API Token ومن تفعيل API لحسابك." }, { status: 200 });
    }
    return NextResponse.json({
      ok: false,
      error: `وصلنا إلى منصة التوصيل لكن نتيجة التحقق غير متوقعة (HTTP ${upstream.status}). تأكد من رابط شركتك ومن صلاحية الـ API.`
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "انتهت مهلة الاتصال. جرّب مرة أخرى."
      : "تعذر الاتصال بمنصة Ecotrack. تحقق من الرابط أو اسأل شركة التوصيل عن مسار API المعتمد.";
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
