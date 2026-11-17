import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getSupabaseCookieOptions,
  SUPABASE_AUTH_COOKIE_OPTIONS,
} from "@/lib/supabase/cookie-options";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                ...getSupabaseCookieOptions(name, value),
              });
            });
          } catch {
            // قد لا يُسمح بتعديل ملفات الارتباط أثناء عرض الصفحة؛
            // تُكتب عند تنفيذ Server Action أو Route Handler.
          }
        },
      },
    }
  );
}
