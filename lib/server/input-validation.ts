import "server-only";

export type JsonBodyResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: "content_type" | "too_large" | "invalid" };

export async function readBoundedJson(
  request: Request,
  maxBytes = 16_384,
): Promise<JsonBodyResult> {
  const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return { ok: false, reason: "content_type" };

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, reason: "invalid" };

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!isPlainRecord(parsed)) return { ok: false, reason: "invalid" };
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, reason: "invalid" };
  } finally {
    reader.releaseLock();
  }
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const set = new Set(allowed);
  return Object.keys(value).every((key) => set.has(key));
}

export function hasOnlyFormFields(
  formData: FormData,
  allowed: readonly string[],
  dynamicAllowed?: (key: string) => boolean,
): boolean {
  const set = new Set(allowed);
  const seen = new Set<string>();
  for (const [key] of formData.entries()) {
    // React Server Actions attach internal transport fields to submitted forms.
    if (key.startsWith("$ACTION_")) continue;
    if (seen.has(key)) return false;
    seen.add(key);
    if (!set.has(key) && !(dynamicAllowed && dynamicAllowed(key))) return false;
  }
  return true;
}

export function readFormText(
  formData: FormData,
  key: string,
  maxLength: number,
  required = false,
): string | null {
  const values = formData.getAll(key);
  if (values.length === 0) return required ? null : "";
  if (values.length !== 1 || typeof values[0] !== "string") return null;
  const value = values[0].trim();
  if (value.length > maxLength || (required && value.length === 0)) return null;
  return value;
}

export function readFormCheckbox(formData: FormData, key: string): boolean | null {
  const values = formData.getAll(key);
  if (values.length === 0) return false;
  if (values.length !== 1 || values[0] !== "on") return null;
  return true;
}

export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function readJsonText(
  value: unknown,
  maxLength: number,
  required = false,
): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (normalized.length > maxLength || (required && !normalized)) return null;
  return normalized;
}

export function isValidWebUrl(value: string, allowStaging = false): boolean {
  if (!value) return true;
  if (allowStaging && /^staging:\/\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,180}$/i.test(value)) return true;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") &&
      !!url.hostname && !url.username && !url.password && url.href.length <= 2048;
  } catch {
    return false;
  }
}

export function isValidPhone(value: string): boolean {
  if (!value) return true;
  if (!/^\+?[0-9][0-9 ().-]{5,28}$/.test(value)) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidAlgerianMobile(value: string): boolean {
  return /^0[567][0-9]{8}$/.test(value);
}

export function isValidClockTime(value: string): boolean {
  if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) return false;
  return true;
}

export function parseFormNumber(value: string, options: {
  integer?: boolean;
  min?: number;
  max?: number;
} = {}): number | null {
  if (!/^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,2})?$/.test(value)) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (options.integer && !Number.isInteger(number)) return null;
  if (options.min !== undefined && number < options.min) return null;
  if (options.max !== undefined && number > options.max) return null;
  return number;
}
