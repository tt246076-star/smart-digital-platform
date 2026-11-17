import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { hasNoQueryParams, hasOnlyKeys, readBoundedJson } from "@/lib/server/input-validation";
import { sendSecurityAlert } from "@/lib/server/security-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validWebhookSecret(request: Request): boolean {
  const expected = process.env.SECURITY_ALERTS_WEBHOOK_SECRET || "";
  const supplied = request.headers.get("x-bitaqati-alert-key") || "";
  if (!expected || !supplied) return false;

  const expectedHash = createHash("sha256").update(expected, "utf8").digest();
  const suppliedHash = createHash("sha256").update(supplied, "utf8").digest();
  return timingSafeEqual(expectedHash, suppliedHash);
}

export async function POST(request: Request) {
  if (!hasNoQueryParams(request)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (!validWebhookSecret(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await readBoundedJson(request, 8192);
  if (!parsed.ok) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const body = parsed.value;

  if (
    !hasOnlyKeys(body, ["event", "ref", "commit", "actor", "files"]) ||
    (body.event !== "push" && body.event !== "test") ||
    body.ref !== "refs/heads/main" ||
    typeof body.commit !== "string" || !/^[a-f0-9]{7,40}$/i.test(body.commit) ||
    typeof body.actor !== "string" || !/^[a-zA-Z0-9-]{1,39}$/.test(body.actor) ||
    !Array.isArray(body.files) || body.files.length > 100 ||
    body.files.some((path) => typeof path !== "string" || path.length > 240 || !/^[a-zA-Z0-9_./@+ -]+$/.test(path))
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (body.event === "test") {
    const result = await sendSecurityAlert(
      "github-test-alert",
      "اختبار تجريبي من سير عمل GitHub. قناة التنبيه والاتصال بالخادم يعملان.",
      30,
    );
    if (!result.sent) return NextResponse.json({ ok: false, reason: result.reason }, { status: 503 });
    return NextResponse.json({ ok: true });
  }

  const files = (body.files as string[]).slice(0, 15);
  const more = body.files.length > files.length ? `\nو ${body.files.length - files.length} ملفات أخرى.` : "";
  const fileLines = files.length ? files.map((file) => `• ${file}`).join("\n") : "تغيّرت ملفات من المستودع.";
  const result = await sendSecurityAlert(
    "main-site-files-changed",
    `تم دفع تحديث إلى فرع main.\nالمنفّذ: ${body.actor}\nCommit: ${body.commit}\nالملفات:\n${fileLines}${more}`,
    600,
  );
  if (!result.sent) return NextResponse.json({ ok: false, reason: result.reason }, { status: 503 });
  return NextResponse.json({ ok: true });
}
