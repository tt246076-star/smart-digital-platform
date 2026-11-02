"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ uploading }: { uploading: boolean }) {
  const { pending } = useFormStatus();
  const disabled = uploading || pending;
  return (
    <button disabled={disabled} type="submit" aria-live="polite" className="w-full rounded-xl bg-blue-600 px-5 py-4 font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
      {uploading ? "انتظر حتى يكتمل رفع الصورة..." : pending ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          جاري إنشاء البطاقة، لا تضغط مرة أخرى...
        </span>
      ) : "إنشاء البطاقة"}
    </button>
  );
}
