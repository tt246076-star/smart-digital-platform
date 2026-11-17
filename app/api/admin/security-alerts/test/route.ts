import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasNoQueryParams } from "@/lib/server/input-validation";
import { sendSecurityAlert } from "@/lib/server/security-alerts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasNoQueryParams(request)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // The /api/admin path is also protected by the existing middleware, including
  // the designated ADMIN_EMAIL allowlist and verified MFA session.
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (error || !user || !adminEmail || user.email?.trim().toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: "غير مسموح." }, { status: 403 });
  }

  const result = await sendSecurityAlert(
    "manual-test-alert",
    "هذا تنبيه تجريبي طلبه المدير. لا يحتوي على أي بيانات سرية أو معلومات حساب.",
    30,
  );
  if (!result.sent) {
    return NextResponse.json(
      { ok: false, message: result.reason === "not_configured"
        ? "لم يتم إعداد قناة Telegram بعد."
        : "تعذر إرسال التنبيه التجريبي." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json({ ok: true, message: "تم إرسال التنبيه التجريبي." }, { headers: { "Cache-Control": "no-store" } });
}
