"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveCommentAction(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("comments")
    .update({ status: "approved" })
    .eq("id", commentId);

  if (error) return { error: error.message };
  revalidatePath("/admin/comments");
  revalidatePath("/fa/blog");
  revalidatePath("/en/blog");
  return { ok: true };
}

export async function deleteCommentAction(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) return { error: error.message };
  revalidatePath("/admin/comments");
  return { ok: true };
}
