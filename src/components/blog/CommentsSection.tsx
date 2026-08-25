"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";

type Comment = {
  id: string;
  parent_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
};

// Recursive comment node
function CommentNode({
  comment,
  replies,
  locale,
  onReply,
}: {
  comment: Comment;
  replies: Comment[];
  locale: string;
  onReply: (id: string, name: string) => void;
}) {
  return (
    <article className="rounded-lg bg-silver/10 p-4 mb-4">
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <span className="font-bold text-navy">{comment.author_name}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onReply(comment.id, comment.author_name)}
            className="text-xs font-bold text-primary-hover hover:text-navy"
          >
            پاسخ
          </button>
          <time className="text-xs text-silver">
            {formatDate(comment.created_at, locale)}
          </time>
        </div>
      </header>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">
        {comment.content}
      </p>

      {/* Render children if any */}
      {replies.length > 0 && (
        <div className="mt-4 ms-6 border-s-2 border-silver/30 ps-4 space-y-4">
          {replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              replies={[]} // For simplicity, limit nesting visually if preferred, but schema allows infinite
              locale={locale}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export default function CommentsSection({
  slug,
  comments,
}: {
  slug: string;
  comments: Comment[];
}) {
  const t = useTranslations("comments");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const FP_KEY = "amir-formula-fp";

  // Build comment tree (1 level deep for visual simplicity, though schema allows more)
  const roots = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;

    if (name.trim().length < 2 || content.trim().length < 2) {
      setStatus("error");
      setErrorMsg("نام و متن نظر باید حداقل ۲ حرف باشند.");
      return;
    }

    let fp = localStorage.getItem(FP_KEY);
    if (!fp) {
      fp = crypto.randomUUID();
      localStorage.setItem(FP_KEY, fp);
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          parent_id: replyTo?.id || undefined,
          author_name: name.trim(),
          author_fingerprint: fp,
          content: content.trim(),
          website: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطای نامشخص");
      }

      setStatus("ok");
      setContent("");
      setReplyTo(null);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <section className="mt-12 border-t border-silver/30 pt-8">
      <h2 className="mb-6 text-xl font-bold text-navy">
        {t("title")} ({comments.length})
      </h2>

      <div>
        {comments.length === 0 && (
          <p className="text-sm text-body">{t("empty")}</p>
        )}

        {roots.map((rootComment) => (
          <CommentNode
            key={rootComment.id}
            comment={rootComment}
            replies={getReplies(rootComment.id)}
            locale={locale}
            onReply={(id, name) => {
              setReplyTo({ id, name });
              document.getElementById("comment-form")?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        ))}
      </div>

      <form id="comment-form" onSubmit={submit} className="mt-8 rounded-xl bg-white p-5 ring-1 ring-silver/40">
        <h3 className="mb-4 font-bold text-navy">
          {replyTo ? `پاسخ به ${replyTo.name}` : t("formTitle")}
        </h3>

        {replyTo && (
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="mb-4 text-xs font-bold text-red-500 hover:text-red-700"
          >
            × انصراف از پاسخ
          </button>
        )}

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          maxLength={80}
          required
          className="mb-3 w-full rounded-lg border border-silver/50 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("commentPlaceholder")}
          rows={4}
          maxLength={2000}
          required
          className="mb-3 w-full resize-y rounded-lg border border-silver/50 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary"
        />

        {/* Honeypot */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        {status === "ok" && (
          <p className="mb-3 rounded bg-green-50 px-3 py-2 text-sm text-green-700">
            {t("submitted")}
          </p>
        )}
        {status === "error" && (
          <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">
            {errorMsg || t("error")}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {status === "sending" ? t("sending") : t("submit")}
        </button>
      </form>
    </section>
  );
}
