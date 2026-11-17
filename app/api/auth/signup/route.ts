import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasNoQueryParams, hasOnlyKeys, isValidEmail, readBoundedJson, readJsonPassword, readJsonText } from "@/lib/server/input-validation";
import { manageAuthAttemptLimit } from "@/lib/server/auth-attempt-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasNoQueryParams(request)) return NextResponse.json({ error: "بيانات إنشاء الحساب غير صالحة." }, { status: 400 });
  const parsed = await readBoundedJson(request, 4096);
  if (!parsed.ok) return NextResponse.json({ error: "بيانات إنشاء الحساب غير صالحة." }, { status: 400 });
  const body = parsed.value;
  if (!hasOnlyKeys(body, ["name", "email", "password"])) {
    return NextResponse.json({ error: "بيانات إنشاء الحساب غير صالحة." }, { status: 400 });
  }
  const name = readJsonText(body.name, 80, true);
  const email = readJsonText(body.email, 254, true)?.toLowerCase() || "";
  const password = readJsonPassword(body.password, 8, 256);
  if (!name || name.length < 2 || !isValidEmail(email) || !password) {
    return NextResponse.json({ error: "تحقق من الاسم والبريد الإلكتروني وكلمة المرور." }, { status: 400 });
  }

  const genericSignupMessage = "إذا كانت البيانات صالحة، ستصلك رسالة تأكيد إلى بريدك الإلكتروني.";
  const genericSignupResponse = (hasSession = false) =>
    NextResponse.json(
      { ok: true, hasSession, message: genericSignupMessage },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  const limit = await manageAuthAttemptLimit(request, email, "signup", "attempt");
  if (limit.status === "unavailable") {
    return genericSignupResponse();
  }
  if (limit.status === "blocked") {
    return NextResponse.json(
      { ok: true, hasSession: false, message: genericSignupMessage },
      { status: 200, headers: { "Cache-Control": "no-store", "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: "https://www.bitaqati.online/auth/callback",
      },
    });
    if (error) return genericSignupResponse();
    const cleared = await manageAuthAttemptLimit(request, email, "signup", "success");
    if (cleared.status === "unavailable") console.error("Could not clear successful signup attempt reservation.");
    return genericSignupResponse(!!data.session);
  } catch {
    return genericSignupResponse();
  }
}
