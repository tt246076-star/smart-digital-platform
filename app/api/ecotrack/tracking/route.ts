import { NextResponse } from "next/server";
import { ecotrackGet, ecotrackFailure, isEcotrackAdmin, providerError, parseEcotrackProvider } from "@/lib/ecotrack-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isEcotrackAdmin())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const incoming = new URL(request.url);
  const provider = parseEcotrackProvider(incoming.searchParams.get("provider"));
  if (!provider) return NextResponse.json({ error: "شركة التوصيل غير معروفة" }, { status: 400 });
  const tracking = incoming.searchParams.get("tracking")?.trim() || "";
  if (!tracking || tracking.length > 120) return NextResponse.json({ error: "أدخل رقم تتبع صالحاً." }, { status: 400 });
  try {
    const { response, body } = await ecotrackGet("/api/v1/get/tracking/info", { tracking }, provider);
    if (!response.ok) return NextResponse.json({ error: providerError(response.status), providerStatus: response.status }, { status: response.status === 401 || response.status === 403 ? 502 : response.status });
    return NextResponse.json({ data: body, tracking, provider }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    const failure = ecotrackFailure(error);
    return NextResponse.json({ error: failure.message, diagnosticCode: failure.code }, { status: 502 });
  }
}
