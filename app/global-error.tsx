"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeContent: "center",
          padding: "24px",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
          color: "#222",
        }}
      >
        <main>
          <h2>حدث خطأ غير متوقع</h2>
          <p>نعتذر عن الإزعاج. حاول إعادة تحميل الصفحة.</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              border: 0,
              borderRadius: "10px",
              padding: "12px 22px",
              cursor: "pointer",
            }}
          >
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
