"use client";

import { useState } from "react";
import VIPImageUpload from "@/components/VIPImageUpload";

const themes = [
  { id: "gold", name: "ذهبي فخم", color: "#C9A86A", card: "#2D1E14" },
  { id: "silver", name: "فضي", color: "#9CA3AF", card: "#282b31" },
  { id: "emerald", name: "زمردي", color: "#10B981", card: "#0F2A1F" },
  { id: "ruby", name: "ياقوتي", color: "#EF4444", card: "#2A0F14" },
  { id: "lavender", name: "لافندر", color: "#A78BFA", card: "#291a37" },
  { id: "pink", name: "وردي", color: "#EC4899", card: "#3b1c2c" },
  { id: "dark", name: "داكن", color: "#9CA3AF", card: "#1F2937" },
] as const;

type VIPCustomizerProps = {
  currentTheme?: string;
  currentBackground?: string;
  animationOn?: boolean;
  currentLayout?: string;
  showSubmit?: boolean;
};

export default function VIPCustomizer({
  currentTheme = "gold",
  currentBackground = "",
  animationOn = true,
  currentLayout = "classic",
  showSubmit = true,
}: VIPCustomizerProps) {
  const [theme, setTheme] = useState(themes.some((item) => item.id === currentTheme) ? currentTheme : "gold");
  const [layout, setLayout] = useState(currentLayout === "salon" ? "salon" : "classic");
  const [animation, setAnimation] = useState(animationOn);

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
      <h2 className="text-lg font-extrabold text-slate-900">🎨 تخصيص مظهر VIP</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">هذه الإعدادات تظهر للزوار في البطاقة. اختر المظهر والخلفية من هنا فقط.</p>

      <input type="hidden" name="theme" value={theme} />
      <input type="hidden" name="layout" value={layout} />

      <div className="mt-4">
        <span className="text-sm font-bold text-slate-800">نوع تصميم البطاقة</span>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => setLayout("classic")} aria-pressed={layout === "classic"} className={`rounded-2xl border-2 p-4 text-right transition ${layout === "classic" ? "border-slate-900 bg-white ring-2 ring-amber-300" : "border-slate-200 bg-white hover:border-amber-400"}`}>
            <span className="mb-3 flex h-20 items-center justify-center rounded-xl bg-gradient-to-br from-stone-900 to-stone-700"><span className="h-12 w-12 rounded-full border-2 border-amber-300 bg-stone-800 shadow-lg" /></span>
            <strong className="block text-sm text-slate-900">VIP كلاسيكي</strong>
            <small className="mt-1 block text-xs text-slate-500">بطاقة أنيقة بترتيب بسيط ومباشر</small>
            <span className="mt-2 block text-xs font-bold text-amber-700">{layout === "classic" ? "✓ التصميم المختار" : "اختيار التصميم"}</span>
          </button>
          <button type="button" onClick={() => setLayout("salon")} aria-pressed={layout === "salon"} className={`rounded-2xl border-2 p-4 text-right transition ${layout === "salon" ? "border-pink-700 bg-white ring-2 ring-pink-200" : "border-slate-200 bg-white hover:border-pink-300"}`}>
            <span className="mb-3 flex h-20 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 via-stone-100 to-amber-300"><span className="relative h-12 w-12 rounded-full border-2 border-white bg-white/70 shadow-lg"><span className="absolute -right-1 bottom-0 h-4 w-4 rounded-full bg-amber-500" /></span></span>
            <strong className="block text-sm text-slate-900">VIP شامل لكل الأنشطة</strong>
            <small className="mt-1 block text-xs text-slate-500">نفس التصميم الفاخر مناسب للمحلات والخدمات والمطاعم والرياضة وغيرها</small>
            <span className="mt-2 block text-xs font-bold text-amber-700">{layout === "salon" ? "✓ التصميم المختار" : "اختيار التصميم"}</span>
          </button>
        </div>
      </div>

      <div className="mt-4">
        <span className="text-sm font-bold text-slate-800">اختر الثيم</span>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {themes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTheme(item.id)}
              aria-pressed={theme === item.id}
              className={`rounded-xl border-2 p-3 text-right transition ${theme === item.id ? "border-slate-900 ring-2 ring-amber-300" : "border-slate-200 hover:border-amber-400"}`}
              style={{ backgroundColor: item.card }}
            >
              <span className="mb-2 block h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="block text-xs font-extrabold text-white">{item.name}</span>
              <span className="mt-1 block text-[10px] text-white/70">{theme === item.id ? "✓ مختار" : "اختيار"}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-white bg-white p-3">
        <VIPImageUpload name="backgroundImage" label="صورة الخلفية المضببة" initialValue={currentBackground} />
        <p className="mt-2 text-xs leading-5 text-slate-500">إذا لم ترفع خلفية منفصلة، ستُستخدم صورة غلاف المحل تلقائيًا. الخلفية تظهر خلف البطاقة مع طمس وتعتيم.</p>
      </div>

      <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <span><strong className="block text-sm text-slate-800">حركة الخلفية والأيقونات</strong><small className="mt-1 block text-xs text-slate-500">إيقاف الحركة لا يؤثر على ظهور البطاقة أو الروابط.</small></span>
        <input type="checkbox" name="animation" checked={animation} onChange={(event) => setAnimation(event.target.checked)} className="h-5 w-5 shrink-0 accent-amber-600" />
      </label>

      {showSubmit && <button type="submit" className="mt-4 w-full rounded-xl bg-slate-900 px-5 py-3 font-extrabold text-white transition hover:bg-slate-700">حفظ المظهر</button>}
    </section>
  );
}
