import { NextResponse } from "next/server";
import {
  createCsrfToken,
  csrfCookieOptions,
  getCsrfCookieToken,
  CSRF_COOKIE_NAME,
} from "@/lib/csrf";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = getCsrfCookieToken(request) || createCsrfToken();
  const response = NextResponse.json(
    { token },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
  response.cookies.set(CSRF_COOKIE_NAME, token, csrfCookieOptions());
  return response;
}
