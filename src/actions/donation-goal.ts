"use server";

import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logInfo, logError } from "@/lib/logger";
import { getRecentDonations, type Donation } from "./coffeete";

export async function getDonationGoals() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donation_goals")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return data || [];
}

export async function getAllDonationGoals() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donation_goals")
    .select("*")
    .order("sort_order", { ascending: true });
  return data || [];
}

export async function saveDonationGoalAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const id = formData.get("id") as string | null;
  const goalText = String(formData.get("goal_text") || "حمایت از توسعه سایت").trim();
  const targetAmount = parseInt(String(formData.get("target_amount") || "5000000"));
  const sortOrder = parseInt(String(formData.get("sort_order") || "0"));
  const isActive = formData.get("is_active") === "on";

  if (isNaN(targetAmount) || targetAmount <= 0) return { error: "مبلغ هدف نامعتبر" };

  if (id) {
    const { error } = await supabase
      .from("donation_goals")
      .update({ goal_text: goalText, target_amount: targetAmount, sort_order: sortOrder, is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      await logError("UPDATE_DONATION_GOAL_FAILED", { error: error.message, id }, user.id);
      return { error: error.message };
    }
    await logInfo("DONATION_GOAL_UPDATED", { goalText, targetAmount, id }, user.id);
  } else {
    const { error } = await supabase
      .from("donation_goals")
      .insert({ goal_text: goalText, target_amount: targetAmount, sort_order: sortOrder, is_active: isActive });
    if (error) {
      await logError("CREATE_DONATION_GOAL_FAILED", { error: error.message, goalText }, user.id);
      return { error: error.message };
    }
    await logInfo("DONATION_GOAL_CREATED", { goalText, targetAmount }, user.id);
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/donations");
  return { success: "هدف ذخیره شد" };
}

export async function deleteDonationGoalAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const { error } = await supabase.from("donation_goals").delete().eq("id", id);
  if (error) {
    await logError("DELETE_DONATION_GOAL_FAILED", { error: error.message, id }, user.id);
    return { error: error.message };
  }

  await logInfo("DONATION_GOAL_DELETED", { id }, user.id);

  revalidatePath("/", "layout");
  revalidatePath("/admin/donations");
  return { ok: true };
}

export async function getModeratedDonors() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("moderated_donors")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function moderateDonorAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const donationId = parseInt(String(formData.get("donation_id") || "0"));
  const customName = formData.get("custom_name") as string | null;
  const customMessage = formData.get("custom_message") as string | null;
  const customAmount = formData.get("custom_amount")
    ? parseInt(String(formData.get("custom_amount")))
    : null;
  const isHidden = formData.get("is_hidden") === "on";

  if (!donationId) return { error: "شناسه دونیت نامعتبر" };

  const { error } = await supabase
    .from("moderated_donors")
    .upsert(
      {
        donation_id: donationId,
        custom_name: customName?.trim() || null,
        custom_message: customMessage?.trim() || null,
        custom_amount: isNaN(customAmount as number) ? null : customAmount,
        is_hidden: isHidden,
        hidden_at: isHidden ? new Date().toISOString() : null,
      },
      { onConflict: "donation_id" }
    );

  if (error) {
    await logError("MODERATE_DONOR_FAILED", { error: error.message, donationId }, user.id);
    return { error: error.message };
  }

  await logInfo("DONOR_MODERATED", { donationId, customName, isHidden }, user.id);

  revalidatePath("/", "layout");
  revalidatePath("/admin/donations");
  return { success: "تغییرات ذخیره شد" };
}

export async function getHomepageDonations(): Promise<{
  goals: { id: string; text: string; target: number; current: number; percent: number }[];
  donations: Donation[];
}> {
  // Bypass fetch cache so moderated data is always fresh
  noStore();

  try {
    const supabase = await createClient();

    // Fetch goals + moderated donors + raw donations in parallel
    const [goalsData, moderatedData, donations] = await Promise.all([
      supabase.from("donation_goals").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("moderated_donors").select("*"),
      getRecentDonations(),
    ]);

    const goals = goalsData.data || [];
    const moderated = moderatedData.data || [];

    // Build moderation map: donation_id -> moderator override
    const modMap = new Map<string, { custom_name: string | null; custom_amount: number | null; is_hidden: boolean; custom_message: string | null }>();
    for (const m of moderated as Record<string, unknown>[]) {
      modMap.set(String(m.donation_id), {
        custom_name: m.custom_name as string | null,
        custom_amount: m.custom_amount as number | null,
        is_hidden: m.is_hidden as boolean,
        custom_message: m.custom_message as string | null,
      });
    }

    // Process donations: apply moderation, filter hidden
    // d.id from API might be number or string, always convert to String for lookup
    const processedDonations = donations
      .map((d) => {
        const mod = modMap.get(String(d.id));
        if (mod?.is_hidden) return null;
        return {
          ...d,
          supporterName: mod?.custom_name ?? d.supporterName,
          amountToman: mod?.custom_amount ?? d.amountToman,
          message: mod?.custom_message ?? d.message,
        };
      })
      .filter((d): d is Donation => d !== null);

    // Total amount from all visible donations
    const totalAmount = processedDonations.reduce((sum, d) => sum + d.amountToman, 0);

    // Distribute sequentially: fill goal 1 first, overflow to goal 2, etc.
    let remaining = totalAmount;
    const goalsWithCurrent = goals.map((g) => {
      const current = Math.min(remaining, g.target_amount);
      remaining = Math.max(0, remaining - g.target_amount);
      return {
        id: g.id,
        text: g.goal_text,
        target: g.target_amount,
        current,
        percent: Math.min(100, Math.round((current / g.target_amount) * 100)),
      };
    });

    return {
      goals: goalsWithCurrent,
      donations: processedDonations.slice(0, 5),
    };
  } catch {
    return { goals: [], donations: [] };
  }
}
