import { NextResponse } from "next/server";
import { ecotrackGet, isEcotrackAdmin, providerError } from "@/lib/ecotrack-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isEcotrackAdmin())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const tracking = new URL(request.url).searchParams.get("tracking")?.trim() || "";
  if (!tracking || tracking.length > 120) return NextResponse.json({ error: "أدخل رقم تتبع صالحاً." }, { status: 400 });
  try {
    const { response, body } = await ecotrackGet("/api/v1/get/tracking/info", { tracking });
    if (!response.ok) return NextResponse.json({ error: providerError(response.status), providerStatus: response.status }, { status: response.status === 401 || response.status === 403 ? 502 : response.status });
    return NextResponse.json({ data: body, tracking }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "انتهت مهلة الاتصال بشركة التوصيل."
      : error instanceof Error && error.message === "INTEGRATION_MISSING"
        ? "إعدادات Ecotrack غير محفوظة. احفظ API Token من قسم إعدادات الشركة أولاً."
        : "تعذر جلب تفاصيل الطرد من شركة التوصيل.";
    console.error("[Ecotrack tracking]", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
