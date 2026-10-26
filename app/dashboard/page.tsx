import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-extrabold">
          أهلًا {profile?.display_name || "بك"}
        </h1>
        <dl className="mt-6 space-y-2 rounded-2xl border border-slate-200 p-6 text-sm">
          <div className="flex gap-2"><dt className="font-bold">البريد:</dt><dd dir="ltr">{user.email}</dd></div>
          <div className="flex gap-2"><dt className="font-bold">اسم المستخدم:</dt><dd dir="ltr">{profile?.username ?? "—"}</dd></div>
        </dl>
        <p className="mt-6 rounded-xl bg-amber/20 p-4 text-sm leading-7">
          حسابك يعمل. إنشاء البطاقات وإدارة الروابط تُضاف في المرحلة القادمة.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button className="rounded-lg border border-slate-300 px-5 py-2 font-bold hover:border-brand">
            تسجيل الخروج
          </button>
        </form>
      </main>
    </>
  );
}
