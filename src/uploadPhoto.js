import { supabase } from "./supabase";

export async function uploadPhoto(file, userId, bucket = "avatars") {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true ,contentType: file.type});

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}