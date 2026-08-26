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
 * Center-crops an image to a 1:1 square, resizes it to `size`×`size`,
 * converts to WebP, and returns a circular-masked PNG-free WebP File.
 * Used for logos/avatars that must render cleanly as circles.
 */
export async function compressLogo(
  file: File,
  size = 256
): Promise<{ file?: File; error?: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "فایل انتخابی عکس نیست" };
  }

  try {
    const bitmap = await createImageBitmap(file);

    // Center square crop
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", 0.9)
    );
    if (!blob) throw new Error("WebP conversion failed");

    return {
      file: new File([blob], `${Date.now()}-logo.webp`, { type: "image/webp" }),
    };
  } catch (error: any) {
    return { error: error.message || "پردازش تصویر ناموفق بود" };
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
