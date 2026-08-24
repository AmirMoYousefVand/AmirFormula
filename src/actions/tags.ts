"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tagSchema } from "@/lib/validation";

export async function saveTagAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const raw = {
    id: formData.get("id") || undefined,
    slug: String(formData.get("slug") || "").toLowerCase(),
    name_fa: String(formData.get("name_fa") || ""),
    name_en: String(formData.get("name_en") || ""),
  };

  const parsed = tagSchema.safeParse(raw);
  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message || "Validation failed";
    return { error: msg };
  }

  const supabase = await createClient();
  const data = parsed.data;

  if (data.id) {
    const { error } = await supabase
      .from("tags")
      .update(data)
      .eq("id", data.id);
    if (error) return { error: error.message };
  } else {
    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();

    if (existing) return { error: "این شناسه قبلاً استفاده شده است" };

    const { error } = await supabase.from("tags").insert(data);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/tags");
  return { ok: true };
}

export async function deleteTagAction(tagId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", tagId);

  if (error) return { error: error.message };
  revalidatePath("/admin/tags");
  return { ok: true };
}
