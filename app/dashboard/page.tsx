
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <Header />

      <main
        dir="rtl"
        className="mx-auto max-w-3xl px-4 py-14"
      >
        <h1 className="text-3xl font-extrabold">
          أهلًا {profile?.display_name || "بك"}
        </h1>

        <dl className="mt-6 space-y-4 rounded-2xl border border-slate-200 p-6 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="font-bold">البريد الإلكتروني:</dt>
            <dd dir="ltr">{user.email || "غير متوفر"}</dd>
          </div>

          <div className="flex flex-wrap gap-2">
            <dt className="font-bold">اسم المستخدم:</dt>
            <dd dir="ltr">{profile?.username || "—"}</dd>
          </div>
        </dl>

        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-7">
          حسابك يعمل. يمكنك استخدام حسابك وإضافة ميزات إنشاء البطاقات وإدارة الروابط لاحقًا.
        </p>

        <form action="/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-5 py-2 font-bold hover:border-slate-500"
          >
            تسجيل الخروج
          </button>
        </form>
      </main>
    </>
  );
}
