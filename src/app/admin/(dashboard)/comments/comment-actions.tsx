"use client";

import { useState, useTransition } from "react";
import {
  approveCommentAction,
  deleteCommentAction,
} from "@/actions/comments";

export default function CommentActions({
  commentId,
  status,
}: {
  commentId: string;
  status: string;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error?: string } | void>) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) alert(res.error);
    });
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      {status === "pending" && (
        <button
          disabled={isPending}
          onClick={() => run(() => approveCommentAction(commentId))}
          className="rounded-full bg-green-100 px-4 py-1.5 text-xs font-bold text-green-700 transition-colors hover:bg-green-200 disabled:opacity-50"
        >
          ✓ تأیید
        </button>
      )}

      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="rounded-full px-4 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
        >
          حذف
        </button>
      ) : (
        <>
          <button
            disabled={isPending}
            onClick={() => run(() => deleteCommentAction(commentId))}
            className="rounded-full bg-red-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
          >
            حذف قطعی
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="rounded-full px-3 py-1.5 text-xs text-body hover:text-navy"
          >
            انصراف
          </button>
        </>
      )}
    </div>
  );
}
