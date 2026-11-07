"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "60vh",
        display: "grid",
        placeContent: "center",
        gap: "16px",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <h2>حدث خطأ غير متوقع</h2>
      <p>نعتذر عن الإزعاج. حاول إعادة تحميل الصفحة.</p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          justifySelf: "center",
          border: 0,
          borderRadius: "10px",
          padding: "12px 22px",
          cursor: "pointer",
        }}
      >
        إعادة المحاولة
      </button>
    </main>
  );
}
