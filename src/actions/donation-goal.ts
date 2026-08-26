"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRecentDonations, type Donation } from "./coffeete";

export async function getDonationGoal() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donation_goal")
    .select("*")
    .limit(1)
    .maybeSingle();
  return data;
}

export async function updateDonationGoal(
  _prev: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "دسترسی غیرمجاز" };

  const target = parseInt(String(formData.get("target_amount") || "5000000"));
  const current = parseInt(String(formData.get("current_amount") || "0"));
  const text = String(formData.get("goal_text") || "حمایت از توسعه سایت").trim();

  if (isNaN(target) || target < 0) return { error: "مبلغ هدف نامعتبر" };

  const { data: existing } = await supabase
    .from("donation_goal")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("donation_goal")
      .update({ target_amount: target, current_amount: current, goal_text: text, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("donation_goal")
      .insert({ target_amount: target, current_amount: current, goal_text: text });
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/donations");
  return { success: "هدف حمایت ذخیره شد" };
}

export async function getHomepageDonations(): Promise<{
  goal: { target: number; current: number; text: string; percent: number } | null;
  donations: Donation[];
}> {
  try {
    const [goal, donations] = await Promise.all([
      getDonationGoal(),
      getRecentDonations(),
    ]);

    return {
      goal: goal
        ? {
            target: goal.target_amount,
            current: goal.current_amount,
            text: goal.goal_text,
            percent: Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)),
          }
        : null,
      donations: donations.slice(0, 5),
    };
  } catch {
    return { goal: null, donations: [] };
  }
}
