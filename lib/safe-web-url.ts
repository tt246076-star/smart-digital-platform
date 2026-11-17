export function safeWebUrl(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048 ||
      /[\u0000-\u0020\u007f]/.test(value)) return "";

  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") ||
        !url.hostname || url.username || url.password) return "";
    return url.href;
  } catch {
    return "";
  }
}
