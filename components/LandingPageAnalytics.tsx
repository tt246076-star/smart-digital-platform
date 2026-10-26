"use client";

import { useEffect } from "react";

export default function LandingPageAnalytics({ slug }: { slug: string }) {
  useEffect(() => {
    const send = (eventType: "view" | "contact_click") => {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, eventType }),
        keepalive: true,
      }).catch(() => {});
    };
    send("view");
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-track-event='contact']")) send("contact_click");
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [slug]);

  return null;
}
