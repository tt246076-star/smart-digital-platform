"use server";
import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createClient } from "@supabase/supabase-js";

export type AuthLimitAction = "login" | "signup" | "recovery";
export type AuthLimitOperation = "check" | "failure" | "request" | "success" | "attempt";
export type AuthLimitResult =
  | { status: "allowed" }
  | { status: "blocked"; retryAfterSeconds: number }
  | { status: "unavailable" };

function getClientIp(request: Request): string | null {
  // Vercel overwrites X-Forwarded-For with the connecting client's public IP.
  // Do not trust arbitrary forwarded headers or comma-separated proxy chains.
  const forwarded = request.headers.get("x-forwarded-for")?.trim() || "";
  if (forwarded && !forwarded.includes(",") && isIP(forwarded) !== 0) return forwarded;
  if (process.env.NODE_ENV !== "production" && !forwarded) return "127.0.0.1";
  return null;
}

function subjectHash(secret: string, scope: "ip" | "account", value: string): string {
  return createHmac("sha256", secret)
    .update("bitaqati:auth-attempt:v1:" + scope + ":" + value, "utf8")
    .digest("hex");
}

export async function manageAuthAttemptLimit(
  request: Request,
  email: string,
  action: AuthLimitAction,
  operation: AuthLimitOperation,
): Promise<AuthLimitResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ip = getClientIp(request);

  // Fail closed if a trustworthy client IP or the server-only key is unavailable.
  if (!url || !serviceKey || !ip || !email || email.length > 254) {
    return { status: "unavailable" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const ipHash = subjectHash(serviceKey, "ip", ip);
  const accountHash = subjectHash(serviceKey, "account", normalizedEmail);
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.rpc("manage_auth_attempt_limit", {
    p_action: action,
    p_ip_hash: ipHash,
    p_account_hash: accountHash,
    p_operation: operation,
  });

  if (error || !Array.isArray(data) || data.length !== 1) {
    console.error("Authentication attempt limit check failed.");
    return { status: "unavailable" };
  }

  const row = data[0] as { allowed?: unknown; retry_after_seconds?: unknown };
  if (row.allowed === true) return { status: "allowed" };
  if (row.allowed !== false) return { status: "unavailable" };

  const parsedRetry = Number(row.retry_after_seconds);
  const retryAfterSeconds = Number.isFinite(parsedRetry)
    ? Math.max(1, Math.min(900, Math.ceil(parsedRetry)))
    : 900;

  return { status: "blocked", retryAfterSeconds };
}
