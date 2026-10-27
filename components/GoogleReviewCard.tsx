"use client";

import { useState } from "react";

export default function GoogleReviewCard({ reviewUrl, primary, text, muted, surface, border }: {
  reviewUrl?: string;
  primary: string;
  text: string;
  muted: string;
  surface: string;
  border: string;
}) {
  const [rating, setRating] = useState(0);
  return (
    <section className="mx-5 mt-4 rounded-2xl border p-4 text-center sm:mx-7" style={{ background: surface, borderColor: border }}>
      <h2 className="text-base font-black" style={{ color: text }}>كيف تقيّم تجربتك؟</h2>
      <p className="mt-1 text-sm" style={{ color: muted }}>اختار عدد النجوم، وإذا حبيت شارك تقييمك على Google.</p>
      <div className="mt-3 flex items-center justify-center gap-2" role="group" aria-label="اختر تقييمك من نجمة إلى خمس نجوم">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} نجوم`} aria-pressed={rating === star} className="rounded-lg p-1 text-3xl leading-none transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400" style={{ color: star <= rating ? "#f5b51b" : "#cbd5e1" }}>★</button>
        ))}
      </div>
      {rating > 0 && <p className="mt-2 text-sm font-bold" style={{ color: text }}>اخترت {rating} من 5 نجوم</p>}
      {reviewUrl ? (
        <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className={`mx-auto mt-3 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-black transition hover:brightness-105 ${rating ? "" : "opacity-80"}`} style={{ background: primary, color: "#ffffff" }}>
          {rating ? "أكمل تقييمك على Google ↗" : "قيّمنا على Google ↗"}
        </a>
      ) : (
        <p className="mt-3 rounded-xl px-3 py-2 text-xs font-semibold" style={{ color: muted, background: `${primary}12` }}>رابط تقييم Google غير مضاف بعد من إعدادات البطاقة.</p>
      )}
      <p className="mt-2 text-xs leading-5" style={{ color: muted }}>اختيار النجوم هنا لا ينشر تقييمًا تلقائيًا؛ النشر يتم داخل Google بعد تأكيدك.</p>
    </section>
  );
}
