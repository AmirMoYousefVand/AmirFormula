"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Command = {
  label: string;
  hint: string;
  href: string;
  icon: string;
};

const commands: Command[] = [
  { label: "داشبورد", hint: "آمار کلی سایت", href: "/admin", icon: "📊" },
  { label: "مقاله جدید", hint: "نوشتن مقاله با ادیتور پیشرفته", href: "/admin/posts/new", icon: "✍️" },
  { label: "مدیریت مقالات", hint: "ویرایش، حذف و مشاهده مقالات", href: "/admin/posts", icon: "📝" },
  { label: "کامنت‌ها", hint: "تأیید یا حذف نظرات کاربران", href: "/admin/comments", icon: "💬" },
  { label: "برچسب‌ها", hint: "مدیریت دسته‌بندی‌ها", href: "/admin/tags", icon: "🏷" },
  { label: "فضای ذخیره‌سازی", hint: "گالری عکس‌ها و پاکسازی فضا", href: "/admin/storage", icon: "💾" },
  { label: "تنظیمات سایت", hint: "نام سایت، توضیحات و فاوآیکون", href: "/admin/settings", icon: "⚙️" },
  { label: "مدیران", hint: "دعوت ادیتور و تغییر نقش‌ها", href: "/admin/users", icon: "👥" },
  { label: "مشاهده سایت", hint: "باز کردن صفحه اصلی در تب جدید", href: "/fa", icon: "🌐" },
];

export default function AdminCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

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

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (open && boxRef.current && !boxRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, close]);

  // Close palette when navigating
  useEffect(() => {
    close();
  }, [pathname, close]);

  const filtered = commands.filter(
    (c) =>
      c.label.includes(query.trim()) ||
      c.hint.includes(query.trim()) ||
      c.href.toLowerCase().includes(query.trim().toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-navy/60 p-4 pt-[12vh] backdrop-blur-sm">
      <div
        ref={boxRef}
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
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && filtered[activeIndex]) {
              router.push(filtered[activeIndex].href);
              close();
            }
          }}
          placeholder="به کجا می‌خواهید بروید؟ (Ctrl+K)"
          className="w-full border-b border-silver/40 bg-transparent px-4 py-4 text-sm text-navy outline-none placeholder:text-silver"
        />

        <div className="max-h-80 overflow-y-auto">
          {!filtered.length && (
            <div className="px-4 py-6 text-center text-sm text-body">موردی پیدا نشد</div>
          )}

          {filtered.map((c, i) =>
            c.href === "/fa" ? (
              <a
                key={c.href}
                href={c.href}
                target="_blank"
                onMouseEnter={() => setActiveIndex(i)}
                onClick={close}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i === activeIndex ? "bg-primary/10" : ""
                }`}
              >
                <span className="text-lg">{c.icon}</span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-navy">{c.label}</span>
                  <span className="block text-xs text-body">{c.hint}</span>
                </span>
                <span className="text-xs text-silver">↗</span>
              </a>
            ) : (
              <Link
                key={c.href}
                href={c.href}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={close}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i === activeIndex ? "bg-primary/10" : ""
                }`}
              >
                <span className="text-lg">{c.icon}</span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-navy">{c.label}</span>
                  <span className="block text-xs text-body">{c.hint}</span>
                </span>
              </Link>
            )
          )}
        </div>

        <div className="flex items-center justify-between bg-silver/10 px-4 py-2 text-[11px] text-body">
          <span>↑↓ حرکت</span>
          <span>Enter انتخاب</span>
          <span>Esc بستن</span>
        </div>
      </div>
    </div>
  );
}
