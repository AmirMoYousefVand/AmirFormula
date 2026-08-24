"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { saveTagAction, deleteTagAction } from "@/actions/tags";
import type { Tag } from "@/lib/supabase/database.types";

export default function TagManager({ initialTags }: { initialTags: Tag[] }) {
  const [tags] = useState(initialTags);
  const [state, formAction, isPending] = useActionState(saveTagAction, null);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [pendingDelete, startDelete] = useTransition();

  // Reset the form when a save succeeds
  useEffect(() => {
    if (state?.ok) {
      setEditing(null);
      setFormKey((k) => k + 1);
      window.location.reload(); // simple refresh to see updated list
    }
  }, [state]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Add/Edit form */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
        <h2 className="mb-4 font-bold text-navy">
          {editing ? "ویرایش برچسب" : "برچسب جدید"}
        </h2>

        <form key={formKey} action={formAction} className="space-y-3">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div>
            <label className="mb-1 block text-xs font-bold text-navy">
              نام (فارسی)
            </label>
            <input
              name="name_fa"
              defaultValue={editing?.name_fa || ""}
              required
              maxLength={80}
              className="w-full rounded-lg border border-silver/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-navy">
              Name (EN)
            </label>
            <input
              name="name_en"
              defaultValue={editing?.name_en || ""}
              required
              maxLength={80}
              dir="ltr"
              className="w-full rounded-lg border border-silver/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-navy">
              شناسه (slug)
            </label>
            <input
              name="slug"
              defaultValue={editing?.slug || ""}
              required
              dir="ltr"
              pattern="[a-z0-9؀-ۿ-]+"
              placeholder="race-review"
              className="w-full rounded-lg border border-silver/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {state?.error && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-600">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-full bg-primary py-2 text-sm font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? "..." : editing ? "ذخیره" : "افزودن"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setFormKey((k) => k + 1);
                }}
                className="rounded-full px-4 py-2 text-sm text-body hover:text-navy"
              >
                انصراف
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="lg:col-span-2">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-silver/40">
          {!tags.length ? (
            <p className="py-12 text-center text-sm text-body">
              هنوز برچسبی ساخته نشده
            </p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-silver/15 text-xs text-body">
                <tr>
                  <th className="px-4 py-3 text-start font-bold">فارسی</th>
                  <th className="px-4 py-3 text-start font-bold">English</th>
                  <th className="px-4 py-3 text-start font-bold">Slug</th>
                  <th className="px-4 py-3 text-center font-bold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/20">
                {tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-silver/5">
                    <td className="px-4 py-3 font-medium text-navy">{tag.name_fa}</td>
                    <td className="px-4 py-3 text-body" dir="ltr">{tag.name_en}</td>
                    <td className="px-4 py-3" dir="ltr">
                      <span className="rounded bg-silver/20 px-2 py-0.5 text-xs">{tag.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditing(tag);
                            setFormKey((k) => k + 1);
                          }}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-hover hover:bg-primary/10"
                        >
                          ویرایش
                        </button>
                        <button
                          disabled={pendingDelete}
                          onClick={() => {
                            if (!confirm(`برچسب «${tag.name_fa}» حذف شود؟`)) return;
                            startDelete(async () => {
                              await deleteTagAction(tag.id);
                              window.location.reload();
                            });
                          }}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
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
    </div>
  );
}
