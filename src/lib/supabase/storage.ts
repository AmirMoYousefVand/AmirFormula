import { createClient } from "./client";

/**
 * Uploads a file to a Supabase Storage bucket and returns the public URL.
 * Generates a unique filename using timestamp and a random string.
 */
export async function uploadImageToSupabase(
  bucket: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `${Date.now()}-${random}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return { url: publicUrl };
  } catch (error: any) {
    return { error: error.message };
  }
}
