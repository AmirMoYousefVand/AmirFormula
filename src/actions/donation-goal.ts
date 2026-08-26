"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("donation_goals")
      .insert({ goal_text: goalText, target_amount: targetAmount, sort_order: sortOrder, is_active: isActive });
    if (error) return { error: error.message };
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
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/admin/donations");
  return { ok: true };
}

export async function getHomepageDonations(): Promise<{
  goals: { id: string; text: string; target: number; current: number; percent: number }[];
  donations: Donation[];
}> {
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
    const modMap = new Map<number, { custom_name: string | null; custom_amount: number | null; is_hidden: boolean }>();
    for (const m of moderated as Record<string, unknown>[]) {
      modMap.set(m.donation_id as number, {
        custom_name: m.custom_name as string | null,
        custom_amount: m.custom_amount as number | null,
        is_hidden: m.is_hidden as boolean,
      });
    }

    // Process donations: apply moderation, filter hidden
    const processedDonations = donations
      .map((d) => {
        const mod = modMap.get(d.id);
        if (mod?.is_hidden) return null;
        return {
          ...d,
          supporterName: mod?.custom_name ?? d.supporterName,
          amountToman: mod?.custom_amount ?? d.amountToman,
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
