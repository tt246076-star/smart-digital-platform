import "server-only";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/ecotrack-secrets";

export const ECOTRACK_ADMIN_EMAIL = "tt246076@gmail.com";
export type EcotrackProvider = "dhd" | "anderson";

type EcotrackFailureCode =
  | "SUPABASE_CONFIG" | "INTEGRATION_READ" | "INTEGRATION_MISSING"
  | "INTEGRATION_URL" | "SECRET_DECRYPTION" | "PROVIDER_TIMEOUT" | "PROVIDER_NETWORK";

export class EcotrackApiError extends Error {
  code: EcotrackFailureCode;
  constructor(code: EcotrackFailureCode) {
    super(code);
    this.name = "EcotrackApiError";
    this.code = code;
  }
}

export async function isEcotrackAdmin() {
  const supabase = await createSessionClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return !error && user?.email?.trim().toLowerCase() === ECOTRACK_ADMIN_EMAIL;
}

export function parseEcotrackProvider(value: string | null | undefined): EcotrackProvider | null {
  if (!value || value === "dhd") return "dhd";
  if (value === "anderson") return "anderson";
  return null;
}

async function getIntegration(provider: EcotrackProvider = "dhd") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new EcotrackApiError("SUPABASE_CONFIG");

  const db = createSupabaseAdmin(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const integrationId = provider === "anderson" ? "ecotrack_anderson" : "ecotrack";
  const { data, error } = await db.from("private_integrations")
    .select("encrypted_secret,base_url").eq("id", integrationId).maybeSingle();
  if (error) throw new EcotrackApiError("INTEGRATION_READ");
  if (!data?.encrypted_secret || !data?.base_url) throw new EcotrackApiError("INTEGRATION_MISSING");

  let base: URL;
  try { base = new URL(data.base_url); } catch { throw new EcotrackApiError("INTEGRATION_URL"); }
  const expectedHost = provider === "anderson" ? "anderson-ecommerce.ecotrack.dz" : "platform.dhd-dz.com";
  if (base.protocol !== "https:" || base.hostname.toLowerCase() !== expectedHost || base.pathname !== "/" || base.port || base.username || base.password) {
    throw new EcotrackApiError("INTEGRATION_URL");
  }

  let token: string;
  try { token = decryptSecret(data.encrypted_secret); } catch { throw new EcotrackApiError("SECRET_DECRYPTION"); }
  return { base, token };
}

export async function ecotrackGet(path: string, params?: Record<string, string>, provider: EcotrackProvider = "dhd") {
  const { base, token } = await getIntegration(provider);
  const url = new URL(path, base.origin);
  if (params) for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("api_token", token);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw new EcotrackApiError("PROVIDER_TIMEOUT");
      throw new EcotrackApiError("PROVIDER_NETWORK");
    }
    const raw = await response.text();
    let body: unknown;
    try { body = JSON.parse(raw); } catch { body = { message: "شركة التوصيل أعادت استجابة غير صالحة بصيغة JSON" }; }
    return { response, body };
  } finally {
    clearTimeout(timer);
  }
}

export function ecotrackFailure(error: unknown) {
  const code = error instanceof EcotrackApiError ? error.code : "UNKNOWN";
  const messages: Record<string, string> = {
    SUPABASE_CONFIG: "إعدادات Supabase الخاصة بالخادم ناقصة على Vercel (URL أو Service Role Key).",
    INTEGRATION_READ: "تعذر قراءة إعداد شركة التوصيل من قاعدة البيانات.",
    INTEGRATION_MISSING: "ما كاش إعداد محفوظ لهذه الشركة. افتح إعداداتها واحفظ API Token.",
    INTEGRATION_URL: "رابط API المحفوظ لا يطابق نطاق الشركة المحدد.",
    SECRET_DECRYPTION: "تعذر فك تشفير API Token. تحقق من ECOTRACK_ENCRYPTION_KEY في Vercel؛ لا تغيّره عشوائيًا.",
    PROVIDER_TIMEOUT: "انتهت مهلة اتصال الخادم بمنصة شركة التوصيل. حاول لاحقاً.",
    PROVIDER_NETWORK: "تعذر إنشاء اتصال آمن مع منصة شركة التوصيل.",
    UNKNOWN: "حدث خطأ غير متوقع أثناء قراءة إعدادات شركة التوصيل أو الاتصال بها.",
  };
  console.error("[Ecotrack API]", { code, errorName: error instanceof Error ? error.name : "UnknownError" });
  return { code, message: messages[code] || messages.UNKNOWN };
}

export function providerError(status: number) {
  if (status === 401 || status === 403) return "رفضت شركة التوصيل المصادقة. تحقق من صلاحية API Token المحفوظ.";
  if (status === 404) return "مسار API غير موجود لدى شركة التوصيل (404).";
  if (status === 429) return "طلبات كثيرة على API شركة التوصيل. حاول لاحقاً.";
  return `فشل طلب شركة التوصيل (HTTP ${status}).`;
}
