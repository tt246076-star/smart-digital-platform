import { NextResponse } from "next/server";
import { ecotrackGet, ecotrackFailure, isEcotrackAdmin, providerError } from "@/lib/ecotrack-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isEcotrackAdmin())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const incoming = new URL(request.url);
  const pageValue = Number(incoming.searchParams.get("page") || "1");
  const page = Number.isInteger(pageValue) && pageValue > 0 ? Math.min(pageValue, 10000) : 1;
  const startDate = incoming.searchParams.get("start_date") || "2024-01-01";
  const endDate = incoming.searchParams.get("end_date") || "2026-12-31";
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(startDate) || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(endDate) || startDate > endDate) {
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
    const failure = ecotrackFailure(error);
    return NextResponse.json({ error: failure.message, diagnosticCode: failure.code }, { status: 502 });
  }
}
