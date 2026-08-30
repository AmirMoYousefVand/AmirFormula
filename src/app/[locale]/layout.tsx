import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Vazirmatn, Space_Grotesk } from "next/font/google";
import { routing } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { getSiteLogoUrl } from "@/components/SiteLogo";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { EditModeProvider } from "@/components/ui/EditModeProvider";
import AdminEditToggleWrapper from "@/components/admin/AdminEditToggleWrapper";
import "../globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("site_settings")
      .select("key, value");

    const settings: Record<string, string> = {};
    for (const row of rows || []) {
      if (row.value) settings[row.key] = row.value;
    }

    const siteName = settings.site_name || "Amir Formula";

    return {
      title: {
        default: `${siteName} — تحلیل فرمول ۱`,
        template: `%s | ${siteName}`,
      },
      description:
        settings.site_description ||
        "مقالات و تحلیل‌های داده‌محور دنیای فرمول ۱ — F1 articles and data-driven analysis",
      icons: settings.favicon_url
        ? { icon: settings.favicon_url }
        : undefined,
    };
  } catch {
    return {
      title: {
        default: "Amir Formula — تحلیل فرمول ۱",
        template: "%s | Amir Formula",
      },
      description:
        "مقالات و تحلیل‌های داده‌محور دنیای فرمول ۱ — F1 articles and data-driven analysis",
    };
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const logoUrl = await getSiteLogoUrl();
  const dir = locale === "fa" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${vazirmatn.variable} ${spaceGrotesk.variable} flex min-h-screen flex-col`}
      >
        <NextIntlClientProvider>
          <EditModeProvider>
            <Header logoUrl={logoUrl} />
            <main className="flex-1">{children}</main>
            <Footer logoUrl={logoUrl} />
            <AdminEditToggleWrapper />
          </EditModeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
