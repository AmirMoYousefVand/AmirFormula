"use client";

import { useActionState, useState } from "react";
import { saveDonationGoalAction, deleteDonationGoalAction, moderateDonorAction } from "@/actions/donation-goal";

type Goal = {
  id: string;
  goal_text: string;
  target_amount: number;
  sort_order: number;
  is_active: boolean;
};

type Donation = {
  id: number;
  amountToman: number;
  supporterName: string | null;
  isAnonymous: boolean;
  message: string | null;
};

type ModeratedDonor = {
  donation_id: number;
  custom_name: string | null;
  custom_amount: number | null;
  is_hidden: boolean;
};

export default function DonationsManager({
  initialGoals,
  initialDonations,
  initialModerated,
}: {
  initialGoals: Goal[];
  initialDonations: Donation[];
  initialModerated: ModeratedDonor[];
}) {
  const [goals] = useState(initialGoals);
  const [state, formAction, isPending] = useActionState(saveDonationGoalAction, null);
  const [editing, setEditing] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const editingGoal = editing ? goals.find((g) => g.id === editing) : null;

  const [editingDonor, setEditingDonor] = useState<number | null>(null);

  // Build moderation map
  const modMap = new Map<number, ModeratedDonor>();
  initialModerated.forEach((m) => modMap.set(m.donation_id, m));

  return (
    <div className="space-y-8">
      {/* ===== SECTION 1: Goals ===== */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-navy flex items-center gap-2">
          🎯 اهداف حمایت
        </h2>

        {/* Stats */}
        <div className="mb-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-navy">{goals.length} هدف فعال</p>
              <p className="text-xs text-body">
                کل مبلغ: {goals.reduce((s, g) => s + g.target_amount, 0).toLocaleString("en-US")} تومان
              </p>
            </div>
            <span className="rounded-full bg-silver/20 px-3 py-1.5 text-xs text-body">
              مبالغ خودکار از Coffeete
            </span>
          </div>
        </div>

        {/* Goal form */}
        <div className="mb-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-silver/40">
          <h3 className="mb-4 font-bold text-navy">
            {editing ? `ویرایش: ${editingGoal?.goal_text}` : "هدف جدید"}
          </h3>
          <form key={formKey} action={formAction} className="space-y-4">
            {editing && <input type="hidden" name="id" value={editing} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-navy">متن هدف</label>
                <input name="goal_text" defaultValue={editingGoal?.goal_text || ""} required maxLength={100}
                  className="w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-navy">مبلغ هدف (تومان)</label>
                <input name="target_amount" type="number" defaultValue={editingGoal?.target_amount || 5000000} min="1" required dir="ltr"
                  className="w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-navy">ترتیب نمایش</label>
                <input name="sort_order" type="number" defaultValue={editingGoal?.sort_order || 0} dir="ltr"
                  className="w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" name="is_active" defaultChecked={editingGoal?.is_active ?? true} id="goal_active" className="h-4 w-4 accent-primary" />
                <label htmlFor="goal_active" className="text-sm text-navy">فعال</label>
              </div>
            </div>
            {state?.success && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm font-bold text-green-700">✓ {state.success}</p>}
            {state?.error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={isPending}
                className="rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50">
                {isPending ? "ذخیره..." : editing ? "ذخیره" : "افزودن هدف"}
              </button>
              {editing && (
                <button type="button" onClick={() => { setEditing(null); setFormKey((k) => k + 1); }}
                  className="rounded-full px-4 py-2 text-sm text-body hover:text-navy">انصراف</button>
              )}
            </div>
          </form>
        </div>

        {/* Goals table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-silver/40">
          <table className="min-w-full text-sm">
            <thead className="bg-silver/15 text-xs text-body">
              <tr>
                <th className="px-4 py-3 text-start font-bold">#</th>
                <th className="px-4 py-3 text-start font-bold">متن هدف</th>
                <th className="px-4 py-3 text-center font-bold">مبلغ</th>
                <th className="px-4 py-3 text-center font-bold">وضعیت</th>
                <th className="px-4 py-3 text-center font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/20">
              {goals.map((g, i) => (
                <tr key={g.id} className="hover:bg-silver/5">
                  <td className="px-4 py-3 font-bold text-navy">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-navy">{g.goal_text}</td>
                  <td className="px-4 py-3 text-center text-body" dir="ltr">{g.target_amount.toLocaleString("en-US")} T</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${g.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {g.is_active ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { setEditing(g.id); setFormKey((k) => k + 1); }}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-hover hover:bg-primary/10">ویرایش</button>
                    <button onClick={async () => { if (confirm(`هدف «${g.goal_text}» حذف شود؟`)) { await deleteDonationGoalAction(g.id); window.location.reload(); } }}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">حذف</button>
                  </td>
                </tr>
              ))}
              {goals.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-body">هدفی تعریف نشده</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== SECTION 2: Donors Moderation ===== */}
      <DonorModerationSection
        donations={initialDonations}
        moderatedMap={modMap}
      />
    </div>
  );
}

/* ---------- Donor Moderation Sub-Component ---------- */

function DonorModerationSection({
  donations,
  moderatedMap,
}: {
  donations: Donation[];
  moderatedMap: Map<number, ModeratedDonor>;
}) {
  const [modState, modAction, modPending] = useActionState(moderateDonorAction, null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(
    new Set(donations.filter((d) => moderatedMap.get(d.id)?.is_hidden).map((d) => d.id))
  );

  function isHidden(donationId: number) {
    return hiddenIds.has(donationId);
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-navy flex items-center gap-2">
        👥 مدیریت حامیان اخیر
      </h2>
      <p className="mb-4 text-sm text-body">
        حامیان به‌صورت خودکار از Coffeete نمایش داده می‌شوند. در صورت نیاز می‌توانید اسم، مبلغ یا نمایش آن‌ها را تغییر دهید.
      </p>

      {modState?.success && (
        <p className="mb-3 rounded-lg bg-green-50 px-4 py-2 text-sm font-bold text-green-700">✓ {modState.success}</p>
      )}
      {modState?.error && (
        <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{modState.error}</p>
      )}

      {donations.length === 0 ? (
        <div className="rounded-xl bg-white py-12 text-center text-sm text-body shadow-sm ring-1 ring-silver/40">
          هنوز دونیتی ثبت نشده
        </div>
      ) : (
        <div className="space-y-3">
          {donations.map((d) => {
            const mod = moderatedMap.get(d.id);
            const editing = editingId === d.id;
            const hidden = isHidden(d.id);

            return (
              <div key={d.id} className={`rounded-xl bg-white p-4 shadow-sm ring-1 ring-silver/40 ${hidden ? "opacity-40" : ""}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-black text-primary">
                      {mod?.custom_name
                        ? mod.custom_name.charAt(0)
                        : d.isAnonymous
                          ? "؟"
                          : (d.supporterName || "؟").charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy">
                        {mod?.custom_name
                          ? mod.custom_name
                          : d.isAnonymous || !d.supporterName
                            ? "حامی ناشناس"
                            : d.supporterName}
                      </p>
                      <p className="text-xs text-body">
                        {(mod?.custom_amount ?? d.amountToman).toLocaleString("en-US")} تومان
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingId(editing ? null : d.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-hover hover:bg-primary/10">
                      {editing ? "بستن" : "ویرایش"}
                    </button>
                  </div>
                </div>

                {editing && (
                  <form action={modAction} className="mt-4 border-t border-silver/30 pt-4 space-y-3">
                    <input type="hidden" name="donation_id" value={d.id} />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy">نام نمایشی</label>
                        <input name="custom_name" defaultValue={mod?.custom_name || ""} placeholder={d.supporterName || "حامی ناشناس"}
                          className="w-full rounded-lg border border-silver/50 px-3 py-2 text-sm outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy">مبلغ نمایشی (تومان)</label>
                        <input name="custom_amount" type="number" defaultValue={mod?.custom_amount ?? d.amountToman} dir="ltr"
                          className="w-full rounded-lg border border-silver/50 px-3 py-2 text-sm outline-none focus:border-primary" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input type="checkbox" name="is_hidden" defaultChecked={hidden} id={`hide-${d.id}`} className="h-4 w-4 accent-primary" />
                      <label htmlFor={`hide-${d.id}`} className="text-sm text-navy">مخفی کردن از نمایش</label>
                    </div>

                    <button type="submit" disabled={modPending}
                      className="rounded-full bg-primary px-6 py-2 text-xs font-bold text-navy hover:bg-primary-hover disabled:opacity-50">
                      {modPending ? "ذخیره..." : "ذخیره تغییرات"}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
