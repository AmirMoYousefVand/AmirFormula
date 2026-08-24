"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireSuperadmin() {
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

  if (!profile || profile.role !== "superadmin") return null;
  return supabase;
}

export async function inviteEditorAction(
  _prev: { error: string; success: string } | null,
  formData: FormData
): Promise<{ error: string; success: string } | null> {
  if (!(await requireSuperadmin())) {
    return { error: "فقط سوپرادمین دسترسی دارد", success: "" };
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
      data: { full_name: fullName },
    }
  );

  if (error) return { error: error.message, success: "" };

  // Profile auto-created by trigger — set role to editor (default already)
  revalidatePath("/admin/users");
  return { error: "", success: `دعوت‌نامه به ${email} ارسال شد` };
}

export async function updateUserRoleAction(
  userId: string,
  role: "superadmin" | "editor"
) {
  if (!(await requireSuperadmin())) {
    return { error: "فقط سوپرادمین دسترسی دارد" };
  }

  const supabase = await requireSuperadmin();
  if (!supabase) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUserAction(userId: string) {
  const supabase = await requireSuperadmin();
  if (!supabase) return { error: "فقط سوپرادمین دسترسی دارد" };

  // Prevent deleting yourself
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === userId) {
    return { error: "نمی‌توانید حساب خودتان را حذف کنید" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}
