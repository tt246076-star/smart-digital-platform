import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import DeliveryCompaniesPanel from "@/components/DeliveryCompaniesPanel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TrackingDashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  if (user.email?.trim().toLowerCase() !== "tt246076@gmail.com") redirect("/dashboard");

  return (
    <>
      <Header />
      <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="text-sm font-bold text-emerald-700 hover:underline dark:text-emerald-400">← الرجوع إلى لوحة التحكم</Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black">شركات التوصيل</h1>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-800">خاص بصاحب المنصة</span>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
            إدارة شركتي DHD / Ecotrack وAnderson. لكل شركة API Token مستقل واتصال منفصل.
          </p>
          <section className="mt-7"><DeliveryCompaniesPanel /></section>
        </div>
      </main>
    </>
  );
}
