import { NextResponse } from "next/server";
import { ecotrackGet, isEcotrackAdmin, providerError } from "@/lib/ecotrack-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isEcotrackAdmin())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const incoming = new URL(request.url);
  const pageValue = Number(incoming.searchParams.get("page") || "1");
  const page = Number.isInteger(pageValue) && pageValue > 0 ? Math.min(pageValue, 10000) : 1;
  const startDate = incoming.searchParams.get("start_date") || "2024-01-01";
  const endDate = incoming.searchParams.get("end_date") || "2026-12-31";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || startDate > endDate) {
    return NextResponse.json({ error: "نطاق التاريخ غير صالح." }, { status: 400 });
  }
  try {
    const { response, body } = await ecotrackGet("/api/v1/get/orders", {
      page: String(page), start_date: startDate, end_date: endDate,
    });
    if (!response.ok) return NextResponse.json({ error: providerError(response.status), providerStatus: response.status }, { status: response.status === 401 || response.status === 403 ? 502 : response.status });
    return NextResponse.json({ data: body, page, start_date: startDate, end_date: endDate }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "انتهت مهلة الاتصال بشركة التوصيل."
      : error instanceof Error && error.message === "INTEGRATION_MISSING"
        ? "إعدادات Ecotrack غير محفوظة. احفظ API Token من قسم إعدادات الشركة أولاً."
        : error instanceof Error && error.message === "INTEGRATION_READ"
          ? "تعذر قراءة إعدادات Ecotrack من قاعدة البيانات."
          : error instanceof Error && error.message === "SUPABASE_CONFIG"
            ? "إعدادات Supabase على الخادم غير مكتملة."
            : "تعذر الاتصال بشركة التوصيل. تحقق من إعدادات الربط.";
    console.error("[Ecotrack orders]", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
