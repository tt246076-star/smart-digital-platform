import Link from "next/link";
import { SITE } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/#features", label: "المميزات" },
  { href: "/#gallery", label: "معرض النماذج" },
  { href: "/#pricing", label: "المنتجات والأسعار" },
  { href: "/#how", label: "طريقة العمل" },
  { href: "/#faq", label: "الأسئلة الشائعة" },
];

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase();
  const isAdmin = !!user?.email && user.email.trim().toLowerCase() === adminEmail;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 text-slate-900 backdrop-blur transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href={user ? "/dashboard" : "/"} className="flex shrink-0 items-center gap-2.5 text-xl font-extrabold text-ink dark:text-white" aria-label="بطاقتي - الصفحة الرئيسية">
          <img src="/brand/bitakaty-icon.svg" alt="" className="h-10 w-10 rounded-xl shadow-sm" />
          <span className="leading-none">{SITE.name}<span className="mr-1 bg-gradient-to-l from-emerald-500 via-green-600 to-lime-500 bg-clip-text text-transparent">.</span></span>
        </Link>
        {!user && (
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-brand">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                لوحة التحكم
              </Link>
              {isAdmin && <Link href="/admin" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">لوحة الإدارة</Link>}
              <Link href="/settings" className="rounded-lg border px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800">⚙️ الإعدادات</Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="rounded-lg px-3 py-2 text-sm font-bold text-ink hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800">
                  تسجيل الخروج
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-bold text-ink hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:text-slate-100 dark:hover:bg-slate-800">
                تسجيل الدخول
              </Link>
              <Link href="/signup" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                إنشاء حساب
              </Link>
            </>
          )}
        </div>
      </div>
      {!user && (
        <nav className="flex gap-5 overflow-x-auto border-t border-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
