"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STAGING_PREFIX = "staging://";
const STAGING_BUCKET = "landing-logos-staging";

export default function VIPImageUpload({ name, label, initialValue = "", maxFileSizeMB = 2 }: { name: string; label: string; initialValue?: string; maxFileSizeMB?: number }) {
  const [value, setValue] = useState(initialValue);
  const [previewUrl, setPreviewUrl] = useState(initialValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);

  async function discardStagedValue(current: string) {
    if (!current.startsWith(STAGING_PREFIX)) return;
    const path = current.slice(STAGING_PREFIX.length);
    try {
      const supabase = createClient();
      await supabase.storage.from(STAGING_BUCKET).remove([path]);
    } catch {
      // The scheduled one-hour staging cleanup is the safe fallback.
    }
  }

  async function upload(file?: File) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) { setError("اختار ملف صورة فقط."); return; }
    if (file.size > maxFileSizeMB * 1024 * 1024) { setError(`حجم الصورة لازم ما يفوتش ${maxFileSizeMB} MB.`); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Authentication required");
      const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from(STAGING_BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type,
      });
      if (uploadError) throw uploadError;

      const { data: signed, error: signError } = await supabase.storage
        .from(STAGING_BUCKET)
        .createSignedUrl(path, 60 * 60);
      if (signError || !signed?.signedUrl) {
        await supabase.storage.from(STAGING_BUCKET).remove([path]);
        throw signError || new Error("Could not preview uploaded image.");
      }

      const nextValue = `${STAGING_PREFIX}${path}`;
      if (value && value !== nextValue) {
        setRemovedUrls((old) => old.includes(value) ? old : [...old, value]);
      }
      setValue(nextValue);
      setPreviewUrl(signed.signedUrl);
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
    <input type="hidden" name={`${name}_removed`} value={JSON.stringify(removedUrls)} />
    <input id={name} type="file" accept="image/*" disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 disabled:opacity-60" />
    {uploading && <p className="mt-2 text-xs font-bold text-amber-700">جاري رفع الصورة...</p>}
    {error && <p role="alert" className="mt-2 text-xs font-bold text-red-600">{error}</p>}
    {previewUrl && <div className="mt-3 flex items-center gap-3"><img src={previewUrl} alt={label} className="h-16 w-16 rounded-xl border object-cover" /><span className="text-xs font-bold text-emerald-700">تم رفع الصورة بشكل خاص</span><button type="button" onClick={() => void clearImage()} className="text-xs font-bold text-red-600">حذف</button></div>}
  </div>;
}
