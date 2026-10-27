"use client";

export default function DeleteProductForm({ action, pageId, productIndex, productName }: {
  action: (formData: FormData) => void | Promise<void>;
  pageId: string;
  productIndex: number;
  productName: string;
}) {
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm(`حذف المنتج «${productName || "بدون اسم"}» من كتالوج هذه الصفحة؟`)) event.preventDefault();
  }}>
    <input type="hidden" name="page_id" value={pageId} />
    <input type="hidden" name="product_index" value={productIndex} />
    <button type="submit" className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700">حذف المنتج</button>
  </form>;
}