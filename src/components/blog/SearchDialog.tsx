"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

type Result = {
  slug: string;
  title: string;
  excerpt: string | null;
};

export default function SearchDialog() {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(0);
  }, []);

  // Global keyboard shortcut Ctrl/Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // Close on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Click outside to close
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        open &&
        dialogRef.current &&
        !dialogRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, close]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&locale=${locale}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, locale]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      router.push(`/${locale}/blog/${results[activeIndex].slug}`);
      close();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-navy/60 p-4 pt-[10vh] backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={t("placeholder")}
          className="w-full border-b border-silver/40 bg-transparent px-4 py-4 text-navy outline-none placeholder:text-silver"
        />

        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-body">
              {t("searching")}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-body">
              {t("noResults")}
            </div>
          )}

          {!query && (
            <div className="px-4 py-6 text-center text-xs text-silver">
              {t("hint")}
            </div>
          )}

          {results.map((r, i) => (
            <Link
              key={r.slug}
              href={`/${locale}/blog/${r.slug}`}
              onClick={close}
              onMouseEnter={() => setActiveIndex(i)}
              className={`block border-b border-silver/20 px-4 py-3 ${
                i === activeIndex ? "bg-primary/10" : ""
              }`}
            >
              <div className="font-semibold text-navy">{r.title}</div>
              {r.excerpt && (
                <div className="mt-1 line-clamp-1 text-xs text-body">
                  {r.excerpt}
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between bg-silver/10 px-4 py-2 text-xs text-body">
          <span>↑↓ {t("navigate")}</span>
          <span>Enter {t("select")}</span>
          <span>Esc {t("close")}</span>
        </div>
      </div>
    </div>
  );
}
