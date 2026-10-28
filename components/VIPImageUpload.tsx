"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function VIPImageUpload({ name, label, initialValue = "" }: { name: string; label: string; initialValue?: string }) {
  const [url, setUrl] = useState(initialValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) { setError("اختار ملف صورة فقط."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("حجم الصورة لازم يكون أقل من 5 ميغابايت."); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
      const path = `new/vip-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("landing-logos").upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;
      setUrl(supabase.storage.from("landing-logos").getPublicUrl(path).data.publicUrl);
    } catch {
      setError("ما قدرناش نرفع الصورة. تأكد من إعدادات تخزين الصور في Supabase.");
    } finally {
      setUploading(false);
    }
  }

  return <div>
    <label className="text-sm font-bold" htmlFor={name}>{label} — رفع صورة</label>
    <input type="hidden" name={name} value={url} />
    <input id={name} type="file" accept="image/*" disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 disabled:opacity-60" />
    {uploading && <p className="mt-2 text-xs font-bold text-amber-700">جاري رفع الصورة...</p>}
    {error && <p role="alert" className="mt-2 text-xs font-bold text-red-600">{error}</p>}
    {url && <div className="mt-3 flex items-center gap-3"><img src={url} alt={label} className="h-16 w-16 rounded-xl border object-cover" /><span className="text-xs font-bold text-emerald-700">تم رفع الصورة</span><button type="button" onClick={() => setUrl("")} className="text-xs font-bold text-red-600">حذف</button></div>}
  </div>;
}
