export const ADMIN_MFA_COOKIE = "bitaqati_admin_mfa";
export const ADMIN_MFA_IDLE_MS = 30 * 60 * 1000;
export const ADMIN_MFA_MAX_MS = 12 * 60 * 60 * 1000;

export type AdminMfaProof = "totp" | "backup";

export type AdminMfaSession = {
  userId: string;
  sessionId: string;
  issuedAt: number;
  lastActivity: number;
  proof: AdminMfaProof;
};

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function getSigningSecret(): string | null {
  const secret = process.env.CRON_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

async function getHmacKey(): Promise<CryptoKey | null> {
  const secret = getSigningSecret();
  if (!secret || !globalThis.crypto?.subtle) return null;

  return globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export function getSessionIdFromAccessToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const payloadBytes = base64UrlToBytes(parts[1]);
  if (!payloadBytes) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as { session_id?: unknown };
    return typeof payload.session_id === "string" ? payload.session_id : null;
  } catch {
    return null;
  }
}

export async function signAdminMfaSession(session: AdminMfaSession): Promise<string | null> {
  const key = await getHmacKey();
  if (!key) return null;

  const body = bytesToBase64Url(encoder.encode(JSON.stringify(session)));
  const signature = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return `${body}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminMfaSession(
  value: string | undefined,
  userId: string,
  sessionId: string,
  now = Date.now()
): Promise<AdminMfaSession | null> {
  if (!value || !userId || !sessionId) return null;

  const parts = value.split(".");
  if (parts.length !== 2) return null;

  const key = await getHmacKey();
  const signature = base64UrlToBytes(parts[1]);
  const bodyBytes = base64UrlToBytes(parts[0]);
  if (!key || !signature || !bodyBytes) return null;

  let validSignature = false;
  try {
    validSignature = await globalThis.crypto.subtle.verify("HMAC", key, signature, encoder.encode(parts[0]));
  } catch {
    return null;
  }
  if (!validSignature) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(bodyBytes)) as Partial<AdminMfaSession>;
    if (
      parsed.userId !== userId ||
      parsed.sessionId !== sessionId ||
      (parsed.proof !== "totp" && parsed.proof !== "backup") ||
      !Number.isSafeInteger(parsed.issuedAt) ||
      !Number.isSafeInteger(parsed.lastActivity)
    ) return null;

    const issuedAt = parsed.issuedAt as number;
    const lastActivity = parsed.lastActivity as number;
    if (issuedAt > now + 60_000 || lastActivity > now + 60_000) return null;
    if (now - issuedAt > ADMIN_MFA_MAX_MS || now - lastActivity > ADMIN_MFA_IDLE_MS) return null;
    if (lastActivity < issuedAt) return null;

    return {
      userId,
      sessionId,
      issuedAt,
      lastActivity,
      proof: parsed.proof,
    };
  } catch {
    return null;
  }
}
