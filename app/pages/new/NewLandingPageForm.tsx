"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LandingPageEditor from "../[id]/edit/editor";

type GalleryLimit = { count: number; size: number };

function NewLandingPageContent({ galleryLimit }: { galleryLimit: GalleryLimit }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const emptyPage = {
    id: "new", slug: "", business_name: "", headline: "", description: "",
    phone: "", whatsapp: "", logo_url: "", instagram_url: "", facebook_url: "",
    tiktok_url: "", youtube_url: "", custom_links: [], template: "profile",
    theme: "blue", seo_title: "", seo_description: "",
    sections: { hours: JSON.stringify({}), gallery: [], card_color: "#ffffff" }
  };

  const errorText: Record<string, string> = {
    trial: "انتهت التجربة المجانية. اشترِ منتجًا من المتجر أو تواصل عبر واتساب لتفعيل الحساب.",
    limit: "وصلت إلى الحد المسموح به من البطاقات.",
    name: "اسم النشاط مطلوب ويجب ألا يتجاوز 100 حرف.",
    length: "تحقق من أطوال النصوص وأرقام الهاتف.",
    gallery_limit: "عدد صور المعرض تجاوز الحد المسموح لحسابك.",
    save: "تعذر إنشاء البطاقة. تحقق من الإعدادات ثم حاول مجددًا."
  };

  return <main dir="rtl" className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
    <div className="mx-auto max-w-7xl">
      <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-blue-600">← العودة إلى لوحة التحكم</Link>
      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">بطاقة جديدة</div>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">إنشاء بطاقة عادية</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">نفس واجهة التعديل مع المعاينة المباشرة والقوالب والألوان.</p>
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{errorText[error] || errorText.save}</p>}
        {error === "trial"
          ? <Link href="/dashboard" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">العودة إلى لوحة التحكم</Link>
          : <LandingPageEditor page={emptyPage as any} maxGalleryImages={galleryLimit.count} maxGalleryImageMb={galleryLimit.size} isCreating />}
      </div>
    </div>
  </main>;
}

export default function NewLandingPageForm({ initialGalleryLimit }: { initialGalleryLimit: GalleryLimit }) {
  return <Suspense fallback={<main dir="rtl" className="min-h-screen bg-slate-50 p-8 text-center">جاري تحميل النموذج...</main>}>
    <NewLandingPageContent galleryLimit={initialGalleryLimit} />
  </Suspense>;
}
