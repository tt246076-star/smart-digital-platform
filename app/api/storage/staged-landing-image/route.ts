import {randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {cleanupPendingLandingPageImage} from "@/lib/server/storage-cleanup";
import {detectSupportedImage} from "@/lib/server/upload-validation";
import {hasOnlyKeys,hasNoQueryParams,isValidUuid,readBoundedJson,readJsonText} from "@/lib/server/input-validation";
export const dynamic="force-dynamic";
const BUCKET="landing-logos-staging",MAX_FILE_BYTES=5*1024*1024;
function reply(body:Record<string,unknown>,status=200){return NextResponse.json(body,{status,headers:{"Cache-Control":"no-store, max-age=0","X-Content-Type-Options":"nosniff"}});}
function isOwnedStagingPath(path:string,userId:string){if(!isValidUuid(userId)||path.length>160||!path.startsWith(userId+"/"))return false;return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{2,8}$/i.test(path.slice(userId.length+1));}
export async function POST(request:Request){
 if(!hasNoQueryParams(request))return reply({error:"الطلب غير صالح."},400);
 const parsed=await readBoundedJson(request,2048);if(!parsed.ok)return reply({error:"بيانات رفع الصورة غير صالحة."},400);
 const body=parsed.value,action=readJsonText(body.action,16,true);if(!action)return reply({error:"الطلب غير صالح."},400);
 const supabase=await createClient(),{data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)return reply({error:"سجّل الدخول أولًا."},401);
 if(action==="create"){
  if(!hasOnlyKeys(body,["action","size"]))return reply({error:"بيانات رفع الصورة غير صالحة."},400);
  const size=body.size;if(typeof size!=="number"||!Number.isSafeInteger(size)||size<1||size>MAX_FILE_BYTES)return reply({error:"حجم الصورة غير صالح أو يتجاوز 5 ميغابايت."},400);
  // Temporary neutral extension; final extension comes only from server-side signature detection.
  const path=user.id+"/"+randomUUID()+".tmp";
  const {data,error}=await supabase.storage.from(BUCKET).createSignedUploadUrl(path,{upsert:false});
  if(error||!data?.token){console.error("Staged image upload token creation failed.");return reply({error:"تعذر تجهيز رفع الصورة. حاول مجددًا."},503);}
  return reply({path,token:data.token});
 }
 if(action==="preview"||action==="delete"){
  if(!hasOnlyKeys(body,["action","path"]))return reply({error:"بيانات الصورة غير صالحة."},400);
  const path=readJsonText(body.path,160,true);if(!path||!isOwnedStagingPath(path,user.id))return reply({error:"مسار الصورة غير صالح."},400);
  if(action==="preview"){
   const {data:file,error:downloadError}=await supabase.storage.from(BUCKET).download(path);
   if(downloadError||!file||file.size<1||file.size>MAX_FILE_BYTES){await supabase.storage.from(BUCKET).remove([path]);return reply({error:"الملف غير صالح أو يتجاوز الحجم المسموح."},415);}
   const buffer=await file.arrayBuffer(),detected=detectSupportedImage(new Uint8Array(buffer));
   if(!detected){await supabase.storage.from(BUCKET).remove([path]);return reply({error:"مرفوض: يُسمح فقط بصور JPG وPNG وWebP وGIF. ملفات SVG وPHP والملفات الأخرى ممنوعة."},415);}
   const finalPath=user.id+"/"+randomUUID()+"."+detected.extension;
   const {error:uploadError}=await supabase.storage.from(BUCKET).upload(finalPath,new Blob([buffer],{type:detected.mime}),{contentType:detected.mime,upsert:false,cacheControl:"3600"});
   if(uploadError){await supabase.storage.from(BUCKET).remove([path]);console.error("Validated image finalization failed:",uploadError.message);return reply({error:"تعذر اعتماد الصورة بعد فحصها."},503);}
   await supabase.storage.from(BUCKET).remove([path]);
   const {data,error}=await supabase.storage.from(BUCKET).createSignedUrl(finalPath,3600);
   if(error||!data?.signedUrl){await supabase.storage.from(BUCKET).remove([finalPath]);return reply({error:"تعذر تجهيز معاينة الصورة."},503);}
   return reply({path:finalPath,signedUrl:data.signedUrl});
  }
  const removed=await cleanupPendingLandingPageImage("staging://"+path,user.id);
  if(!removed)return reply({error:"تعذر حذف الصورة المؤقتة."},503);
  return reply({ok:true});
 }
 return reply({error:"العملية المطلوبة غير مدعومة."},400);
}
