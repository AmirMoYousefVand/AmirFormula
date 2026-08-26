"use client";

import { useActionState } from "react";
import { updateDonationGoal } from "@/actions/donation-goal";

type Goal = { target: number; current: number; text: string };

export default function DonationGoalForm({ initialGoal }: { initialGoal?: Goal }) {
  const [state, formAction, isPending] = useActionState(updateDonationGoal, null);

  const target = initialGoal?.target || 5000000;
  const current = initialGoal?.current || 0;
  const percent = target > 0 ? Math.round((current / target) * 100) : 0;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Preview */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-silver/40">
        <h2 className="mb-4 text-sm font-bold text-navy">پیش‌نمایش صفحه اصلی</h2>

        <div className="rounded-xl bg-navy-light p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-bold text-primary">{initialGoal?.text || "هدف حمایت"}</span>
            <span className="text-white/80">{percent}٪</span>
          </div>

          <div className="mb-3 h-4 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-l from-primary to-primary-hover transition-all"
              style={{ width: `${Math.max(percent, 1)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-white/60">
            <span className="text-primary font-bold">{current.toLocaleString("fa-IR")} تومان</span>
            <span>از {target.toLocaleString("fa-IR")} تومان</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form action={formAction} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-silver/40">
        {state?.success && (
          <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-bold text-green-700">✓ {state.success}</p>
        )}
        {state?.error && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-navy">متن هدف</label>
            <input
              name="goal_text"
              defaultValue={initialGoal?.text || "حمایت از توسعه سایت"}
              maxLength={100}
              className="w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-navy">مبلغ هدف (تومان)</label>
              <input
                name="target_amount"
                type="number"
                defaultValue={target}
                min="0"
                className="w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
                dir="ltr"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-navy">مبلغ جمع‌آوری شده (تومان)</label>
              <input
                name="current_amount"
                type="number"
                defaultValue={current}
                min="0"
                className="w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? "در حال ذخیره..." : "ذخیره هدف"}
        </button>
      </form>
    </div>
  );
}
