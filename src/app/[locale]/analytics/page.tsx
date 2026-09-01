import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import EditableText from "@/components/ui/EditableText";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "analytics" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("analytics");

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      {/* Badge */}
      <span className="mb-6 inline-block rounded-full bg-primary/15 px-5 py-1.5 text-sm font-bold text-primary">
        {t("badge")}
      </span>

      <EditableText
        namespace="analytics"
        tKey="title"
        text={t("title")}
        as="h1"
        className="mb-4 text-3xl font-black text-navy md:text-4xl"
      />

      <EditableText
        namespace="analytics"
        tKey="subtitle"
        text={t("subtitle")}
        as="p"
        className="mx-auto mb-12 max-w-2xl text-body"
      />

      {/* Feature cards */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        {(["f1", "f2", "f3", "f4"] as const).map((key) => (
          <div
            key={key}
            className="rounded-xl bg-silver/15 p-6 text-start ring-1 ring-silver/30"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-lg">
              {key === "f1"
                ? "📊"
                : key === "f2"
                  ? "🆚"
                  : key === "f3"
                    ? "📈"
                    : "🏆"}
            </div>
            <p className="font-bold text-navy">{t(key)}</p>
          </div>
        ))}
      </div>

      {/* Telemetry Compare CTA */}
      <div className="mb-8 rounded-2xl bg-navy p-8 text-center">
        <p className="mb-3 text-lg font-bold text-white"> بهترین سکتورهای رانندگان</p>
        <p className="mb-4 text-sm text-white/60">
          بهترین سکتورها و دور ایده‌آل هر راننده رو در هر سشن ببینید و مقایسه کنید
        </p>
        <Link
          href="/analytics/best-sectors"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-navy transition-transform hover:scale-105 hover:bg-primary-hover"
        >
          🏎️ مشاهده سکتورها
        </Link>
      </div>

      {/* Telegram CTA */}
      <div className="rounded-2xl bg-navy p-8">
        <p className="mb-4 text-white">{t("followUs")}</p>
        <a
          href="https://t.me/Amir_formula"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-navy transition-transform hover:scale-105 hover:bg-primary-hover"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          {t("telegramBtn")}
        </a>
      </div>
    </div>
  );
}
