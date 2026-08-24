"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";

type Comment = {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
};

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
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">(
    "idle"
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;

    if (name.trim().length < 2 || content.trim().length < 2) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          author_name: name.trim(),
          content: content.trim(),
          website: honeypot,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("ok");
      setName("");
      setContent("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="mt-12 border-t border-silver/30 pt-8">
      <h2 className="mb-6 text-xl font-bold text-navy">
        {t("title")} ({comments.length})
      </h2>

      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-body">{t("empty")}</p>
        )}

        {comments.map((c) => (
          <article
            key={c.id}
            className="rounded-lg bg-silver/10 p-4"
          >
            <header className="mb-2 flex items-baseline justify-between gap-2">
              <span className="font-bold text-navy">{c.author_name}</span>
              <time className="text-xs text-silver">
                {formatDate(c.created_at, locale)}
              </time>
            </header>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-body">
              {c.content}
            </p>
          </article>
        ))}
      </div>

      <form onSubmit={submit} className="mt-8 rounded-xl bg-white p-5 ring-1 ring-silver/40">
        <h3 className="mb-4 font-bold text-navy">{t("formTitle")}</h3>

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

        {/* Honeypot — hidden from real users */}
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
            {t("error")}
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
