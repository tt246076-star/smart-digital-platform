import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { decryptSecret } from "@/lib/ecotrack-secrets";

export const runtime = "nodejs";
export const maxDuration = 30;

async function authorizedAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return false;
  return user.email.trim().toLowerCase() === "tt246076@gmail.com";
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Server-side Supabase service credentials are not configured");
  return createSupabaseAdmin(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function allowedHost(url: URL) {
  const host = url.hostname.toLowerCase();
  return url.protocol === "https:" &&
    (host === "platform.dhd-dz.com" || host === "app.conexlog-dz.com" || host.endsWith(".ecotrack.dz")) &&
    !url.username && !url.password && !url.port && !url.search && !url.hash && url.pathname === "/";
}

async function getJson(base: URL, path: string, token: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    // Match the working connection test: DHD/EcoTrack may require api_token
    // in the query string as well as the Bearer authorization header.
    const requestUrl = new URL(path, base.origin);
    requestUrl.searchParams.set("api_token", token);
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    const raw = await response.text();
    let data: unknown = null;
    try { data = JSON.parse(raw); } catch { /* Keep response body out of diagnostics. */ }
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

function unwrap(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (record.data !== undefined) return record.data;
  if (record.result !== undefined) return record.result;
  return value;
}

function rows(value: unknown): Record<string, unknown>[] {
  const source = unwrap(value);
  if (Array.isArray(source)) return source.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  if (source && typeof source === "object") return Object.values(source as Record<string, unknown>)
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  return [];
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function textOrEmpty(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function normalizeFees(value: unknown) {
  const source = unwrap(value);
  if (!source || typeof source !== "object") return [];
  const record = source as Record<string, unknown>;
  const delivery = rows(record.livraison);
  const returns = rows(record.retours);
  const exchanges = rows(record.echnage);
  const byWilaya = new Map<number, Record<string, unknown>>();
  for (const item of delivery) {
    const id = numberOrNull(item.wilaya_id);
    if (id === null) continue;
    byWilaya.set(id, {
      wilayaId: id,
      home: numberOrNull(item.tarif),
      stopDesk: numberOrNull(item.tarif_stopdesk),
    });
  }
  for (const item of returns) {
    const id = numberOrNull(item.wilaya_id);
    if (id === null) continue;
    const previous = byWilaya.get(id) || { wilayaId: id };
    previous.returnHome = numberOrNull(item.tarif);
    previous.returnStopDesk = numberOrNull(item.tarif_stopdesk);
    byWilaya.set(id, previous);
  }
  for (const item of exchanges) {
    const id = numberOrNull(item.wilaya_id);
    if (id === null) continue;
    const previous = byWilaya.get(id) || { wilayaId: id };
    previous.exchangeHome = numberOrNull(item.tarif);
    previous.exchangeStopDesk = numberOrNull(item.tarif_stopdesk);
    byWilaya.set(id, previous);
  }
  return [...byWilaya.values()].sort((a, b) => Number(a.wilayaId) - Number(b.wilayaId));
}

export async function POST() {
  if (!(await authorizedAdmin())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });

  let phase: "database" | "url" | "decrypt" | "provider" = "database";
  try {
    const { data: integration, error } = await db()
      .from("private_integrations")
      .select("encrypted_secret,base_url")
      .eq("id", "ecotrack")
      .maybeSingle();
    if (error) throw error;
    if (!integration?.encrypted_secret || !integration?.base_url) {
      return NextResponse.json({ error: "احفظ إعدادات DHD أولاً." }, { status: 400 });
    }

    phase = "url";
    const base = new URL(integration.base_url);
    if (!allowedHost(base)) return NextResponse.json({ error: "رابط شركة التوصيل المحفوظ غير مسموح." }, { status: 400 });

    phase = "decrypt";
    const token = decryptSecret(integration.encrypted_secret);

    phase = "provider";
    const checks = await Promise.allSettled([
      getJson(base, "/api/v1/validate/token", token),
      getJson(base, "/api/v1/get/wilayas", token),
      getJson(base, "/api/v1/get/communes", token),
      getJson(base, "/api/v1/get/fees", token),
    ]);

    const result = checks.map((entry) => entry.status === "fulfilled"
      ? entry.value
      : { ok: false, status: 0, data: null });
    const [validation, wilayaResponse, communeResponse, feeResponse] = result;
    const validationData = unwrap(validation.data);
    const validationRecord = validationData && typeof validationData === "object"
      ? validationData as Record<string, unknown> : {};
    const tokenValid = validation.ok && validationRecord.success === true;

    const wilayas = rows(wilayaResponse.data).map((item) => ({
      id: numberOrNull(item.wilaya_id ?? item.id),
      name: textOrEmpty(item.wilaya_name ?? item.name ?? item.nom),
    })).filter((item) => item.id !== null && item.name);

    const communes = rows(communeResponse.data).map((item) => ({
      name: textOrEmpty(item.nom ?? item.name ?? item.commune_name),
      wilayaId: numberOrNull(item.wilaya_id ?? item.wilayaId),
      postalCode: textOrEmpty(item.code_postal ?? item.postal_code ?? item.zip_code),
      hasStopDesk: Boolean(Number(item.has_stop_desk ?? item.hasStopDesk ?? 0)),
    })).filter((item) => item.name);

    const fees = normalizeFees(feeResponse.data);
    return NextResponse.json({
      ok: tokenValid && wilayaResponse.ok && communeResponse.ok && feeResponse.ok,
      tokenValid,
      checks: {
        token: { ok: tokenValid, httpStatus: validation.status },
        wilayas: { ok: wilayaResponse.ok, httpStatus: wilayaResponse.status },
        communes: { ok: communeResponse.ok, httpStatus: communeResponse.status },
        fees: { ok: feeResponse.ok, httpStatus: feeResponse.status },
      },
      summary: {
        wilayasCount: wilayas.length,
        communesCount: communes.length,
        stopDeskCommunesCount: communes.filter((item) => item.hasStopDesk).length,
        feeWilayasCount: fees.length,
      },
      wilayas,
      communesSample: communes.slice(0, 12),
      fees,
      note: "الفحص قراءة فقط: لم يتم إنشاء أو تعديل أو إلغاء أي شحنة. تتبع الشحنات يحتاج رقم تتبع حقيقي.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    let diagnosticCode = "DIAGNOSTICS_FAILED";
    let message = "تعذر إكمال فحص بيانات الشركة.";

    if (phase === "database") {
      diagnosticCode = "INTEGRATION_STORAGE";
      message = "تعذر قراءة إعدادات الربط من قاعدة البيانات. تحقق من إعدادات Supabase على Vercel.";
    } else if (phase === "url") {
      diagnosticCode = "INVALID_SAVED_URL";
      message = "رابط الشركة المحفوظ غير صالح. أعد حفظ https://platform.dhd-dz.com.";
    } else if (phase === "decrypt") {
      diagnosticCode = "SECRET_DECRYPTION";
      if (detail.includes("ECOTRACK_ENCRYPTION_KEY is not configured")) {
        message = "مفتاح التشفير ECOTRACK_ENCRYPTION_KEY غير موجود في Vercel.";
      } else if (detail.includes("must decode to 32 bytes")) {
        message = "قيمة ECOTRACK_ENCRYPTION_KEY في Vercel بصيغة غير صحيحة؛ يجب أن تتحول إلى 32 بايت.";
      } else {
        message = "المفتاح محفوظ لكن تعذّر فك تشفيره. غالبًا تغيّرت ECOTRACK_ENCRYPTION_KEY بعد حفظه. أعد في Vercel نفس قيمة المفتاح القديمة، أو أدخل API Token جديدًا واحفظه بعد تثبيت مفتاح التشفير الصحيح.";
      }
    } else if (error instanceof Error && error.name === "AbortError") {
      diagnosticCode = "PROVIDER_TIMEOUT";
      message = "انتهت مهلة اتصال أحد مسارات DHD.";
    }

    // Log only the failure stage and error class; never log tokens or response bodies.
    console.error("[Ecotrack diagnostics]", { phase, errorName: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: message, diagnosticCode }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
