"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_KEYS = ["site_name", "site_description", "favicon_url"];

export async function saveSiteSettingAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const updates: Record<string, string> = {};
  for (const key of ALLOWED_KEYS) {
    const raw = formData.get(key);
    if (raw !== null) updates[key] = String(raw).trim().slice(0, 300);
  }

  for (const [key, value] of Object.entries(updates)) {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: "تنظیمات با موفقیت ذخیره شد" };
}

export async function deleteStorageFileAction(fileName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  // Service role needed to delete storage objects regardless of bucket policies
  const adminClient = createAdminClient();
  const { error } = await adminClient.storage.from("covers").remove([fileName]);

  if (error) return { error: error.message };
  revalidatePath("/admin/storage");
  return { ok: true };
}

export async function cleanupOrphanedFilesAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const adminClient = createAdminClient();

  // List all files in the covers bucket
  const { data: files, error: listError } = await adminClient.storage
    .from("covers")
    .list();

  if (listError) return { error: listError.message };
  if (!files?.length) return { deleted: 0 };

  // Collect every image URL referenced anywhere in posts
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("cover_image_url, content_fa, content_en");

  if (postsError) return { error: postsError.message };

  const usedFileNames = new Set<string>();
  for (const post of posts || []) {
    const haystacks = [
      post.cover_image_url || "",
      post.content_fa || "",
      post.content_en || "",
    ];
    for (const text of haystacks) {
      for (const match of text.matchAll(/\/storage\/v1\/object\/public\/covers\/([^"'?)\s]+)/g)) {
        usedFileNames.add(decodeURIComponent(match[1]));
      }
    }
  }

  const orphans = files
    .map((f) => f.name)
    .filter((name) => !usedFileNames.has(name));

  if (!orphans.length) return { deleted: 0 };

  const { error: removeError } = await adminClient.storage
    .from("covers")
    .remove(orphans);

  if (removeError) return { error: removeError.message };

  revalidatePath("/admin/storage");
  return { deleted: orphans.length };
}
