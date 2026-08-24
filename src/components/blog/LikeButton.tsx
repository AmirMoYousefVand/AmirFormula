"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

const FP_KEY = "amir-formula-fp";
const LIKED_KEY = "amir-formula-liked-posts";

export default function LikeButton({ slug }: { slug: string }) {
  const t = useTranslations("likes");
  const locale = useLocale();
  const [count, setCount] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        let fp = localStorage.getItem(FP_KEY);
        if (!fp) {
          fp = crypto.randomUUID();
          localStorage.setItem(FP_KEY, fp);
        }

        const likedList: string[] = JSON.parse(
          localStorage.getItem(LIKED_KEY) || "[]"
        );

        const res = await fetch(
          `/api/likes?slug=${encodeURIComponent(slug)}&fingerprint=${fp}`
        );
        if (!res.ok) throw new Error("failed");
        const data = await res.json();

        if (!cancelled) {
          setCount(data.count);
          setLiked(data.liked || likedList.includes(slug));
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function toggle() {
    if (loading) return;
    setLoading(true);

    try {
      let fp = localStorage.getItem(FP_KEY);
      if (!fp) {
        fp = crypto.randomUUID();
        localStorage.setItem(FP_KEY, fp);
      }

      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, fingerprint: fp }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();

      setCount(data.count);
      setLiked(data.liked);

      const likedList: string[] = JSON.parse(
        localStorage.getItem(LIKED_KEY) || "[]"
      );
      localStorage.setItem(
        LIKED_KEY,
        JSON.stringify(
          data.liked
            ? [...new Set([...likedList, slug])]
            : likedList.filter((s) => s !== slug)
        )
      );
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={liked}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
        liked
          ? "bg-primary text-navy shadow-sm"
          : "bg-silver/20 text-navy hover:bg-primary/20"
      } disabled:opacity-50`}
    >
      <svg className="h-4 w-4" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
      {count !== null ? count.toLocaleString(locale === "fa" ? "fa-IR" : "en-US") : "—"}
    </button>
  );
}
