import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const cairo = Cairo({ subsets: ["arabic", "latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://smart-digital-platform.vercel.app"),
  title: {
    default: `${SITE.name} | بطاقتك الرقمية الذكية`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "أنشئ صفحة رقمية لنشاطك، اعرض منتجاتك وخدماتك، واجمع معلوماتك وطرق التواصل في رابط واحد سهل المشاركة.",
  applicationName: SITE.name,
  keywords: [
    "بطاقتي",
    "بطاقة رقمية",
    "صفحة نشاط",
    "عرض المنتجات",
    "متاجر الجزائر",
    "التواصل مع الزبائن",
  ],
  openGraph: {
    type: "website",
    locale: "ar_DZ",
    siteName: SITE.name,
    title: `${SITE.name} | بطاقتك الرقمية الذكية`,
    description:
      "اجمع معلومات نشاطك ومنتجاتك وطرق التواصل في صفحة رقمية واحدة سهلة المشاركة.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: `${SITE.name} | بطاقتك الرقمية الذكية`,
    description:
      "صفحة رقمية لنشاطك تجمع المعلومات والمنتجات وطرق التواصل في رابط واحد.",
  },
  icons: {
    icon: "/brand/bitakaty-icon.svg",
    shortcut: "/brand/bitakaty-icon.svg",
    apple: "/brand/bitakaty-icon.svg",
  },
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
