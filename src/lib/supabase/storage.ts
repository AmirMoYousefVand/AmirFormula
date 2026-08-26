import { createClient } from "./client";
import imageCompression from "browser-image-compression";

/**
 * Compresses an image and converts it to WebP format for minimal file size.
 * Max dimensions: 1920px (plenty for full-width blog images).
 * Target quality: 0.8 (visually identical to original, ~10x smaller).
 */
export async function compressImage(file: File): Promise<File> {
  // Skip compression for non-image files (safety check)
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  try {
    const compressedBlob = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp",
    });

    return new File([compressedBlob], `${Date.now()}-image.webp`, {
      type: "image/webp",
    });
  } catch {
    // If compression fails, fall back to the original file
    return file;
  }
}

/**
 * Uploads a file to a Supabase Storage bucket and returns the public URL.
 * Automatically compresses images to WebP before uploading.
 */
export async function uploadImageToSupabase(
  bucket: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = createClient();

    // Auto-compress before upload
    const optimizedFile = await compressImage(file);

    const ext = optimizedFile.name.split(".").pop();
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `${Date.now()}-${random}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, optimizedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: "image/webp",
      });

    if (uploadError) throw new Error(uploadError.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return { url: publicUrl };
  } catch (error: any) {
    return { error: error.message };
  }
}
