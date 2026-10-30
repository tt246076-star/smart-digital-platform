import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 10;

async function authorizedAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return false;
  return user.email.trim().toLowerCase() === "tt246076@gmail.com";
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
      // EcoTrack tenants (including DHD) accept the Bearer token. Some
      // deployed integrations also pass api_token for compatibility, so send
      // both using URLSearchParams rather than string concatenation.
      const validationUrl = new URL("/api/v1/validate/token", base.origin);
      validationUrl.searchParams.set("api_token", token);
      upstream = await fetch(validationUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const text = await upstream.text();
    let data: unknown = null;
    try { data = JSON.parse(text); } catch { /* Some providers may return a non-JSON error page. */ }

    if (upstream.status === 401 || upstream.status === 403) {
      return NextResponse.json({ ok: false, error: "رفضت Ecotrack المفتاح (401/403). تأكد من API Token ومن تفعيل API لحسابك." }, { status: 200 });
    }

    if (upstream.ok && typeof data === "object" && data !== null) {
      const result = data as Record<string, unknown>;
      if (result.success === true) {
        return NextResponse.json({ ok: true, message: "نجح الاتصال وEcotrack قبل الـ API Token." });
      }
      const providerMessage = [result.message, result.error, result.msg]
        .find((value) => typeof value === "string" && value.trim().length > 0);
      if (result.success === false) {
        return NextResponse.json({
          ok: false,
          error: typeof providerMessage === "string"
            ? `Ecotrack رفض الطلب: ${providerMessage.slice(0, 220)}`
            : "Ecotrack ردّ بأن التحقق غير ناجح. راجع صلاحية API Token."
        }, { status: 200 });
      }
      return NextResponse.json({
        ok: false,
        error: `Ecotrack ردّ HTTP ${upstream.status} لكن صيغة JSON غير معروفة. الحقول المستلمة: ${Object.keys(result).slice(0, 8).join(", ") || "لا توجد"}.`
      }, { status: 200 });
    }

    return NextResponse.json({
      ok: false,
      error: `رابط API رجّع HTTP ${upstream.status} بصيغة ${upstream.headers.get("content-type") || "غير معروفة"} وليس JSON للتحقق. راجع رابط الشركة ومسار API.`
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "انتهت مهلة الاتصال. جرّب مرة أخرى."
      : "تعذر الاتصال بمنصة Ecotrack. تحقق من الرابط أو اسأل شركة التوصيل عن مسار API المعتمد.";
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
