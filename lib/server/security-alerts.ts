import "server-only";

import { createHash } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type HeaderReader = { get(name: string): string | null };
type AlertResult = { sent: boolean; reason?: "not_configured" | "database" | "throttled" | "telegram" };

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Sends short, data-minimized security notices. The message must never contain
 * credentials, cookies, passwords, tokens, raw IP addresses, or request bodies.
 */
export async function sendSecurityAlert(
  alertKey: string,
  message: string,
  cooldownSeconds: number,
): Promise<AlertResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return { sent: false, reason: "not_configured" };

  const admin = createServiceClient();
  if (!admin) return { sent: false, reason: "database" };

  const { data, error } = await admin.rpc("claim_security_alert", {
    p_alert_key: alertKey,
    p_cooldown_seconds: cooldownSeconds,
  });
  if (error || !Array.isArray(data) || data.length !== 1) {
    console.error("Security alert throttle check failed.");
    return { sent: false, reason: "database" };
  }

  const claim = data[0] as { should_send?: unknown; suppressed_count?: unknown };
  if (claim.should_send !== true) return { sent: false, reason: "throttled" };

  const suppressedCount = Number(claim.suppressed_count);
  const suffix = Number.isFinite(suppressedCount) && suppressedCount > 0
    ? `\nتم تجميع ${Math.min(9999, Math.floor(suppressedCount))} تنبيه متكرر خلال فترة التهدئة.`
    : "";
  const text = (`🔐 بطاقتي — تنبيه أمني\n${message}${suffix}`).slice(0, 3800);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });
    const telegramResult: unknown = await response.json().catch(() => null);
    if (
      !response.ok ||
      !telegramResult ||
      typeof telegramResult !== "object" ||
      (telegramResult as { ok?: unknown }).ok !== true
    ) {
      console.error("Security alert delivery failed (Telegram returned a non-success response).");
      return { sent: false, reason: "telegram" };
    }
    return { sent: true };
  } catch {
    console.error("Security alert delivery failed (Telegram request did not complete).");
    return { sent: false, reason: "telegram" };
  }
}

function getDeviceLabel(userAgent: string): string {
  const ua = userAgent.slice(0, 600);
  const browser =
    /Edg\//i.test(ua) ? "Edge" :
    /Firefox\//i.test(ua) ? "Firefox" :
    /Chrome\//i.test(ua) ? "Chrome" :
    /Safari\//i.test(ua) ? "Safari" : "متصفح آخر";
  const os =
    /Android/i.test(ua) ? "Android" :
    /iPhone|iPad|iPod/i.test(ua) ? "iOS" :
    /Windows/i.test(ua) ? "Windows" :
    /Mac OS|Macintosh/i.test(ua) ? "macOS" :
    /Linux/i.test(ua) ? "Linux" : "نظام آخر";
  const form = /Mobile|Android|iPhone/i.test(ua) ? "هاتف" : /iPad|Tablet/i.test(ua) ? "لوحي" : "حاسوب";
  return `${browser} / ${os} / ${form}`;
}

export async function recordAdminSignInAlert(
  adminUserId: string,
  requestHeaders: HeaderReader,
  deviceId: string,
): Promise<void> {
  const admin = createServiceClient();
  if (!admin) return;

  const userAgent = requestHeaders.get("user-agent") || "unknown";
  // Persist only a one-way fingerprint of a normalized device class, never the
  // raw User-Agent string or the visitor's IP address.
  const deviceClass = getDeviceLabel(userAgent);
  const deviceHash = createHash("sha256").update(deviceId, "utf8").digest("hex");
  const countryHeader = requestHeaders.get("x-vercel-ip-country")?.trim().toUpperCase() || "";
  const country = /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : null;

  const { data, error } = await admin.rpc("record_admin_security_signin", {
    p_admin_user_id: adminUserId,
    p_country_code: country,
    p_device_hash: deviceHash,
  });
  if (error || !Array.isArray(data) || data.length !== 1) {
    console.error("Admin sign-in security monitoring failed.");
    return;
  }

  const row = data[0] as {
    is_new_country?: unknown;
    is_new_device?: unknown;
    is_baseline?: unknown;
  };
  if (row.is_baseline === true || (row.is_new_country !== true && row.is_new_device !== true)) return;

  const changes: string[] = [];
  if (row.is_new_country === true) changes.push(`بلد جديد: ${country || "غير معروف"}`);
  if (row.is_new_device === true) changes.push(`متصفح/جهاز مختلف: ${deviceClass}`);
  await sendSecurityAlert(
    "admin-signin-anomaly",
    `تم تسجيل دخول المدير بنجاح بعد المصادقة الثنائية، مع تغيّر في السياق المعتاد.\n${changes.join("\n")}`,
    3600,
  );
}

export async function recordSecuritySignal(
  signalKey: "client-errors" | "order-volume",
  threshold: number,
  windowSeconds: number,
  cooldownSeconds: number,
): Promise<void> {
  const admin = createServiceClient();
  if (!admin) return;

  const { data, error } = await admin.rpc("record_security_signal", {
    p_signal_key: signalKey,
    p_threshold: threshold,
    p_window_seconds: windowSeconds,
    p_cooldown_seconds: cooldownSeconds,
  });
  if (error || !Array.isArray(data) || data.length !== 1) {
    console.error("Security signal aggregation failed.");
    return;
  }

  const row = data[0] as { should_alert?: unknown; event_count?: unknown };
  if (row.should_alert !== true) return;

  if (signalKey === "client-errors") {
    await sendSecurityAlert(
      "client-errors-spike",
      `ارتفع عدد أخطاء واجهة الموقع إلى ${Number(row.event_count) || threshold} أحداث خلال ${Math.round(windowSeconds / 60)} دقائق. تم إرسال إشارة مجمّعة فقط دون رسائل الخطأ أو بيانات المستخدمين.`,
      cooldownSeconds,
    );
  } else {
    await sendSecurityAlert(
      "order-volume-spike",
      `رُصد ارتفاع غير معتاد في عدد طلبات المنصة: ${Number(row.event_count) || threshold} طلبات خلال ${Math.round(windowSeconds / 60)} دقائق. هذا تنبيه لحجم الطلبات، وليس تأكيدًا على عملية دفع إلكتروني.`,
      cooldownSeconds,
    );
  }
}
