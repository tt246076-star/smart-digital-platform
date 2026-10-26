"use client";

import { useEffect, useState } from "react";

export default function DashboardThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("batakati-dashboard-theme");
    const initialDark = saved === "dark";
    setDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("batakati-dashboard-theme", next ? "dark" : "light");
  }

  return (
    <button type="button" onClick={toggle} aria-label={dark ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي"} aria-pressed={dark}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
      <span aria-hidden="true" className="text-lg">{dark ? "☀️" : "🌙"}</span>
      {dark ? "الوضع النهاري" : "الوضع الليلي"}
    </button>
  );
}
