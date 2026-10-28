import Link from "next/link";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 text-sm text-slate-600">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. جميع الحقوق محفوظة.</p>
          <div className="flex gap-5 font-semibold">
            <Link href="/login">تسجيل الدخول</Link>
            <Link href="/signup">إنشاء حساب</Link>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold text-slate-800">تواصل مع {SITE.name}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href={`tel:${SITE.phone}`} className="font-semibold hover:text-blue-700" dir="ltr">☎ {SITE.phone}</a>
            <a href={`mailto:${SITE.email}`} className="font-semibold hover:text-blue-700">{SITE.email}</a>
            <a href={`https://wa.me/213${SITE.phone.replace(/^0/, "")}`} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 hover:text-emerald-800">واتساب</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
