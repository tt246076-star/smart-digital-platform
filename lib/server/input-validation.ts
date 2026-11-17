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
  if (value.length > maxLength || (required && value.length === 0) || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value)) return null;
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
  if (normalized.length > maxLength || (required && !normalized) || /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(normalized)) return null;
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

const REGULAR_FORM_FIELDS = [
  "id", "business_name", "headline", "description", "seo_title", "seo_description",
  "phone", "phone2", "whatsapp", "logo_url", "instagram_url", "facebook_url",
  "tiktok_url", "youtube_url", "custom_label", "custom_url", "template", "theme",
  "sections", "removed_image_urls",
] as const;

const SECTION_FIELDS = [
  "address", "map_url", "hours", "theme_primary", "theme_mode",
  "round_image_url", "cover_image_url", "gallery", "contact_numbers",
] as const;

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export type ValidatedLandingPageInput = {
  id: string;
  business_name: string;
  headline: string;
  description: string;
  seo_title: string;
  seo_description: string;
  phone: string;
  phone2: string;
  whatsapp: string;
  logo_url: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  youtube_url: string;
  custom_links: { label: string; url: string }[];
  template: string;
  theme: string;
  sections: {
    address: string;
    map_url: string;
    hours: string;
    theme_primary: string;
    theme_mode: string;
    round_image_url: string;
    cover_image_url: string;
    gallery: string[];
    contact_numbers: { phone: string; name: string }[];
  };
};

export function validateLandingPageFormData(
  formData: FormData,
  maxGalleryImages: number,
  updating: boolean,
): ValidatedLandingPageInput | null {
  if (!hasOnlyFormFields(formData, REGULAR_FORM_FIELDS)) return null;
  const id = readFormText(formData, "id", 36);
  const business_name = readFormText(formData, "business_name", 100, true);
  const headline = readFormText(formData, "headline", 140);
  const description = readFormText(formData, "description", 1000);
  const seo_title = readFormText(formData, "seo_title", 60);
  const seo_description = readFormText(formData, "seo_description", 160);
  const phone = readFormText(formData, "phone", 30);
  const phone2 = readFormText(formData, "phone2", 30);
  const whatsapp = readFormText(formData, "whatsapp", 30);
  const logo_url = readFormText(formData, "logo_url", 2048);
  const instagram_url = readFormText(formData, "instagram_url", 2048);
  const facebook_url = readFormText(formData, "facebook_url", 2048);
  const tiktok_url = readFormText(formData, "tiktok_url", 2048);
  const youtube_url = readFormText(formData, "youtube_url", 2048);
  const custom_label = readFormText(formData, "custom_label", 40);
  const custom_url = readFormText(formData, "custom_url", 2048);
  const template = readFormText(formData, "template", 32, true);
  const theme = readFormText(formData, "theme", 32, true);
  const sectionsJson = readFormText(formData, "sections", 12_000, true);
  const removedImagesJson = readFormText(formData, "removed_image_urls", 12_000);
  if (
    id === null || business_name === null || headline === null || description === null ||
    seo_title === null || seo_description === null || phone === null || phone2 === null ||
    whatsapp === null || logo_url === null || instagram_url === null || facebook_url === null ||
    tiktok_url === null || youtube_url === null || custom_label === null || custom_url === null ||
    template === null || theme === null || sectionsJson === null || removedImagesJson === null
  ) return null;
  if ((updating && !isValidUuid(id)) || (!updating && id !== "")) return null;
  if (!isValidPhone(phone) || !isValidPhone(phone2) || !isValidPhone(whatsapp)) return null;
  for (const value of [logo_url, instagram_url, facebook_url, tiktok_url, youtube_url, custom_url]) {
    if (!isValidWebUrl(value, true)) return null;
  }
  if ((custom_label && !custom_url) || (!custom_label && custom_url)) return null;

  const templates = ["profile", "aurora", "store", "minimal", "bold", "beauty", "agency", "restaurant", "portfolio"];
  const themes = ["white", "black", "blue", "violet", "sunset", "emerald", "ocean", "rose", "gold", "glass", "volcano", "midnight", "mint", "berry", "slate"];
  if (!templates.includes(template) || !themes.includes(theme)) return null;

  let rawSections: unknown;
  try {
    rawSections = JSON.parse(sectionsJson);
  } catch {
    return null;
  }
  if (!isPlainRecord(rawSections) || !hasOnlyKeys(rawSections, SECTION_FIELDS)) return null;
  const address = readJsonText(rawSections.address ?? "", 200);
  const map_url = readJsonText(rawSections.map_url ?? "", 2048);
  const hours = readJsonText(rawSections.hours ?? "", 1000, true);
  const theme_primary = readJsonText(rawSections.theme_primary ?? "", 7);
  const theme_mode = readJsonText(rawSections.theme_mode ?? "", 5);
  const round_image_url = readJsonText(rawSections.round_image_url ?? "", 2048);
  const cover_image_url = readJsonText(rawSections.cover_image_url ?? "", 2048);
  if (
    address === null || map_url === null || hours === null || theme_primary === null ||
    theme_mode === null || round_image_url === null || cover_image_url === null
  ) return null;
  if (theme_primary && !/^#[0-9a-f]{6}$/i.test(theme_primary)) return null;
  if (theme_mode && theme_mode !== "light" && theme_mode !== "dark") return null;
  for (const value of [map_url, round_image_url, cover_image_url]) {
    if (!isValidWebUrl(value, true)) return null;
  }

  let parsedHours: unknown;
  try {
    parsedHours = JSON.parse(hours);
  } catch {
    return null;
  }
  if (!isPlainRecord(parsedHours) || !hasOnlyKeys(parsedHours, WEEKDAYS)) return null;
  if (WEEKDAYS.some((day) => {
    const value = parsedHours[day];
    return !isPlainRecord(value) ||
      !hasOnlyKeys(value, ["open", "from", "to"]) ||
      typeof value.open !== "boolean" ||
      typeof value.from !== "string" || !isValidClockTime(value.from) ||
      typeof value.to !== "string" || !isValidClockTime(value.to);
  })) return null;

  if (!Array.isArray(rawSections.gallery) || rawSections.gallery.length > Math.max(0, maxGalleryImages)) return null;
  const gallery = rawSections.gallery.map((value) => typeof value === "string" ? value.trim() : "");
  if (gallery.some((value) => !value || value.length > 2048 || !isValidWebUrl(value, true))) return null;

  if (!Array.isArray(rawSections.contact_numbers) || rawSections.contact_numbers.length > 2) return null;
  const contact_numbers: { phone: string; name: string }[] = [];
  for (const item of rawSections.contact_numbers) {
    if (!isPlainRecord(item) || !hasOnlyKeys(item, ["phone", "name"])) return null;
    if (typeof item.phone !== "string" || typeof item.name !== "string") return null;
    const contactPhone = item.phone.trim();
    const contactName = item.name.trim();
    if (contactPhone.length > 30 || contactName.length > 40 || !isValidPhone(contactPhone)) return null;
    if (contactPhone) contact_numbers.push({ phone: contactPhone, name: contactName });
  }

  let removedImages: unknown;
  try {
    removedImages = removedImagesJson ? JSON.parse(removedImagesJson) : [];
  } catch {
    return null;
  }
  if (!Array.isArray(removedImages) || removedImages.length > 50 ||
      removedImages.some((item) => typeof item !== "string" || item.length > 2048 || !isValidWebUrl(item, true))) return null;

  return {
    id, business_name, headline, description, seo_title, seo_description, phone, phone2, whatsapp,
    logo_url, instagram_url, facebook_url, tiktok_url, youtube_url,
    custom_links: custom_label && custom_url ? [{ label: custom_label, url: custom_url }] : [],
    template, theme,
    sections: { address, map_url, hours, theme_primary, theme_mode, round_image_url, cover_image_url, gallery, contact_numbers },
  };
}

const VIP_BASE_FIELDS = [
  "slug", "name", "bio", "logo", "cover", "backgroundImage", "theme", "layout", "animation",
  "phone", "phone_name", "phone2", "phone2_name", "whatsapp", "instagram", "tiktok",
  "facebook", "google", "map", "address",
] as const;

const VIP_DAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"] as const;

export function isValidVipFormData(
  formData: FormData,
  maxGalleryImages: number,
  editing: boolean,
): boolean {
  const allowed = new Set<string>(VIP_BASE_FIELDS);
  if (!editing) allowed.delete("slug");
  for (const day of VIP_DAYS) {
    allowed.add(day + "_open");
    allowed.add(day + "_from");
    allowed.add(day + "_to");
  }
  const isDynamicAllowed = (key: string) => {
    if (["logo_removed", "cover_removed", "backgroundImage_removed"].includes(key)) return true;
    const match = /^gallery_([1-9][0-9]*)(_removed)?$/.exec(key);
    if (!match) return false;
    const index = Number(match[1]);
    return Number.isSafeInteger(index) && index <= maxGalleryImages;
  };
  if (!hasOnlyFormFields(formData, [...allowed], isDynamicAllowed)) return false;

  const slug = readFormText(formData, "slug", 120, editing);
  const name = readFormText(formData, "name", 100, true);
  const bio = readFormText(formData, "bio", 400);
  const logo = readFormText(formData, "logo", 2048);
  const cover = readFormText(formData, "cover", 2048);
  const background = readFormText(formData, "backgroundImage", 2048);
  const theme = readFormText(formData, "theme", 16);
  const layout = readFormText(formData, "layout", 16);
  const phone = readFormText(formData, "phone", 30);
  const phoneName = readFormText(formData, "phone_name", 40);
  const phone2 = readFormText(formData, "phone2", 30);
  const phone2Name = readFormText(formData, "phone2_name", 40);
  const whatsapp = readFormText(formData, "whatsapp", 30);
  const instagram = readFormText(formData, "instagram", 2048);
  const tiktok = readFormText(formData, "tiktok", 2048);
  const facebook = readFormText(formData, "facebook", 2048);
  const google = readFormText(formData, "google", 2048);
  const map = readFormText(formData, "map", 2048);
  const address = readFormText(formData, "address", 200);
  if (
    slug === null || name === null || bio === null || logo === null || cover === null ||
    background === null || theme === null || layout === null || phone === null ||
    phoneName === null || phone2 === null || phone2Name === null || whatsapp === null ||
    instagram === null || tiktok === null || facebook === null || google === null ||
    map === null || address === null
  ) return false;
  if (editing && !/^[a-z0-9][a-z0-9-]{0,119}$/i.test(slug)) return false;
  if (theme && !["gold", "silver", "emerald", "ruby", "lavender", "pink", "dark", "ocean", "sunset", "mint", "royal", "noir", "copper", "ice"].includes(theme)) return false;
  if (layout && !["classic", "salon"].includes(layout)) return false;
  if (![phone, phone2, whatsapp].every(isValidPhone)) return false;
  if (![logo, cover, background, instagram, tiktok, facebook, google, map].every((value) => isValidWebUrl(value, true))) return false;

  const animation = readFormCheckbox(formData, "animation");
  if (animation === null) return false;
  for (const day of VIP_DAYS) {
    const open = readFormCheckbox(formData, day + "_open");
    const from = readFormText(formData, day + "_from", 5);
    const to = readFormText(formData, day + "_to", 5);
    if (open === null || from === null || to === null) return false;
    if ((from && !isValidClockTime(from)) || (to && !isValidClockTime(to))) return false;
  }

  for (let index = 1; index <= maxGalleryImages; index++) {
    const gallery = readFormText(formData, "gallery_" + index, 2048);
    if (gallery === null || !isValidWebUrl(gallery, true)) return false;
  }

  for (const [key, value] of formData.entries()) {
    if (!key.endsWith("_removed") || key.startsWith("$ACTION_")) continue;
    if (typeof value !== "string" || value.length > 12_000) return false;
    let removed: unknown;
    try {
      removed = JSON.parse(value);
    } catch {
      return false;
    }
    if (!Array.isArray(removed) || removed.length > 20 ||
        removed.some((item) => typeof item !== "string" || item.length > 2048 || !isValidWebUrl(item, true))) return false;
  }

  return true;
}

export function isValidAlgerianWilayaCode(value: unknown): value is string {
  return typeof value === "string" && /^(0[1-9]|[1-4][0-9]|5[0-8])$/.test(value);
}
