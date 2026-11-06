"use client";

import { useFormStatus } from "react-dom";

export default function VIPCreateSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex w-full items-center justify-center gap-3 rounded-xl bg-amber-500 px-5 py-4 font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
      type="submit"
      disabled={pending}
      aria-live="polite"
    >
      {pending && (
        <span
          aria-hidden="true"
          className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950"
        />
      )}
      {pending ? "جارٍ إنشاء البطاقة..." : "إنشاء بطاقة"}
    </button>
  );
}
