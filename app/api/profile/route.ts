import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasNoQueryParams, hasOnlyKeys, readBoundedJson, readJsonText } from "@/lib/server/input-validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  if (!hasNoQueryParams(request)) {
    return NextResponse.json({ error: "بيانات الملف الشخصي غير صالحة." }, { status: 400 });
  }
  const parsed = await readBoundedJson(request, 2048);
  if (!parsed.ok) {
    const status = parsed.reason === "too_large" ? 413 : parsed.reason === "content_type" ? 415 : 400;
    return NextResponse.json({ error: "بيانات الملف الشخصي غير صالحة." }, { status });
  }

  const body = parsed.value;
  if (!hasOnlyKeys(body, ["display_name"])) {
    return NextResponse.json({ error: "بيانات الملف الشخصي غير صالحة." }, { status: 400 });
  }
  const displayName = readJsonText(body.display_name, 80);
  if (displayName === null) {
    return NextResponse.json({ error: "الاسم الظاهر يجب ألا يتجاوز 80 حرفًا." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "انتهت جلستك. سجّل الدخول من جديد." }, { status: 401 });
    }

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });
    if (authUpdateError) {
      return NextResponse.json({ error: "تعذر حفظ الاسم الظاهر. تحقق من البيانات وحاول مجددًا." }, { status: 400 });
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      { id: user.id, display_name: displayName },
      { onConflict: "id" },
    );
    if (profileError) {
      return NextResponse.json({ error: "تعذر حفظ الملف الشخصي. حاول مجددًا." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "تعذر حفظ الملف الشخصي الآن." }, { status: 500 });
  }
}
