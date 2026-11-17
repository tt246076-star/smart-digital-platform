import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasOnlyKeys, readBoundedJson, readJsonPassword   hasNoQueryParams,
} from "@/lib/server/input-validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  if (!hasNoQueryParams(request)) return NextResponse.json({ error: "كلمة المرور الجديدة غير صالحة." }, { status: 400 });
  const parsed = await readBoundedJson(request, 2048);
  if (!parsed.ok) return NextResponse.json({ error: "كلمة المرور الجديدة غير صالحة." }, { status: 400 });
  const body = parsed.value;
  if (!hasOnlyKeys(body, ["password"])) {
    return NextResponse.json({ error: "كلمة المرور الجديدة غير صالحة." }, { status: 400 });
  }
  const password = readJsonPassword(body.password, 8, 256);
  if (!password) return NextResponse.json({ error: "كلمة المرور يجب أن تكون بين 8 و256 حرفًا." }, { status: 400 });

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: "انتهت جلستك. سجّل الدخول من جديد." }, { status: 401 });
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return NextResponse.json({ error: "تعذر تغيير كلمة المرور. تحقق من البيانات وحاول مجددًا." }, { status: 400 });
    const { error: sessionsError } = await supabase.auth.signOut({ scope: "others" });
    return NextResponse.json({ ok: true, sessionsEnded: !sessionsError });
  } catch {
    return NextResponse.json({ error: "تعذر تغيير كلمة المرور حاليًا." }, { status: 503 });
  }
}
