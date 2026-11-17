"use client";

import { useState } from "react";
import { csrfHeaders } from "@/lib/client/csrf";

export default function SignOutForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/auth/signout", {
        method: "POST",
        credentials: "same-origin",
        headers: await csrfHeaders(),
      });
      if (!response.ok) throw new Error("signout_failed");
      window.location.assign("/");
    } catch {
      setError("تعذر تسجيل الخروج. حدّث الصفحة وحاول مجددًا.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4">
      {error && <p role="alert" className="mb-2 text-sm font-semibold text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold hover:border-slate-500 disabled:opacity-50 dark:border-slate-700 dark:hover:border-slate-500">
        {busy ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
      </button>
    </form>
  );
}
