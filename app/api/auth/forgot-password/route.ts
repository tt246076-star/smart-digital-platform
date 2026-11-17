import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasOnlyKeys, isValidEmail, readBoundedJson, readJsonText } from "@/lib/server/input-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = await readBoundedJson(request, 2048);
  if (!parsed.ok) return NextResponse.json({ error: "البريد الإلكتروني غير صالح." }, { status: 400 });
  const body = parsed.value;
  if (!hasOnlyKeys(body, ["email"])) {
    return NextResponse.json({ error: "البريد الإلكتروني غير صالح." }, { status: 400 });
  }
  const email = readJsonText(body.email, 254, true)?.toLowerCase() || "";
  if (!isValidEmail(email)) return NextResponse.json({ error: "أدخل بريدًا إلكترونيًا صحيحًا." }, { status: 400 });

  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://www.bitaqati.online/auth/callback?next=/reset-password",
    });
    // Keep the response identical for known and unknown addresses.
    return NextResponse.json({ ok: true, message: "إذا كان البريد مسجلًا، ستصلك رسالة لإعادة تعيين كلمة المرور." });
  } catch {
    return NextResponse.json({ error: "تعذر إرسال رابط الاستعادة حاليًا. حاول مجددًا." }, { status: 503 });
  }
}
