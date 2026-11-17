import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasNoQueryParams, hasOnlyKeys, isValidEmail, readBoundedJson, readJsonPassword, readJsonText } from "@/lib/server/input-validation";
import { manageAuthAttemptLimit } from "@/lib/server/auth-attempt-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasNoQueryParams(request)) return NextResponse.json({ error: "بيانات تسجيل الدخول غير صالحة." }, { status: 400 });
  const parsed = await readBoundedJson(request, 4096);
  if (!parsed.ok) return NextResponse.json({ error: "بيانات تسجيل الدخول غير صالحة." }, { status: 400 });
  const body = parsed.value;
  if (!hasOnlyKeys(body, ["email", "password"])) {
    return NextResponse.json({ error: "بيانات تسجيل الدخول غير صالحة." }, { status: 400 });
  }
  const email = readJsonText(body.email, 254, true)?.toLowerCase() || "";
  const password = readJsonPassword(body.password, 1, 1024);
  if (!isValidEmail(email) || password === null) {
    return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." }, { status: 400 });
  }

  const limit = await manageAuthAttemptLimit(request, email, "login", "attempt");
  const genericLoginMessage = "بيانات الدخول غير صحيحة أو تعذّر تسجيل الدخول مؤقتًا.";
  if (limit.status === "unavailable") {
    return NextResponse.json({ error: genericLoginMessage }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (limit.status === "blocked") {
    return NextResponse.json(
      { error: genericLoginMessage },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } }
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: genericLoginMessage }, { status: 401 });
    const cleared = await manageAuthAttemptLimit(request, email, "login", "success");
    if (cleared.status === "unavailable") console.error("Could not clear successful login attempt reservation.");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: genericLoginMessage }, { status: 503 });
  }
}
