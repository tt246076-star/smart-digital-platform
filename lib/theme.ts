"use client";
import type { CSSProperties } from "react";
export const THEMES = [
 { id:"white",name:"أبيض",primary:"#f8fafc",soft:"#f3f4f6",dark:"#334155",bg:"#f4f4f5",surface:"#ffffff",border:"#e5e7eb",text:"#111827",muted:"#64748b",defaultMode:"light" },
 { id:"black",name:"أسود",primary:"#09090b",soft:"#27272a",dark:"#000000",bg:"#050505",surface:"#111113",border:"#303038",text:"#fafafa",muted:"#c4c4cc",defaultMode:"dark" },
 { id:"blue",name:"أزرق",primary:"#3b6fe8",soft:"#243e7d",dark:"#111f45",bg:"#0b1530",surface:"#17295a",border:"#354985",text:"#f8fafc",muted:"#c7d2fe",defaultMode:"dark" },
 { id:"violet",name:"بنفسجي",primary:"#8b2be2",soft:"#371658",dark:"#1f0b31",bg:"#140a22",surface:"#251038",border:"#46215e",text:"#faf5ff",muted:"#e9d5ff",defaultMode:"dark" },
 { id:"sunset",name:"غروب",primary:"#d92b5f",soft:"#4e172a",dark:"#2a0a16",bg:"#200711",surface:"#3b1020",border:"#572338",text:"#fff1f2",muted:"#fecdd3",defaultMode:"dark" },
 { id:"emerald",name:"زمردي",primary:"#138565",soft:"#104c3c",dark:"#06281f",bg:"#061d18",surface:"#0d3027",border:"#1d5c4e",text:"#ecfdf5",muted:"#a7f3d0",defaultMode:"dark" },
 { id:"ocean",name:"محيط",primary:"#0e90c5",soft:"#123e5a",dark:"#08273a",bg:"#071b2a",surface:"#0e2e43",border:"#1d526c",text:"#effaff",muted:"#bae6fd",defaultMode:"dark" },
 { id:"rose",name:"وردي",primary:"#df4f91",soft:"#fbeaf2",dark:"#8c315b",bg:"#fff4f8",surface:"#fffafd",border:"#f3c4d8",text:"#3e1630",muted:"#73435d",defaultMode:"light" },
 { id:"gold",name:"ذهبي",primary:"#bb772f",soft:"#4a2f1e",dark:"#29180f",bg:"#1e120b",surface:"#352014",border:"#583923",text:"#fff7ed",muted:"#fed7aa",defaultMode:"dark" },
 { id:"glass",name:"زجاجي",primary:"#64748b",soft:"#1f2937",dark:"#0f172a",bg:"#080d15",surface:"#151d2a",border:"#343e4c",text:"#f8fafc",muted:"#cbd5e1",defaultMode:"dark" },
 { id:"volcano",name:"بركاني",primary:"#a11b35",soft:"#5b1523",dark:"#2c0710",bg:"#300812",surface:"#47101d",border:"#632234",text:"#fff1f2",muted:"#fecdd3",defaultMode:"dark" },
] as const;
export type ResolvedTheme = {
 id:string; name:string; primary:string; mode:"light"|"dark"; bg:string; surface:string; border:string; borderStrong:string;
 text:string; muted:string; primaryText:string; onPrimary:string; callButton:string; onCall:string; whatsapp:string;
 palette:{accent:string;tint:string;ink:string;gradient:string};
};
const HEX_COLOR=/^#[0-9a-fA-F]{6}$/;
function validHex(value:unknown):value is string{return typeof value==="string"&&HEX_COLOR.test(value)}
function luminance(hex:string){const values=hex.slice(1).match(/.{2}/g)!.map(p=>parseInt(p,16)/255);const linear=values.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*linear[0]+.7152*linear[1]+.0722*linear[2]}
function contrastText(hex:string){return luminance(hex)>.42?"#111827":"#ffffff"}
function shade(hex:string,amount:number){const rgb=hex.slice(1).match(/.{2}/g)!.map(p=>parseInt(p,16));return "#"+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v*(1-amount)))).toString(16).padStart(2,"0")).join("")}
function mixTowardWhite(hex:string,amount:number){const rgb=hex.slice(1).match(/.{2}/g)!.map(p=>parseInt(p,16));return "#"+rgb.map(v=>Math.round(v+(255-v)*amount).toString(16).padStart(2,"0")).join("")}
const LEGACY_THEME_MAP:Record<string,string>={midnight:"glass",mint:"emerald",berry:"violet",slate:"glass"};
export function normalizeThemeId(themeId:string|null|undefined){const id=themeId?(LEGACY_THEME_MAP[themeId]||themeId):"blue";return THEMES.some(t=>t.id===id)?id:"blue"}
export function pagePrimary(sections:{theme_primary?:unknown;accent_color?:unknown}|null|undefined){if(validHex(sections?.theme_primary))return sections.theme_primary;if(validHex(sections?.accent_color))return sections.accent_color;return ""}
export function resolveTheme(themeId:string|null|undefined,primaryOverride?:string,requestedMode?:string):ResolvedTheme{
 const id=normalizeThemeId(themeId);const d=THEMES.find(t=>t.id===id)||THEMES[2];const primary=validHex(primaryOverride)?primaryOverride:d.primary;
 const mode:"light"|"dark"=requestedMode==="dark"?"dark":requestedMode==="light"?"light":d.defaultMode;const light=mode==="light";
 const gradient=`linear-gradient(135deg, ${primary}, ${shade(primary,.2)})`;const tint=light?mixTowardWhite(primary,.91):d.soft;
 return {id:d.id,name:d.name,primary,mode,bg:light?"#f7f7f9":d.bg,surface:light?"#ffffff":d.surface,border:light?"#e5e7eb":d.border,borderStrong:light?"#cbd5e1":d.border,text:light?"#111827":d.text,muted:light?"#475569":d.muted,primaryText:contrastText(primary),onPrimary:contrastText(primary),callButton:"#16a34a",onCall:"#ffffff",whatsapp:"#25d366",palette:{accent:primary,tint,ink:d.dark,gradient}};
}
export function themeVars(theme:ResolvedTheme):CSSProperties{return {"--primary":theme.primary,"--primary-text":theme.primaryText,"--on-primary":theme.onPrimary,"--bg":theme.bg,"--surface":theme.surface,"--border":theme.border,"--borderStrong":theme.borderStrong,"--gradient":theme.palette.gradient,"--tint":theme.palette.tint,"--call-button":theme.callButton,"--on-call":theme.onCall,"--whatsapp":theme.whatsapp,"--text":theme.text,"--muted":theme.muted} as CSSProperties}
