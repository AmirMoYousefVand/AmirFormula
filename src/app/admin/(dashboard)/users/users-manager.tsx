"use client";

import { useActionState, useState, useTransition } from "react";
import {
  inviteEditorAction,
  updateUserRoleAction,
  deleteUserAction,
} from "@/actions/users";

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "superadmin" | "editor";
  created_at: string;
};

const roleLabel: Record<string, string> = {
  superadmin: "سوپرادمین",
  editor: "ادیتور",
};

export default function UsersManager({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const [inviteState, inviteAction, inviting] = useActionState(
    inviteEditorAction,
    null as { error: string; success: string } | null
  );
  const [, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Invite form */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
        <h2 className="mb-4 font-bold text-navy">دعوت مدیر جدید</h2>

        <form action={inviteAction} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-navy">ایمیل</label>
            <input
              name="email"
              type="email"
              required
              dir="ltr"
              placeholder="editor@example.com"
              className="w-full rounded-lg border border-silver/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-navy">
              نام (اختیاری)
            </label>
            <input
              name="full_name"
              maxLength={100}
              className="w-full rounded-lg border border-silver/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {inviteState?.error && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">
              {inviteState.error}
            </p>
          )}
          {inviteState?.success && (
            <p className="rounded bg-green-50 px-3 py-2 text-xs text-green-700">
              {inviteState.success}
            </p>
          )}

          <button
            type="submit"
            disabled={inviting}
            className="w-full rounded-full bg-primary py-2 text-sm font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {inviting ? "..." : "ارسال دعوت‌نامه"}
          </button>
        </form>

        <p className="mt-4 rounded-lg bg-silver/10 px-3 py-2.5 text-xs leading-relaxed text-body">
          کاربر دعوت‌شده ایمیلی از Supabase دریافت می‌کند تا رمز عبور خود را
          تنظیم کند.
        </p>
      </div>

      {/* Users list */}
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-silver/40">
          <table className="min-w-full text-sm">
            <thead className="bg-silver/15 text-xs text-body">
              <tr>
                <th className="px-4 py-3 text-start font-bold">کاربر</th>
                <th className="px-4 py-3 text-center font-bold">نقش</th>
                <th className="px-4 py-3 text-center font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/20">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-silver/5">
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy">
                      {p.full_name || "—"}
                      {p.id === currentUserId && (
                        <span className="ms-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary-hover">
                          شما
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-body" dir="ltr">
                      {p.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.id === currentUserId ? (
                      <span className="rounded-full bg-navy-light px-3 py-1 text-xs font-bold text-white">
                        {roleLabel[p.role]}
                      </span>
                    ) : (
                      <select
                        value={p.role}
                        disabled={busyId === p.id}
                        onChange={(e) => {
                          setBusyId(p.id);
                          startTransition(async () => {
                            await updateUserRoleAction(
                              p.id,
                              e.target.value as "superadmin" | "editor"
                            );
                            window.location.reload();
                          });
                        }}
                        className="rounded-lg border border-silver/50 bg-white px-2 py-1 text-xs outline-none focus:border-primary"
                      >
                        <option value="editor">ادیتور</option>
                        <option value="superadmin">سوپرادمین</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.id !== currentUserId && (
                      <button
                        disabled={busyId === p.id}
                        onClick={() => {
                          if (
                            !confirm(
                              `حساب ${p.email} برای همیشه حذف شود؟`
                            )
                          )
                            return;
                          setBusyId(p.id);
                          startTransition(async () => {
                            const res = await deleteUserAction(p.id);
                            if (res?.error) alert(res.error);
                            window.location.reload();
                          });
                        }}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                      >
                        حذف
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
