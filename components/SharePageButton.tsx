"use client";

import { useState } from "react";

export default function SharePageButton({ slug, basePath = "/p/" }: { slug: string; basePath?: string }) {
  const [copied, setCopied] = useState(false);
  async function sharePage() {
    const url = `${window.location.origin}${basePath}${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "صفحة على بطاقاتي", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        window.prompt("انسخ رابط صفحتك:", url);
      }
    }
  }
  return <button type="button" onClick={sharePage} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200">{copied ? "تم نسخ الرابط ✓" : "مشاركة الرابط ↗"}</button>;
}
