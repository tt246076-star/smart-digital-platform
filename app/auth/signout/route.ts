import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Revoke only this browser's refresh-token session; other devices stay signed in.
  // Supabase also clears the session cookies through the server cookie adapter.
  await supabase.auth.signOut({ scope: "local" });

  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
