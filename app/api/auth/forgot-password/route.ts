import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasNoQueryParams, hasOnlyKeys, isValidEmail, readBoundedJson, readJsonText } from "@/lib/server/input-validation";
import { manageAuthAttemptLimit } from "@/lib/server/auth-attempt-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasNoQueryParams(request)) return NextResponse.json({ error: "البريد الإلكتروني غير صالح." }, { status: 400 });
  const parsed = await readBoundedJson(request, 2048);
  if (!parsed.ok) return NextResponse.json({ error: "البريد الإلكتروني غير صالح." }, { status: 400 });
  const body = parsed.value;
  if (!hasOnlyKeys(body, ["email"])) {
    return NextResponse.json({ error: "البريد الإلكتروني غير صالح." }, { status: 400 });
  }
  const email = readJsonText(body.email, 254, true)?.toLowerCase() || "";
  if (!isValidEmail(email)) return NextResponse.json({ error: "أدخل بريدًا إلكترونيًا صحيحًا." }, { status: 400 });

  const genericRecoveryMessage = "إذا كان البريد مسجلًا، ستصلك رسالة لإعادة تعيين كلمة المرور.";
  const limit = await manageAuthAttemptLimit(request, email, "recovery", "request");
  // Do not reveal whether the address exists or whether its recovery bucket is blocked.
  if (limit.status !== "allowed") {
    return NextResponse.json({ ok: true, message: genericRecoveryMessage });
  }

  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://www.bitaqati.online/auth/callback?next=/reset-password",
    });
    return NextResponse.json({ ok: true, message: genericRecoveryMessage });
  } catch {
    return NextResponse.json({ ok: true, message: genericRecoveryMessage });
  }
}
