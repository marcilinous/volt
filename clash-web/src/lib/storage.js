import { supabase } from "./supabase";

const BUCKET = "profile-photos";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadPhoto(file, userId, index) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only JPG, PNG, and WebP files are allowed" };
  }
  if (file.size > MAX_SIZE) {
    return { error: "File must be under 5MB" };
  }

  const ext = file.name.split(".").pop();
  const path = `${userId}/${index}-${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (error) return { error: error.message };

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return { url: urlData.publicUrl, error: null };
}

export async function deletePhoto(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return { error: error?.message || null };
}

export function getPhotoUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
