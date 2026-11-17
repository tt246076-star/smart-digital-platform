import "server-only";
export type SupportedImage={mime:"image/jpeg"|"image/png"|"image/webp"|"image/gif";extension:"jpg"|"png"|"webp"|"gif"};
const TYPES:SupportedImage[]=[{mime:"image/jpeg",extension:"jpg"},{mime:"image/png",extension:"png"},{mime:"image/webp",extension:"webp"},{mime:"image/gif",extension:"gif"}];
/** Inspect file signatures; never trust the filename or client-provided MIME type. */
export function detectSupportedImage(b:Uint8Array):SupportedImage|null{
 if(b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255)return TYPES[0];
 if(b.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v))return TYPES[1];
 if(b.length>=12&&String.fromCharCode(...b.slice(0,4))==="RIFF"&&String.fromCharCode(...b.slice(8,12))==="WEBP")return TYPES[2];
 if(b.length>=6&&["GIF87a","GIF89a"].includes(String.fromCharCode(...b.slice(0,6))))return TYPES[3];
 return null;
}
export async function validateImageFile(file:File,maxBytes:number){
 if(!(file instanceof File)||file.size<1||file.size>maxBytes)return null;
 const buffer=await file.arrayBuffer(),detected=detectSupportedImage(new Uint8Array(buffer));
 return detected?{...detected,blob:new Blob([buffer],{type:detected.mime})}:null;
}
