import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { verifyCsrfRequest } from "@/lib/csrf";
import {
  getSupabaseCookieOptions,
  isSupabaseAuthCookie,
  SUPABASE_AUTH_COOKIE_OPTIONS,
} from "@/lib/supabase/cookie-options";
import {
  ADMIN_MFA_COOKIE,
  getSessionIdFromAccessToken,
  signAdminMfaSession,
  verifyAdminMfaSession,
} from "@/lib/admin-mfa-session";

function isAdminRequest(path: string) {
  return path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/admin/");
}

function isAdminMfaPage(path: string) {
  return path === "/admin/mfa" || path.startsWith("/admin/mfa/");
}

// Re-issue legacy session cookies with the hardened attributes, preserving
// any newer value or deletion written by Supabase during this request.
function hardenSupabaseCookies(response: NextResponse, request: NextRequest) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  const responseCookies = response.cookies.getAll();
  for (const incoming of request.cookies.getAll()) {
    if (!isSupabaseAuthCookie(incoming.name)) continue;
    const pending = responseCookies.find((cookie) => cookie.name === incoming.name);
    if (pending?.value === "") continue;
    response.cookies.set(
      incoming.name,
      pending?.value ?? incoming.value,
      pending?.value
        ? getSupabaseCookieOptions(incoming.name, pending.value)
        : getSupabaseCookieOptions(incoming.name, incoming.value)
    );
  }
}

function adminAuthFailure(request: NextRequest, status: number, message: string) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
  const destination = status === 401 ? "/login" : "/dashboard?error=readonly";
  return NextResponse.redirect(new URL(destination, request.url));
}

function mfaRequired(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "يلزم التحقق بخطوتين للمدير." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.redirect(new URL("/admin/mfa?reason=verify", request.url));
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  const adminRequest = isAdminRequest(path);
  const apiRequest = path.startsWith("/api/");
  const mutatingMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);

  if ((apiRequest || path === "/auth/signout") && mutatingMethod && !verifyCsrfRequest(request)) {
    return NextResponse.json(
      { error: "الطلب غير صالح. حدّث الصفحة وحاول مجددًا." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  // API routes enforce their own authentication and authorization.
  if (apiRequest && !adminRequest) return NextResponse.next({ request });

  if (!url || !key) {
    if (path.startsWith("/dashboard") || adminRequest) {
      return NextResponse.json({ error: "خدمة المصادقة غير متاحة حاليًا" }, { status: 503 });
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, {
            ...options,
            ...getSupabaseCookieOptions(name, value),
          });
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (adminRequest) {
    if (!user) return adminAuthFailure(request, 401, "سجّل الدخول أولًا.");

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!adminEmail) {
      return NextResponse.json({ error: "إعدادات الإدارة غير مكتملة." }, { status: 503 });
    }
    if (user.email?.trim().toLowerCase() !== adminEmail) {
      return adminAuthFailure(request, 403, "غير مسموح.");
    }

    // This is the only admin route available before the second factor is verified.
    if (isAdminMfaPage(path)) {
      hardenSupabaseCookies(response, request);
      return response;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const sessionId = getSessionIdFromAccessToken(session?.access_token);
    if (!sessionId || !process.env.CRON_SECRET) {
      return NextResponse.json({ error: "تعذر التحقق من جلسة الإدارة." }, { status: 503 });
    }

    const currentCookie = request.cookies.get(ADMIN_MFA_COOKIE)?.value;
    const adminSession = await verifyAdminMfaSession(currentCookie, user.id, sessionId);

    if (!adminSession || adminSession.proof !== "totp") {
      const blocked = mfaRequired(request);
      blocked.cookies.set(ADMIN_MFA_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return blocked;
    }

    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "إعدادات الإدارة غير مكتملة." }, { status: 503 });
    }
    const serviceClient = createServiceClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: activeSession, error: sessionCheckError } = await serviceClient.rpc(
      "is_admin_auth_session_active",
      { p_session_id: sessionId }
    );
    if (sessionCheckError || activeSession !== true) {
      const blocked = adminAuthFailure(request, 401, "انتهت جلسة الإدارة. سجّل الدخول مجددًا.");
      blocked.cookies.set(ADMIN_MFA_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return blocked;
    }

    if (assuranceError || assurance?.currentLevel !== "aal2") {
      const blocked = mfaRequired(request);
      blocked.cookies.set(ADMIN_MFA_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return blocked;
    }

    const renewed = await signAdminMfaSession({
      ...adminSession,
      lastActivity: Date.now(),
    });
    if (!renewed) {
      return NextResponse.json({ error: "تعذر تجديد جلسة الإدارة." }, { status: 503 });
    }

    response.cookies.set(ADMIN_MFA_COOKIE, renewed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 12 * 60 * 60,
    });
    hardenSupabaseCookies(response, request);
    return response;
  }

  // تجديد الجلسة والتحقق من المستخدم
  if (!user && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && (path === "/login" || path === "/signup")) {
    const redirected = NextResponse.redirect(new URL("/dashboard", request.url));
    hardenSupabaseCookies(redirected, request);
    return redirected;
  }
  if (user) hardenSupabaseCookies(response, request);
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/admin/:path*",
    "/api/:path*",
    "/auth/signout",
    "/settings/:path*",
    "/pages/:path*",
    "/vip/new",
    "/vip/:slug/edit",
  ],
};
