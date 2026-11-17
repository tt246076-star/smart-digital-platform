"use client";

import { useState } from "react";
import {
  discardStagedLandingImage,
  uploadStagedLandingImage,
} from "@/lib/client/staged-landing-images";

export default function VIPImageUpload({ name, label, initialValue = "", maxFileSizeMB = 2 }: { name: string; label: string; initialValue?: string; maxFileSizeMB?: number }) {
  const [value, setValue] = useState(initialValue);
  const [previewUrl, setPreviewUrl] = useState(initialValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

  async function discardStagedValue(current: string) {
    if (!current.startsWith("staging://")) return;
    try {
      await discardStagedLandingImage(current);
    } catch {
      // The scheduled one-hour staging cleanup is the safe fallback.
    }
  }

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (!allowedTypes.includes(file.type)) { setError("اختار صورة JPG أو PNG أو WebP أو GIF أو AVIF فقط."); return; }
    if (file.size > Math.min(maxFileSizeMB, 5) * 1024 * 1024) { setError(`حجم الصورة لازم ما يفوتش ${maxFileSizeMB} MB.`); return; }
    setUploading(true);
    try {
      const staged = await uploadStagedLandingImage(file);
      if (value && value !== staged.value) {
        setRemovedUrls((old) => old.includes(value) ? old : [...old, value]);
      }
      setValue(staged.value);
      setPreviewUrl(staged.previewUrl);
    } catch {
      setError("ما قدرناش نرفع الصورة الخاصة. حاول مجددًا.");
    } finally {
      setUploading(false);
    }
  }

  async function clearImage() {
    if (value) {
      setRemovedUrls((old) => old.includes(value) ? old : [...old, value]);
      await discardStagedValue(value);
    }
    setValue("");
    setPreviewUrl("");
  }

  return <div>
    <label className="text-sm font-bold" htmlFor={name}>{label} — رفع صورة</label>
    <input type="hidden" name={name} value={value} />
    <input type="hidden" name={name + "_removed"} value={JSON.stringify(removedUrls)} />
    <input id={name} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 disabled:opacity-60" />
    {uploading && <p className="mt-2 text-xs font-bold text-amber-700">جاري رفع الصورة...</p>}
    {error && <p role="alert" className="mt-2 text-xs font-bold text-red-600">{error}</p>}
    {previewUrl && <div className="mt-3 flex items-center gap-3"><img src={previewUrl} alt={label} className="h-16 w-16 rounded-xl border object-cover" /><span className="text-xs font-bold text-emerald-700">تم رفع الصورة بشكل خاص</span><button type="button" onClick={() => void clearImage()} className="text-xs font-bold text-red-600">حذف</button></div>}
  </div>;
}
