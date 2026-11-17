export const SUPABASE_AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
export const SUPABASE_PKCE_COOKIE_MAX_AGE = 10 * 60;

export const SUPABASE_AUTH_COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function getSupabaseCookieOptions(name: string, value: string) {
  return {
    ...SUPABASE_AUTH_COOKIE_BASE_OPTIONS,
    maxAge: value === ""
      ? 0
      : name.endsWith("-code-verifier")
        ? SUPABASE_PKCE_COOKIE_MAX_AGE
        : SUPABASE_AUTH_COOKIE_MAX_AGE,
  };
}

export const SUPABASE_AUTH_COOKIE_OPTIONS = {
  ...SUPABASE_AUTH_COOKIE_BASE_OPTIONS,
  maxAge: SUPABASE_AUTH_COOKIE_MAX_AGE,
};
