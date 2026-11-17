let cachedToken = "";
let cachedUntil = 0;

export async function getCsrfToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedUntil) return cachedToken;

  const response = await fetch("/api/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const result: unknown = await response.json().catch(() => null);
  const token = result && typeof result === "object" && "token" in result
    ? (result as { token?: unknown }).token
    : null;

  if (!response.ok || typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    cachedToken = "";
    cachedUntil = 0;
    throw new Error("تعذر التحقق من أمان الطلب. حدّث الصفحة وحاول مجددًا.");
  }

  cachedToken = token;
  cachedUntil = Date.now() + 55 * 60 * 1000;
  return cachedToken;
}

export async function csrfHeaders(): Promise<Record<string, string>> {
  return { "X-CSRF-Token": await getCsrfToken() };
}
