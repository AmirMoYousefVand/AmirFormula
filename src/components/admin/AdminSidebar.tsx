"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/actions/auth";
import AdminCommandPalette from "./AdminCommandPalette";

const links = [
  { href: "/admin", label: "داشبورد", icon: "📊", exact: true },
  { href: "/admin/posts", label: "مقالات", icon: "📝" },
  { href: "/admin/comments", label: "نظرات", icon: "💬" },
  { href: "/admin/tags", label: "برچسب‌ها", icon: "🏷" },
  { href: "/admin/storage", label: "فضای ذخیره‌سازی", icon: "💾", adminOnly: true },
  { href: "/admin/settings", label: "تنظیمات سایت", icon: "⚙️", adminOnly: true },
  { href: "/admin/settings/social-links", label: "شبکه‌های اجتماعی", icon: "🌐", adminOnly: true },
  { href: "/admin/users", label: "مدیران", icon: "👥", adminOnly: true },
];

export function AdminSidebar({
  role,
  email,
  logoUrl,
}: {
  role: string;
  email: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <>
      <AdminCommandPalette />

      {/* Mobile topbar */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 lg:hidden">
        <span className="font-black text-white">پنل مدیریت</span>
        <button
          onClick={() => setOpen(!open)}
          className="text-white"
          aria-label="منو"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      <aside
        className={`fixed inset-y-0 start-0 z-40 flex w-60 flex-col bg-navy transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:rtl:translate-x-0"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="لوگو"
              width={32}
              height={32}
              className="shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-navy">
              A
            </span>
          )}
          <div>
            <div className="text-sm font-black text-white">Amir Formula</div>
            <div className="text-xs text-white/50">پنل مدیریت</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {/* Command palette trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="mb-3 flex w-full items-center justify-between rounded-lg bg-white/5 px-4 py-2 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span>جستجوی سریع...</span>
            <kbd className="rounded border border-white/20 px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
          </button>

          {links.map((link) => {
            if (link.adminOnly && !["owner", "admin"].includes(role)) return null;

            const active = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-navy"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-2 truncate px-2 text-xs text-white/50">{email}</div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500/20 hover:text-red-300"
            >
              خروج از حساب
            </button>
          </form>
          <Link
            href="/fa"
            className="mt-2 block w-full rounded-lg px-4 py-2 text-center text-sm text-white/60 hover:text-primary"
          >
            ← بازگشت به سایت
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
