"use client";

import { useActionState, useState } from "react";
import { saveDonationGoalAction, deleteDonationGoalAction } from "@/actions/donation-goal";

type Goal = {
  id: string;
  goal_text: string;
  target_amount: number;
  sort_order: number;
  is_active: boolean;
};

export default function DonationsManager({
  initialGoals,
}: {
  initialGoals: Goal[];
}) {
  const [goals, setGoals] = useState(initialGoals);
  const [state, formAction, isPending] = useActionState(saveDonationGoalAction, null);
  const [editing, setEditing] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const editingGoal = editing ? goals.find((g) => g.id === editing) : null;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy">{goals.length} هدف فعال</h2>
            <p className="text-xs text-body">
              کل مبلغ هدف: {goals.reduce((s, g) => s + g.target_amount, 0).toLocaleString("fa-IR")} تومان
            </p>
          </div>
          <p className="rounded-full bg-silver/20 px-4 py-2 text-xs text-body">
            مبالغ جمع‌آوری شده خودکار از Coffeete محاسبه می‌شه
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-silver/40">
        <h3 className="mb-4 font-bold text-navy">
          {editing ? `ویرایش هدف: ${editingGoal?.goal_text}` : "هدف جدید"}
        </h3>

        <form key={formKey} action={formAction} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-navy">متن هدف</label>
              <input
                name="goal_text"
                defaultValue={editingGoal?.goal_text || ""}
                placeholder="مثلاً: هاستینگ رایگان سایت"
                required
                maxLength={100}
                className="w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-navy">مبلغ هدف (تومان)</label>
              <input
                name="target_amount"
                type="number"
                defaultValue={editingGoal?.target_amount || 5000000}
                min="1"
                required
                dir="ltr"
                className="w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-navy">ترتیب نمایش</label>
              <input
                name="sort_order"
                type="number"
                defaultValue={editingGoal?.sort_order || 0}
                dir="ltr"
                className="w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={editingGoal?.is_active ?? true}
                id="goal_active"
                className="h-4 w-4 accent-primary"
              />
              <label htmlFor="goal_active" className="text-sm text-navy">فعال</label>
            </div>
          </div>

          {state?.success && (
            <p className="rounded-lg bg-green-50 px-4 py-2 text-sm font-bold text-green-700">✓ {state.success}</p>
          )}
          {state?.error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? "ذخیره..." : editing ? "ذخیره تغییرات" : "افزودن هدف"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => { setEditing(null); setFormKey((k) => k + 1); }}
                className="rounded-full px-4 py-2 text-sm text-body hover:text-navy"
              >
                انصراف
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Goals list */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-silver/40">
        {goals.length === 0 ? (
          <p className="py-12 text-center text-sm text-body">هنوز هدفی تعریف نشده</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-silver/15 text-xs text-body">
              <tr>
                <th className="px-4 py-3 text-start font-bold">#</th>
                <th className="px-4 py-3 text-start font-bold">متن هدف</th>
                <th className="px-4 py-3 text-center font-bold">مبلغ هدف</th>
                <th className="px-4 py-3 text-center font-bold">وضعیت</th>
                <th className="px-4 py-3 text-center font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/20">
              {goals.map((g, i) => (
                <tr key={g.id} className="hover:bg-silver/5">
                  <td className="px-4 py-3 font-bold text-navy">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-navy">{g.goal_text}</td>
                  <td className="px-4 py-3 text-center text-body" dir="ltr">{g.target_amount.toLocaleString()} Tomans</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${g.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {g.is_active ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setEditing(g.id); setFormKey((k) => k + 1); }}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-hover hover:bg-primary/10"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`هدف «${g.goal_text}» حذف شود؟`)) return;
                          const res = await deleteDonationGoalAction(g.id);
                          if (!res?.error) window.location.reload();
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                      >
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
