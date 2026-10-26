import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const cairo = Cairo({ subsets: ["arabic", "latin"], display: "swap" });

export const metadata: Metadata = {
  title: `${SITE.name} | بطاقات رقمية ذكية`,
  description: SITE.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} bg-white text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
