"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  pendingText: string;
  uploading?: boolean;
  uploadingText?: string;
  className: string;
};

export default function FormPendingButton({
  children,
  pendingText,
  uploading = false,
  uploadingText = "انتظر حتى يكتمل الرفع...",
  className,
}: Props) {
  const { pending } = useFormStatus();
  const disabled = pending || uploading;

  return (
    <button type="submit" disabled={disabled} aria-live="polite" className={className}>
      {disabled ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          {uploading ? uploadingText : pendingText}
        </span>
      ) : children}
    </button>
  );
}
