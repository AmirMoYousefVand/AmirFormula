import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[‌ً-ْ]/g, "") // ZWNJ + Arabic diacritics
    .replace(/[^؀-ۿ\w\s-]/g, "") // keep Persian chars, word chars, spaces, dashes
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function formatDate(dateStr: string | Date, locale: string): string {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatNumber(n: number, locale: string): string {
  return n.toLocaleString(locale === "fa" ? "fa-IR" : "en-US");
}

export function excerptFrom(content: string, maxLen = 160): string {
  const plain = content
    .replace(/[#*_>`~\[\]()!]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + "…" : plain;
}

export const POSTS_PER_PAGE = 9;

/** RLS-safe visibility filter used in public queries */
export const PUBLIC_POST_FILTER =
  "status.eq.published,and(status.eq.scheduled,published_at.lte.now())";
