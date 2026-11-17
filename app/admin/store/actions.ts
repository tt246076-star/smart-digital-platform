"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { cleanupStoreProductImages } from "@/lib/server/storage-cleanup";
import { validateImageFile } from "@/lib/server/upload-validation";
import { hasOnlyFormFields, isValidUuid, isValidWebUrl, parseFormNumber, readFormCheckbox, readFormText } from "@/lib/server/input-validation";

async function getAdmin() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) redirect("/login");
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) redirect("/admin/store?error=config");
  if (user.email?.trim().toLowerCase() !== email) redirect("/dashboard");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) redirect("/admin/store?error=config");
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function saveStoreProduct(formData: FormData) {
  const admin = await getAdmin();
  if (!hasOnlyFormFields(formData, ["id", "name", "description", "image_url", "image_file", "price", "sort_order", "is_active"])) redirect("/admin/store?error=fields");
  const id = readFormText(formData, "id", 36) || "";
  const name = readFormText(formData, "name", 120, true);
  const description = readFormText(formData, "description", 1000);
  let imageUrl = readFormText(formData, "image_url", 2048);
  const priceRaw = readFormText(formData, "price", 12, true);
  const sortOrderRaw = readFormText(formData, "sort_order", 6, true);
  const price = priceRaw === null ? null : parseFormNumber(priceRaw, { min: 0, max: 99_999_999 });
  const sortOrder = sortOrderRaw === null ? null : parseFormNumber(sortOrderRaw, { integer: true, min: 0, max: 100_000 });
  const isActive = readFormCheckbox(formData, "is_active");
  if ((id && !isValidUuid(id)) || name === null || !name || description === null ||
      imageUrl === null || price === null || sortOrder === null || isActive === null ||
      (imageUrl && !isValidWebUrl(imageUrl))) redirect("/admin/store?error=fields");
  let previousImageUrl = "";
  if (id) {
    const { data: previousProduct, error: previousProductError } = await admin.from("storefront_products").select("image_url").eq("id", id).maybeSingle();
    if (previousProductError) { console.error("Store product image lookup failed:", previousProductError.message); redirect("/admin/store?error=db"); }
    previousImageUrl = previousProduct?.image_url || "";
  }
  const imageFile = formData.get("image_file");
  if (imageFile !== null && !(imageFile instanceof File)) redirect("/admin/store?error=file");
  if (imageFile instanceof File && imageFile.size > 0) {
    const validatedImage = await validateImageFile(imageFile, 5 * 1024 * 1024);
    if (!validatedImage) redirect("/admin/store?error=file");
    const path = `${crypto.randomUUID()}.${validatedImage.extension}`;
    const { error: uploadError } = await admin.storage.from("store-products").upload(path, validatedImage.blob, {
      contentType: validatedImage.mime, upsert: false, cacheControl: "31536000",
    });
    if (uploadError) { console.error("Product image upload failed:", uploadError.message); redirect("/admin/store?error=upload"); }
    imageUrl = admin.storage.from("store-products").getPublicUrl(path).data.publicUrl;
  }
  if (imageUrl === null || (imageUrl && !isValidWebUrl(imageUrl))) redirect("/admin/store?error=image");
  const values = { name, description, price, image_url: imageUrl, is_active: isActive, sort_order: sortOrder, updated_at: new Date().toISOString() };
  const result = id
    ? await admin.from("storefront_products").update(values).eq("id", id)
    : await admin.from("storefront_products").insert(values);
  if (result.error) {
    console.error("Store product save failed:", result.error.message);
    redirect("/admin/store?error=db");
  }
  if (id && previousImageUrl && previousImageUrl !== imageUrl) await cleanupStoreProductImages([previousImageUrl]);
  revalidatePath("/");
  revalidatePath("/admin/store");
  redirect("/admin/store?saved=1");
}

export async function deleteStoreProduct(formData: FormData) {
  const admin = await getAdmin();
  if (!hasOnlyFormFields(formData, ["id"])) redirect("/admin/store?error=fields");
  const id = readFormText(formData, "id", 36, true) || "";
  if (!isValidUuid(id)) redirect("/admin/store?error=fields");
  const { data: productToDelete, error: lookupError } = await admin.from("storefront_products").select("image_url").eq("id", id).maybeSingle();
  if (lookupError) { console.error("Store product image lookup failed:", lookupError.message); redirect("/admin/store?error=db"); }
  const { error } = await admin.from("storefront_products").delete().eq("id", id);
  if (error) {
    console.error("Store product delete failed:", error.message);
    redirect("/admin/store?error=db");
  }
  await cleanupStoreProductImages([productToDelete]);
  revalidatePath("/");
  revalidatePath("/admin/store");
  redirect("/admin/store?deleted=1");
}
