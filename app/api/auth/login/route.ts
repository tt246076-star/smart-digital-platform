import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasOnlyKeys, isValidEmail, readBoundedJson, readJsonPassword, readJsonText   hasNoQueryParams,
} from "@/lib/server/input-validation";

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

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." }, { status: 401 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر تسجيل الدخول حاليًا. حاول مجددًا." }, { status: 503 });
  }
}
