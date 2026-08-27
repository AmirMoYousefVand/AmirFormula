"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logInfo, logError } from "@/lib/logger";

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

  if (error) {
    await logError("APPROVE_COMMENT_FAILED", { error: error.message, commentId }, user.id);
    return { error: error.message };
  }

  await logInfo("COMMENT_APPROVED", { commentId }, user.id);

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

  if (error) {
    await logError("DELETE_COMMENT_FAILED", { error: error.message, commentId }, user.id);
    return { error: error.message };
  }

  await logInfo("COMMENT_DELETED", { commentId }, user.id);

  revalidatePath("/admin/comments");
  return { ok: true };
}
