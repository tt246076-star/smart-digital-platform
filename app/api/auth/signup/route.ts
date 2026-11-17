import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasOnlyKeys, isValidEmail, readBoundedJson, readJsonPassword, readJsonText   hasNoQueryParams,
} from "@/lib/server/input-validation";

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
    if (error) return NextResponse.json({ error: "تعذر إنشاء الحساب. تحقق من البيانات وحاول مجددًا." }, { status: 400 });
    return NextResponse.json({ ok: true, hasSession: !!data.session }, { status: data.session ? 201 : 200 });
  } catch {
    return NextResponse.json({ error: "تعذر إنشاء الحساب حاليًا. حاول مجددًا." }, { status: 503 });
  }
}
