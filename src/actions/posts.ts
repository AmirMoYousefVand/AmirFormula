"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { postSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

function makeSlug(text: string): string {
  return slugify(text) || `post-${Date.now()}`;
}

export async function savePostAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const raw = {
    id: formData.get("id") || undefined,
    slug: String(formData.get("slug") || ""),
    status: String(formData.get("status") || "draft"),
    title_fa: String(formData.get("title_fa") || ""),
    title_en: String(formData.get("title_en") || ""),
    excerpt_fa: String(formData.get("excerpt_fa") || ""),
    excerpt_en: String(formData.get("excerpt_en") || ""),
    content_fa: String(formData.get("content_fa") || ""),
    content_en: String(formData.get("content_en") || ""),
    cover_image_url: String(formData.get("cover_image_url") || ""),
    published_at: String(formData.get("published_at") || ""),
    meta_description: String(formData.get("meta_description") || ""),
    meta_keywords: String(formData.get("meta_keywords") || ""),
    tag_ids: JSON.parse(String(formData.get("tag_ids") || "[]")),
  };

  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message || "Validation failed";
    return { error: msg };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const data = parsed.data;

  // Auto-generate slug from title_fa if empty
  if (!data.slug) {
    data.slug = makeSlug(data.title_fa);
  }

  // Ensure slug uniqueness
  const baseSlug = data.slug;
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const { data: existing } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    const isOwn = data.id && existing?.id === data.id;
    if (!existing || isOwn) break;
    slug = `${baseSlug}-${++counter}`;
  }

  // Set published_at
  let publishedAt = data.published_at || null;
  if (data.status === "published" && !publishedAt) {
    publishedAt = new Date().toISOString();
  }

  // Separate tag_ids from rest
  const { tag_ids, ...postData } = {
    ...data,
    slug,
    author_id: user.id,
    published_at: publishedAt || null,
    updated_at: new Date().toISOString(),
  };

  if (data.id) {
    // Update
    const { error } = await supabase
      .from("posts")
      .update(postData)
      .eq("id", data.id);
    if (error) return { error: error.message };

    // Replace tags
    await supabase.from("post_tags").delete().eq("post_id", data.id);
    if (tag_ids.length) {
      await supabase
        .from("post_tags")
        .insert(tag_ids.map((tid) => ({ post_id: data.id!, tag_id: tid })));
    }
  } else {
    // Insert
    const { data: newPost, error } = await supabase
      .from("posts")
      .insert(postData)
      .select("id")
      .single();
    if (error) return { error: error.message };

    if (tag_ids.length) {
      await supabase
        .from("post_tags")
        .insert(tag_ids.map((tid) => ({ post_id: newPost.id, tag_id: tid })));
    }
  }

  revalidatePath("/admin/posts");
  revalidatePath("/fa/blog");
  revalidatePath("/en/blog");
  redirect("/admin/posts");
}

export async function deletePostAction(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath("/admin/posts");
  revalidatePath("/fa/blog");
  revalidatePath("/en/blog");
  redirect("/admin/posts");
}
