export async function apiGet<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload && typeof payload.error === "string" ? payload.error : "تعذر تنفيذ الطلب";
    throw new Error(message);
  }

  return payload as T;
}
