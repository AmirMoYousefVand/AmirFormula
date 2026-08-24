"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deletePostAction } from "@/actions/posts";

export default function PostActions({
  postId,
  postSlug,
}: {
  postId: string;
  postSlug: string;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-center gap-1">
      <Link
        href={`/admin/posts/${postId}/edit`}
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-hover hover:bg-primary/10"
      >
        ویرایش
      </Link>

      <Link
        href={`/fa/blog/${postSlug}`}
        target="_blank"
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-body hover:bg-silver/20"
      >
        مشاهده
      </Link>

      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
        >
          حذف
        </button>
      ) : (
        <button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await deletePostAction(postId);
              if (result?.error) alert(result.error);
            })
          }
          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
        >
          {isPending ? "..." : "تأیید حذف"}
        </button>
      )}
    </div>
  );
}
