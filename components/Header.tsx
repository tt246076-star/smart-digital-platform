import Link from "next/link";
import { SITE } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/#features", label: "المميزات" },
  { href: "/#how", label: "طريقة العمل" },
  { href: "/#pricing", label: "الأسعار" },
  { href: "/#faq", label: "الأسئلة الشائعة" },
];

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href={user ? "/dashboard" : "/"} className="text-xl font-extrabold text-ink">
          {SITE.name}
          <span className="text-brand">.</span>
        </Link>
        {!user && (
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
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
              <form action="/auth/signout" method="post">
                <button type="submit" className="rounded-lg px-3 py-2 text-sm font-bold text-ink hover:bg-slate-100">
                  تسجيل الخروج
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-bold text-ink hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
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
        <nav className="flex gap-5 overflow-x-auto border-t border-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 md:hidden">
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
