import "server-only";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/ecotrack-secrets";

export const ECOTRACK_ADMIN_EMAIL = "tt246076@gmail.com";

export async function isEcotrackAdmin() {
  const supabase = await createSessionClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return !error && user?.email?.trim().toLowerCase() === ECOTRACK_ADMIN_EMAIL;
}

async function getIntegration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("SUPABASE_CONFIG");
  const db = createSupabaseAdmin(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from("private_integrations")
    .select("encrypted_secret,base_url").eq("id", "ecotrack").maybeSingle();
  if (error) throw new Error("INTEGRATION_READ");
  if (!data?.encrypted_secret || !data?.base_url) throw new Error("INTEGRATION_MISSING");
  const base = new URL(data.base_url);
  if (base.protocol !== "https:" || base.hostname !== "platform.dhd-dz.com" || base.pathname !== "/" || base.port || base.username || base.password) {
    throw new Error("INTEGRATION_URL");
  }
  return { base, token: decryptSecret(data.encrypted_secret) };
}

export async function ecotrackGet(path: string, params?: Record<string, string>) {
  const { base, token } = await getIntegration();
  const url = new URL(path, base.origin);
  if (params) for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  // DHD deployments have historically required both Bearer and api_token.
  url.searchParams.set("api_token", token);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    const raw = await response.text();
    let body: unknown;
    try { body = JSON.parse(raw); } catch { body = { message: "شركة التوصيل أعادت استجابة غير صالحة بصيغة JSON" }; }
    return { response, body };
  } finally {
    clearTimeout(timer);
  }
}

export function providerError(status: number) {
  if (status === 401 || status === 403) return "رفضت شركة التوصيل المصادقة. تحقق من API Token المحفوظ.";
  if (status === 404) return "مسار API غير موجود لدى شركة التوصيل (404).";
  if (status === 429) return "طلبات كثيرة على API شركة التوصيل. حاول لاحقاً.";
  return `فشل طلب شركة التوصيل (HTTP ${status}).`;
}
