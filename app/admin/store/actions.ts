"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

async function getAdmin() {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  const email = (process.env.ADMIN_EMAIL || "tt246076@gmail.com").trim().toLowerCase();
  if (!user || user.email?.trim().toLowerCase() !== email) redirect("/dashboard");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) redirect("/admin/store?error=config");
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function saveStoreProduct(formData: FormData) {
  const admin = await getAdmin();
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim().slice(0, 120);
  const description = String(formData.get("description") || "").trim().slice(0, 1000);
  const imageUrl = String(formData.get("image_url") || "").trim().slice(0, 1000);
  const price = Number(formData.get("price"));
  const sortOrder = Number(formData.get("sort_order") || 0);
  const isActive = formData.get("is_active") === "on";
  if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(sortOrder)) redirect("/admin/store?error=fields");
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) redirect("/admin/store?error=image");
  const values = { name, description, price, image_url: imageUrl, is_active: isActive, sort_order: sortOrder, updated_at: new Date().toISOString() };
  const result = id
    ? await admin.from("storefront_products").update(values).eq("id", id)
    : await admin.from("storefront_products").insert(values);
  if (result.error) {
    console.error("Store product save failed:", result.error.message);
    redirect("/admin/store?error=db");
  }
  revalidatePath("/");
  revalidatePath("/admin/store");
  redirect("/admin/store?saved=1");
}

export async function deleteStoreProduct(formData: FormData) {
  const admin = await getAdmin();
  const id = String(formData.get("id") || "").trim();
  if (!id) redirect("/admin/store?error=fields");
  const { error } = await admin.from("storefront_products").delete().eq("id", id);
  if (error) {
    console.error("Store product delete failed:", error.message);
    redirect("/admin/store?error=db");
  }
  revalidatePath("/");
  revalidatePath("/admin/store");
  redirect("/admin/store?deleted=1");
}
