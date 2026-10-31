import { NextResponse } from "next/server";
import { ecotrackGet, ecotrackFailure, isEcotrackAdmin, providerError } from "@/lib/ecotrack-api";

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
    const failure = ecotrackFailure(error);
    return NextResponse.json({ error: failure.message, diagnosticCode: failure.code }, { status: 502 });
  }
}
