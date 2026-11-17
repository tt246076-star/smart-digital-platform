import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const keys = [...searchParams.keys()];
  const codes = searchParams.getAll("code");
  const nextValues = searchParams.getAll("next");
  const requestedNext = nextValues[0] || "/dashboard";
  const next = requestedNext === "/dashboard" || requestedNext === "/reset-password"
    ? requestedNext
    : null;
  const code = codes[0];

  if (
    keys.some((key) => key !== "code" && key !== "next") ||
    codes.length !== 1 ||
    nextValues.length > 1 ||
    typeof code !== "string" ||
    code.length < 1 || code.length > 2048 ||
    !/^[\x21-\x7e]+$/.test(code) ||
    !next
  ) {
    return NextResponse.redirect(new URL("/login?error=confirm", origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } catch {
    // Keep provider details out of the response.
  }
  return NextResponse.redirect(new URL("/login?error=confirm", origin));
}
