"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import SearchDialog from "@/components/blog/SearchDialog";

const navKeys = ["home", "blog", "analytics", "contact"] as const;

export default function Header({ logoUrl }: { logoUrl?: string | null }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-navy shadow-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="لوگو"
                width={36}
                height={36}
                className="shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-black text-navy">
                A
              </span>
            )}
            <span className="text-lg font-black tracking-tight text-white">
              Amir<span className="text-primary"> Formula</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navKeys.map((key) => {
              const href =
                key === "home"
                  ? "/"
                  : key === "blog"
                    ? "/blog"
                    : `/${key}`;
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);

              return (
                <Link
                  key={key}
                  href={href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-white/10 text-primary"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>

            <LanguageSwitcher />

            {/* Mobile menu button */}
            <details className="relative md:hidden">
              <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-white/80 hover:bg-white/10 [&::-webkit-details-marker]:hidden">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </summary>
              <div className="absolute end-0 top-11 w-44 overflow-hidden rounded-xl bg-navy-light py-1 shadow-xl ring-1 ring-white/10">
                {navKeys.map((key) => {
                  const href =
                    key === "home"
                      ? "/"
                      : key === "blog"
                        ? "/blog"
                        : `/${key}`;

                  return (
                    <Link
                      key={key}
                      href={href}
                      className="block px-4 py-2.5 text-sm text-white/85 hover:bg-white/10 hover:text-primary"
                    >
                      {t(key)}
                    </Link>
                  );
                })}
              </div>
            </details>
          </div>
        </div>
      </header>

      <SearchDialog />
    </>
  );
}
