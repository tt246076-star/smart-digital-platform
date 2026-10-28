"use client";

import { useState } from "react";
import VIPImageUpload from "@/components/VIPImageUpload";

const themes = [
  { id: "gold", name: "ذهبي ملكي", color: "#f5d7a5", card: "#342014" },
  { id: "silver", name: "فضي لؤلؤي", color: "#e7edf5", card: "#172338" },
  { id: "emerald", name: "زمرد فاخر", color: "#b9edce", card: "#103927" },
  { id: "ruby", name: "ياقوت أحمر", color: "#ffc6d2", card: "#451021" },
  { id: "lavender", name: "لافندر", color: "#e8d0ff", card: "#2f194a" },
  { id: "pink", name: "وردي حريري", color: "#ffc6e1", card: "#4b1534" },
  { id: "dark", name: "ليل بنفسجي", color: "#39264d", card: "#171525" },
  { id: "ocean", name: "أزرق محيطي", color: "#b8e8f5", card: "#0c2c3c" },
  { id: "sunset", name: "غروب دافئ", color: "#ffd0ad", card: "#4a201c" },
  { id: "mint", name: "نعناع منعش", color: "#c7f3e7", card: "#123c37" },
  { id: "royal", name: "أزرق ملكي", color: "#cbd4ff", card: "#151d50" },
  { id: "noir", name: "أسود وذهبي", color: "#f0c76a", card: "#080808" },
  { id: "copper", name: "نحاسي", color: "#f1c9ad", card: "#3b2118" },
  { id: "ice", name: "جليدي", color: "#e0f5ff", card: "#18384a" },
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
  showSubmit = true,
}: VIPCustomizerProps) {
  const [theme, setTheme] = useState(themes.some((item) => item.id === currentTheme) ? currentTheme : "gold");
  const layout = "salon";
  const [animation, setAnimation] = useState(animationOn);

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
      <h2 className="text-lg font-extrabold text-slate-900">🎨 تخصيص مظهر VIP</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">هذه الإعدادات تظهر للزوار في البطاقة. اختر المظهر والخلفية من هنا فقط.</p>

      <input type="hidden" name="theme" value={theme} />
      <input type="hidden" name="layout" value={layout} />

      <div className="mt-4 rounded-xl border border-amber-200 bg-white p-3">
        <strong className="block text-sm text-slate-900">تصميم VIP شامل لكل الأنشطة</strong>
        <p className="mt-1 text-xs leading-5 text-slate-600">غيّر الثيم بالأسفل لتتغير ألوان البطاقة نفسها، وليس معاينة الاختيار فقط.</p>
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
