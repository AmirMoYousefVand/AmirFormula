"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/settings", label: "تنظیمات عمومی", icon: "⚙️" },
  { href: "/admin/settings/social-links", label: "شبکه‌های اجتماعی", icon: "🌐" },
];

export default function AdminSettingsLayout() {
  const pathname = usePathname();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy">تنظیمات سایت</h1>
      </header>

      <nav className="mb-6 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              pathname === tab.href
                ? "bg-primary text-navy"
                : "text-body hover:bg-silver/10 hover:text-navy"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </nav>

      <div id="settings-content" />
    </div>
  );
}