"use client";

import { useEffect, useState } from "react";

type Props = { value: number; label: string; hint?: string; icon: "users" | "cards" | "trial" | "vip" | "views" | "clicks" | "published" | "drafts"; delay?: number };

const paths: Record<Props["icon"], string> = {
  users: "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M20 8v6 M23 11h-6",
  cards: "M3 6h18v13H3z M3 10h18 M7 15h4",
  trial: "M12 8v4l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  vip: "m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  views: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
  clicks: "M7 17 17 7 M7 7h10v10",
  published: "M4 4h16v16H4z M8 12l3 3 5-6",
  drafts: "M12 8v4l3 2 M12 3a9 9 0 1 0 9 9",
};

export default function AnimatedMetric({ value, label, hint, icon, delay = 0 }: Props) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const duration = 1050;
    let frame = 0;
    let start = 0;
    let raf = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      setShown(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => { raf = requestAnimationFrame(tick); }, delay);
    return () => { window.clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [value, delay]);
  return <article className="ember-metric" style={{ animationDelay: `${delay}ms` }}>
    <div className="ember-metric-top"><span className="ember-metric-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[icon]} /></svg></span><span className="ember-live-dot" /></div>
    <p className="ember-metric-label">{label}</p>
    <strong className="ember-metric-value" aria-label={String(value)}>{shown.toLocaleString("ar-DZ")}</strong>
    {hint && <p className="ember-metric-hint">{hint}</p>}
    <span className="ember-metric-shine" />
  </article>;
}
