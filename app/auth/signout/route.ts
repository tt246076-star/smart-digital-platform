import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseCookieOptions, isSupabaseAuthCookie } from "@/lib/supabase/cookie-options";
import { ADMIN_MFA_COOKIE } from "@/lib/admin-mfa-session";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const authCookieNames = cookieStore.getAll()
    .filter((cookie) => isSupabaseAuthCookie(cookie.name))
    .map((cookie) => cookie.name);

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) {
    // Do not log cookie values, tokens, or user data.
    console.error("Supabase local sign-out could not be confirmed.");
  }

  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.headers.set("Cache-Control", "no-store, max-age=0");

  // Explicitly expire every auth-cookie chunk, even if the Auth request failed.
  for (const name of authCookieNames) {
    response.cookies.set(name, "", {
      ...getSupabaseCookieOptions(name, ""),
      expires: new Date(0),
      maxAge: 0,
    });
  }

  response.cookies.set(ADMIN_MFA_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
