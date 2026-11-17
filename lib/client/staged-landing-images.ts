"use client";
import {csrfHeaders} from "@/lib/client/csrf";
import {createStagingUploadClient} from "@/lib/supabase/storage-client";
const BUCKET="landing-logos-staging",STAGING_PREFIX="staging://",MAX_FILE_BYTES=5*1024*1024;
const ALLOWED_MIME_TYPES=["image/jpeg","image/png","image/webp","image/gif","image/avif"];
type ApiResult={path?:string;token?:string;signedUrl?:string;error?:string};
async function callStagingApi(payload:Record<string,unknown>):Promise<ApiResult>{
 const response=await fetch("/api/storage/staged-landing-image",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{Accept:"application/json","Content-Type":"application/json",...(await csrfHeaders())},body:JSON.stringify(payload)});
 const result:unknown=await response.json().catch(()=>null);
 if(!response.ok||!result||typeof result!=="object"){const message=result&&typeof result==="object"&&"error"in result&&typeof(result as {error?:unknown}).error==="string"?(result as {error:string}).error:"تعذر تنفيذ عملية رفع الصورة.";throw new Error(message);}
 return result as ApiResult;
}
export async function uploadStagedLandingImage(file:File):Promise<{value:string;previewUrl:string}>{
 if(!file||!ALLOWED_MIME_TYPES.includes(file.type)||file.size<1||file.size>MAX_FILE_BYTES)throw new Error("اختار صورة JPG أو PNG أو WebP أو GIF أو AVIF بحجم لا يتجاوز 5 ميغابايت.");
 const created=await callStagingApi({action:"create",size:file.size});
 if(typeof created.path!=="string"||typeof created.token!=="string")throw new Error("تعذر تجهيز رابط رفع آمن.");
 const storage=createStagingUploadClient(),{error}=await storage.storage.from(BUCKET).uploadToSignedUrl(created.path,created.token,file,{contentType:file.type});
 if(error){await callStagingApi({action:"delete",path:created.path}).catch(()=>undefined);throw new Error("تعذر رفع الصورة إلى التخزين.");}
 try{
  const preview=await callStagingApi({action:"preview",path:created.path});
  if(typeof preview.path!=="string"||typeof preview.signedUrl!=="string"||!preview.signedUrl.startsWith("https://"))throw new Error("تعذر تجهيز معاينة الصورة.");
  return {value:STAGING_PREFIX+preview.path,previewUrl:preview.signedUrl};
 }catch(error){await callStagingApi({action:"delete",path:created.path}).catch(()=>undefined);throw error;}
}
export async function discardStagedLandingImage(value:string):Promise<void>{if(typeof value!=="string"||!value.startsWith(STAGING_PREFIX))return;await callStagingApi({action:"delete",path:value.slice(STAGING_PREFIX.length)});}
