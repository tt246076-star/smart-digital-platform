import type { CSSProperties } from "react";

export const THEMES = [
  { id: "violet", name: "بنفسجي", primary: "#6d4aff", soft: "#f0ecff", dark: "#25164f" },
  { id: "ocean", name: "أزرق بحري", primary: "#087eaa", soft: "#e7f7fc", dark: "#103746" },
  { id: "sunset", name: "غروب", primary: "#e76b36", soft: "#fff1e9", dark: "#512714" },
  { id: "emerald", name: "زمردي", primary: "#16805d", soft: "#e7f7ef", dark: "#143b2c" },
  { id: "rose", name: "وردي", primary: "#d94678", soft: "#fff0f5", dark: "#55172e" },
  { id: "midnight", name: "ليلي", primary: "#475569", soft: "#eef2f7", dark: "#172033" },
  { id: "gold", name: "ذهبي", primary: "#a97716", soft: "#fff8e5", dark: "#44300c" },
  { id: "mint", name: "نعناعي", primary: "#0f9488", soft: "#e6faf6", dark: "#123f3b" },
  { id: "berry", name: "توتي", primary: "#9333a8", soft: "#faedff", dark: "#42134c" },
  { id: "slate", name: "رمادي", primary: "#475569", soft: "#f1f5f9", dark: "#1e293b" },
] as const;

export type ResolvedTheme = {
  id: string; name: string; primary: string; mode: "light" | "dark";
  bg: string; surface: string; border: string; borderStrong: string;
  text: string; muted: string; primaryText: string; onPrimary: string;
  callButton: string; onCall: string; whatsapp: string;
  palette: { accent: string; tint: string; ink: string; gradient: string };
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
function validHex(value: unknown): value is string { return typeof value === "string" && HEX_COLOR.test(value); }
function luminance(hex: string) {
  const values = hex.slice(1).match(/.{2}/g)!.map((part) => parseInt(part, 16) / 255);
  const linear = values.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrastText(hex: string) { return luminance(hex) > 0.42 ? "#111827" : "#ffffff"; }
function shade(hex: string, amount: number) {
  const rgb = hex.slice(1).match(/.{2}/g)!.map((part) => parseInt(part, 16));
  return "#" + rgb.map((value) => Math.max(0, Math.min(255, Math.round(value * (1 - amount)))).toString(16).padStart(2, "0")).join("");
}
export function pagePrimary(sections: { theme_primary?: unknown; accent_color?: unknown } | null | undefined) {
  if (validHex(sections?.theme_primary)) return sections.theme_primary;
  if (validHex(sections?.accent_color)) return sections.accent_color;
  return "";
}
export function resolveTheme(themeId: string | null | undefined, primaryOverride?: string, requestedMode?: string): ResolvedTheme {
  const definition = THEMES.find((item) => item.id === themeId) || THEMES[0];
  const primary = validHex(primaryOverride) ? primaryOverride : definition.primary;
  const mode: "light" | "dark" = requestedMode === "dark" ? "dark" : "light";
  const gradient = `linear-gradient(135deg, ${primary}, ${shade(primary, 0.2)})`;
  return {
    id: definition.id, name: definition.name, primary, mode,
    bg: mode === "dark" ? "#0f172a" : "#ffffff", surface: "#ffffff",
    border: "#e2e8f0", borderStrong: "#cbd5e1", text: "#111827", muted: "#475569",
    primaryText: contrastText(primary), onPrimary: contrastText(primary),
    callButton: "#16a34a", onCall: "#ffffff", whatsapp: "#25d366",
    palette: { accent: primary, tint: mode === "dark" ? "#f1f5f9" : definition.soft, ink: definition.dark, gradient },
  };
}
export function themeVars(theme: ResolvedTheme): CSSProperties {
  return {
    "--primary": theme.primary, "--primary-text": theme.primaryText, "--on-primary": theme.onPrimary,
    "--bg": theme.bg, "--surface": theme.surface, "--border": theme.border, "--borderStrong": theme.borderStrong,
    "--gradient": theme.palette.gradient, "--call-button": theme.callButton, "--on-call": theme.onCall,
    "--whatsapp": theme.whatsapp, "--text": theme.text, "--muted": theme.muted,
  } as CSSProperties;
}
