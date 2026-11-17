"use client";

import { useEffect } from "react";

import { csrfHeaders } from "@/lib/client/csrf";
export default function LandingPageAnalytics({ slug }: { slug: string }) {
  useEffect(() => {
    const send = async (eventType: "view" | "contact_click") => {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
        body: JSON.stringify({ slug, eventType }),
        keepalive: true,
      }).catch(() => {});
    };
    void send("view").catch(() => {});
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-track-event='contact']")) void send("contact_click").catch(() => {});
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [slug]);

  return null;
}
