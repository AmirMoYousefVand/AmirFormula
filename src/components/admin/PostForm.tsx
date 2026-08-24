"use client";

import { useActionState, useState } from "react";
import { savePostAction } from "@/actions/posts";
import type { Post, Tag } from "@/lib/supabase/database.types";
import MarkdownEditor from "./MarkdownEditor";

type Props = {
  post?: Post | null;
  tags: Tag[];
  selectedTagIds: string[];
};

export default function PostForm({ post, tags, selectedTagIds }: Props) {
  const [state, formAction, isPending] = useActionState(savePostAction, null);

  const [titleFa, setTitleFa] = useState(post?.title_fa || "");
  const [contentFa, setContentFa] = useState(post?.content_fa || "");
  const [contentEn, setContentEn] = useState(post?.content_en || "");
  const [status, setStatus] = useState(post?.status || "draft");
  const [tagIds, setTagIds] = useState<string[]>(selectedTagIds);
  const [activeTab, setActiveTab] = useState<"fa" | "en">("fa");

  function toggleTag(id: string) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="content_fa" value={contentFa} />
      <input type="hidden" name="content_en" value={contentEn} />
      <input type="hidden" name="tag_ids" value={JSON.stringify(tagIds)} />

      {/* Status + publish date row */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-silver/40">
        <div>
          <label className="mb-1 block text-xs font-bold text-navy">وضعیت</label>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-lg border border-silver/50 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="draft">پیش‌نویس</option>
            <option value="scheduled">زمان‌بندی‌شده</option>
            <option value="published">منتشرشده</option>
          </select>
        </div>

        {(status === "scheduled" || (post?.published_at && status !== "draft")) && (
          <div>
            <label className="mb-1 block text-xs font-bold text-navy">
              تاریخ انتشار
            </label>
            <input
              type="datetime-local"
              name="published_at"
              defaultValue={
                post?.published_at
                  ? new Date(post.published_at).toISOString().slice(0, 16)
                  : ""
              }
              className="rounded-lg border border-silver/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="ms-auto rounded-full bg-primary px-8 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? "در حال ذخیره..." : "ذخیره مقاله"}
        </button>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
            <label className="mb-1 block text-sm font-bold text-navy">
              عنوان (فارسی) *
            </label>
            <input
              name="title_fa"
              value={titleFa}
              onChange={(e) => setTitleFa(e.target.value)}
              required
              maxLength={200}
              className="mb-4 w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />

            <label className="mb-1 block text-sm font-bold text-navy">
              عنوان (انگلیسی)
            </label>
            <input
              name="title_en"
              defaultValue={post?.title_en || ""}
              dir="ltr"
              maxLength={200}
              className="w-full rounded-lg border border-silver/50 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Content tabs */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
            <div className="mb-4 flex gap-1 rounded-lg bg-silver/15 p-1">
              {(["fa", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveTab(lang)}
                  className={`flex-1 rounded-md py-1.5 text-sm font-bold transition-colors ${
                    activeTab === lang
                      ? "bg-white text-navy shadow-sm"
                      : "text-body hover:text-navy"
                  }`}
                >
                  {lang === "fa" ? "متن فارسی *" : "English content"}
                </button>
              ))}
            </div>

            {activeTab === "fa" ? (
              <MarkdownEditor value={contentFa} onChange={setContentFa} />
            ) : (
              <MarkdownEditor value={contentEn} onChange={setContentEn} dir="ltr" />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
            <label className="mb-1 block text-sm font-bold text-navy">
              شناسه URL (slug)
            </label>
            <input
              name="slug"
              defaultValue={post?.slug || ""}
              dir="ltr"
              placeholder="auto-from-title"
              pattern="[a-z0-9؀-ۿ-]*"
              className="w-full rounded-lg border border-silver/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
            <label className="mb-1 block text-sm font-bold text-navy">
              خلاصه (فارسی)
            </label>
            <textarea
              name="excerpt_fa"
              defaultValue={post?.excerpt_fa || ""}
              rows={3}
              maxLength={300}
              className="mb-3 w-full resize-y rounded-lg border border-silver/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />

            <label className="mb-1 block text-sm font-bold text-navy">
              Excerpt (EN)
            </label>
            <textarea
              name="excerpt_en"
              defaultValue={post?.excerpt_en || ""}
              rows={3}
              maxLength={300}
              dir="ltr"
              className="w-full resize-y rounded-lg border border-silver/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
            <label className="mb-1 block text-sm font-bold text-navy">
              لینک تصویر کاور
            </label>
            <input
              name="cover_image_url"
              defaultValue={post?.cover_image_url || ""}
              dir="ltr"
              placeholder="https://..."
              className="w-full rounded-lg border border-silver/50 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <p className="mt-2 text-xs text-body">
              آدرس تصویر آپلودشده در Supabase Storage (باکت covers)
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
            <label className="mb-2 block text-sm font-bold text-navy">برچسب‌ها</label>
            {tags.length === 0 ? (
              <p className="text-xs text-body">
                هنوز برچسبی نساخته‌اید — از بخش برچسب‌ها اضافه کنید
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const selected = tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? "bg-primary text-navy"
                          : "bg-silver/20 text-body hover:bg-silver/40"
                      }`}
                    >
                      {tag.name_fa}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
