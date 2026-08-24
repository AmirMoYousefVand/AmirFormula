"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: string) {
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-white/10 p-0.5">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchTo(loc)}
          disabled={loc === locale}
          className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase transition-colors ${
            loc === locale
              ? "bg-primary text-navy"
              : "text-white/70 hover:text-white disabled:hover:text-white/70"
          }`}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
