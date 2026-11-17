"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  useEffect(() => {
    void fetch("/api/monitoring/client-error", {
      method: "GET",
      cache: "no-store",
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <main
          role="alert"
          style={{
            boxSizing: "border-box",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <section
            style={{
              boxSizing: "border-box",
              width: "100%",
              maxWidth: "480px",
              padding: "32px",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              background: "#ffffff",
              textAlign: "center",
            }}
          >
            <h1 style={{ margin: "0 0 12px", fontSize: "24px" }}>
              حدث خطأ غير متوقع
            </h1>
            <p style={{ margin: "0 0 24px", color: "#475569", lineHeight: 1.9 }}>
              تعذر تحميل الصفحة الآن. لم تُعرض التفاصيل التقنية حفاظًا على أمان
              الموقع. يرجى إعادة المحاولة.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                border: 0,
                borderRadius: "10px",
                padding: "12px 20px",
                background: "#0f172a",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              إعادة المحاولة
            </button>
            <p style={{ margin: "18px 0 0" }}>
              <a href="/" style={{ color: "#334155" }}>
                العودة للرئيسية
              </a>
            </p>
          </section>
        </main>
      </body>
    </html>
  );
}
