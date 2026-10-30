import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function key() {
  const raw = process.env.ECOTRACK_ENCRYPTION_KEY;
  if (!raw) throw new Error("ECOTRACK_ENCRYPTION_KEY is not configured");
  const normalized = raw.startsWith("hex:") ? Buffer.from(raw.slice(4), "hex") : Buffer.from(raw, "base64");
  if (normalized.length !== 32) throw new Error("ECOTRACK_ENCRYPTION_KEY must decode to 32 bytes (base64 or hex:...)");
  return normalized;
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64")).join(".");
}

export function decryptSecret(value: string) {
  const [ivText, tagText, dataText] = value.split(".");
  if (!ivText || !tagText || !dataText) throw new Error("Invalid encrypted secret");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivText, "base64"));
  decipher.setAuthTag(Buffer.from(tagText, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataText, "base64")), decipher.final()]).toString("utf8");
}
