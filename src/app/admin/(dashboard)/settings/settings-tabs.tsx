"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/settings", label: "تنظیمات عمومی", icon: "⚙️", exact: true },
  { href: "/admin/settings/social-links", label: "شبکه‌های اجتماعی", icon: "🌐" },
];

export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <header className="mb-6">
      <h1 className="mb-4 text-2xl font-black text-navy">تنظیمات سایت</h1>

      <nav className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                active
                  ? "bg-primary text-navy"
                  : "text-body hover:bg-silver/10 hover:text-navy"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
