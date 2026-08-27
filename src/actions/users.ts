"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import { logInfo, logError } from "@/lib/logger";

async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") return null;
  return supabase;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role)) return null;
  return supabase;
}

export async function inviteUserAction(
  _prev: { error: string; success: string } | null,
  formData: FormData
): Promise<{ error: string; success: string } | null> {
  const supabase = await requireAdmin();
  if (!supabase) {
    return { error: "فقط ادمین و مالک دسترسی دارند", success: "" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const roleToInvite = String(formData.get("role") || "author");

  if (profile?.role === "admin" && roleToInvite !== "author") {
    return { error: "ادمین فقط می‌تواند نویسنده دعوت کند", success: "" };
  }

  const email = String(formData.get("email") || "");
  const fullName = String(formData.get("full_name") || "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "ایمیل نامعتبر است", success: "" };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: { full_name: fullName, role: roleToInvite },
    }
  );

  if (error) {
    await logError("INVITE_USER_FAILED", { error: error.message, email, role: roleToInvite }, user!.id);
    return { error: error.message, success: "" };
  }

  await logInfo("USER_INVITED", { email, role: roleToInvite }, user!.id);

  revalidatePath("/admin/users");
  return { error: "", success: `دعوت‌نامه به ${email} ارسال شد` };
}

export async function updateUserRoleAction(
  userId: string,
  role: "owner" | "admin" | "author"
) {
  const supabase = await requireAdmin();
  if (!supabase) {
    return { error: "فقط ادمین و مالک دسترسی دارند" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin") {
    if (role !== "author" || targetProfile?.role !== "author") {
      return { error: "ادمین فقط می‌تواند نقش نویسنده‌ها را تغییر دهد" };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    await logError("UPDATE_USER_ROLE_FAILED", { error: error.message, targetUserId: userId, newRole: role }, user!.id);
    return { error: error.message };
  }

  await logInfo("USER_ROLE_UPDATED", { targetUserId: userId, newRole: role }, user!.id);

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUserAction(userId: string) {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "فقط ادمین و مالک دسترسی دارند" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  // Admin cannot delete owner or another admin, only authors. We should check the target user role.
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin" && targetProfile?.role !== "author") {
    return { error: "ادمین فقط می‌تواند نویسنده را حذف کند" };
  }

  // Prevent deleting yourself
  if (user?.id === userId) {
    return { error: "نمی‌توانید حساب خودتان را حذف کنید" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    await logError("DELETE_USER_FAILED", { error: error.message, targetUserId: userId }, user!.id);
    return { error: error.message };
  }

  await logInfo("USER_DELETED", { targetUserId: userId }, user!.id);

  revalidatePath("/admin/users");
  return { ok: true };
}
