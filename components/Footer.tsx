import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {SITE.name}. جميع الحقوق محفوظة.</p>
        <div className="flex gap-5 font-semibold">
          <Link href="/login">تسجيل الدخول</Link>
          <Link href="/signup">إنشاء حساب</Link>
        </div>
      </div>
    </footer>
  );
}
