"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logInfo, logError } from "@/lib/logger";

export async function updateTranslationAction(key: string, locale: string, value: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("translation_overrides")
    .upsert({ key, locale, value }, { onConflict: "key,locale" });

  if (error) {
    await logError("UPDATE_TRANSLATION_FAILED", { key, locale, error: error.message }, user.id);
    return { error: error.message };
  }

  await logInfo("TRANSLATION_UPDATED", { key, locale, length: value.length }, user.id);

  // Invalidate everything so layout and pages refresh
  revalidatePath("/", "layout");
  return { ok: true };
}
