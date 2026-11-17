export const CSRF_COOKIE_NAME = "bitaqati_csrf";
const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

function readCookie(request: Request): string {
  const values = (request.headers.get("cookie") || "").split(";").map((part) => part.trim());
  const matches = values.filter((part) => part.startsWith(CSRF_COOKIE_NAME + "="));
  if (matches.length !== 1) return "";
  return matches[0].slice(CSRF_COOKIE_NAME.length + 1);
}

export function getCsrfCookieToken(request: Request): string {
  const value = readCookie(request);
  return TOKEN_PATTERN.test(value) ? value : "";
}

export function createCsrfToken(): string {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const allowed = new Set(["https://www.bitaqati.online", "https://bitaqati.online"]);
  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }

  try {
    const parsed = new URL(origin);
    return parsed.origin === origin &&
      allowed.has(origin) &&
      parsed.origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function constantTimeTokenMatch(expected: string, supplied: string): boolean {
  if (!TOKEN_PATTERN.test(expected) || !TOKEN_PATTERN.test(supplied)) return false;
  let difference = 0;
  for (let index = 0; index < 64; index += 1) {
    difference |= expected.charCodeAt(index) ^ supplied.charCodeAt(index);
  }
  return difference === 0;
}

export function verifyCsrfRequest(request: Request): boolean {
  if (!isTrustedOrigin(request)) return false;
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  return constantTimeTokenMatch(
    getCsrfCookieToken(request),
    request.headers.get("x-csrf-token") || ""
  );
}

export function csrfCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 60 * 60 * 2,
  };
}
