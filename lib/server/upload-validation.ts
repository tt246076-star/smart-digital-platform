import "server-only";

import sharp from "sharp";

export type SupportedImage = {
  mime: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  extension: "jpg" | "png" | "webp" | "gif";
};

export type NormalizedImage = SupportedImage & {
  bytes: Uint8Array;
  width: number;
  height: number;
  frames: number;
};

const TYPES: SupportedImage[] = [
  { mime: "image/jpeg", extension: "jpg" },
  { mime: "image/png", extension: "png" },
  { mime: "image/webp", extension: "webp" },
  { mime: "image/gif", extension: "gif" },
];

const MAX_IMAGE_DIMENSION = 10_000;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_ANIMATED_FRAMES = 100;
const MAX_TOTAL_FRAME_PIXELS = 60_000_000;

/** Inspect signatures first; the decoder below must also successfully parse the complete image. */
export function detectSupportedImage(bytes: Uint8Array): SupportedImage | null {
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return TYPES[0];
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return TYPES[1];
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return TYPES[2];
  if (bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(String.fromCharCode(...bytes.slice(0, 6)))) return TYPES[3];
  return null;
}

/**
 * Fully decodes and re-encodes an allowlisted raster image.
 * Metadata and trailing/polyglot payloads are not copied to the published object.
 */
export async function normalizeSupportedImage(
  input: Uint8Array,
  maxBytes: number,
): Promise<NormalizedImage | null> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || input.byteLength < 1 || input.byteLength > maxBytes) return null;

  const detected = detectSupportedImage(input);
  if (!detected) return null;

  try {
    const source = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
    const animated = detected.extension === "gif" || detected.extension === "webp";
    const options = {
      animated,
      failOn: "warning" as const,
      limitInputPixels: MAX_IMAGE_PIXELS,
    };

    const metadata = await sharp(source, options).metadata();
    const width = metadata.width ?? 0;
    const height = metadata.pageHeight ?? metadata.height ?? 0;
    const frames = Math.max(1, metadata.pages ?? 1);
    const expectedFormat = detected.extension === "jpg" ? "jpeg" : detected.extension;

    if (
      metadata.format !== expectedFormat ||
      width < 1 ||
      height < 1 ||
      width > MAX_IMAGE_DIMENSION ||
      height > MAX_IMAGE_DIMENSION ||
      width * height > MAX_IMAGE_PIXELS ||
      frames > MAX_ANIMATED_FRAMES ||
      width * height * frames > MAX_TOTAL_FRAME_PIXELS
    ) return null;

    let pipeline = sharp(source, options);
    if (detected.extension === "jpg") {
      pipeline = pipeline.jpeg({ quality: 82, progressive: true, chromaSubsampling: "4:2:0" });
    } else if (detected.extension === "png") {
      pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    } else if (detected.extension === "webp") {
      pipeline = pipeline.webp({ quality: 82, effort: 4 });
    } else {
      pipeline = pipeline.gif({ effort: 3 });
    }

    const output = await pipeline.toBuffer();
    if (output.byteLength < 1 || output.byteLength > maxBytes) return null;

    return {
      ...detected,
      bytes: new Uint8Array(output),
      width,
      height,
      frames,
    };
  } catch {
    return null;
  }
}

export async function validateImageFile(file: File, maxBytes: number) {
  if (!(file instanceof File) || file.size < 1 || file.size > maxBytes) return null;
  const normalized = await normalizeSupportedImage(new Uint8Array(await file.arrayBuffer()), maxBytes);
  return normalized
    ? { ...normalized, blob: new Blob([normalized.bytes], { type: normalized.mime }) }
    : null;
}
