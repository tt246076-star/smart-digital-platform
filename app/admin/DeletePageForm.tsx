"use client";

import { useState } from "react";

export default function DeletePageForm({ action, pageId }: { action: (formData: FormData) => void | Promise<void>; pageId: string }) {
  const [confirming, setConfirming] = useState(false);
  return <form action={action} onSubmit={(event) => {
    if (!confirming) {
      event.preventDefault();
      if (window.confirm("هل أنت متأكد من حذف هذه الصفحة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.")) {
        setConfirming(true);
        event.currentTarget.requestSubmit();
      }
    }
  }}>
    <input type="hidden" name="page_id" value={pageId} />
    <button type="submit" className="rounded-xl border border-red-200 px-4 py-2 font-bold text-red-700">حذف الصفحة</button>
  </form>;
}
