import { createClient } from "@/lib/supabase/server";
import DonationGoalForm from "./donation-goal-form";

export default async function AdminDonationsPage() {
  const supabase = await createClient();
  const { data: goal } = await supabase
    .from("donation_goal")
    .select("*")
    .limit(1)
    .maybeSingle();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy">مدیریت حمایت مالی</h1>
        <p className="mt-1 text-sm text-body">
          هدف حمایت مالی و پیشرفت آن را مدیریت کنید
        </p>
      </header>

      <DonationGoalForm
        initialGoal={
          goal
            ? { target: goal.target_amount, current: goal.current_amount, text: goal.goal_text }
            : undefined
        }
      />
    </div>
  );
}
