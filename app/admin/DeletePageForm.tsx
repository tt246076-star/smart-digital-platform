"use client";

export default function DeletePageForm({ action, pageId }: { action: (formData: FormData) => void | Promise<void>; pageId: string }) {
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الصفحة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.")) event.preventDefault();
  }}>
    <input type="hidden" name="page_id" value={pageId} />
    <button type="submit" className="rounded-xl border border-red-200 px-4 py-2 font-bold text-red-700">حذف الصفحة</button>
  </form>;
}
