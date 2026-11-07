import { cleanupStalePendingLandingPageImages } from "@/lib/server/storage-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await cleanupStalePendingLandingPageImages();
  if (!result.ok) {
    return Response.json({ ok: false, message: "Storage cleanup aborted safely." }, { status: 500 });
  }

  return Response.json({ ok: true, candidates_checked: result.candidates, grace_period_hours: 24 });
}
