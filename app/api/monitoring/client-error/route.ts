import { NextResponse } from "next/server";
import { hasNoQueryParams } from "@/lib/server/input-validation";
import { recordSecuritySignal } from "@/lib/server/security-alerts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasNoQueryParams(request)) {
    return NextResponse.json({ ok: false }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  // Count only generic error-boundary visits. Never accept or store stack traces,
  // exception messages, email addresses, route query strings, or request bodies.
  await recordSecuritySignal("client-errors", 10, 300, 900);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
