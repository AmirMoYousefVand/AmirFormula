import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getFeaturedPosts, localizedTitle, localizedExcerpt } from "@/lib/queries";
import PostCard from "@/components/blog/PostCard";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const featured = await getFeaturedPosts(3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 24px)",
          }}
        />
        <div className="absolute -top-24 end-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32">
          <div className="max-w-2xl">
            <span className="mb-4 inline-block rounded-full border border-primary/40 px-4 py-1.5 text-sm font-bold text-primary">
              {t("heroBadge")}
            </span>

            <h1 className="mb-5 text-4xl font-black leading-tight text-white md:text-5xl">
              {t("heroTitle")}
            </h1>

            <p className="mb-8 text-lg leading-relaxed text-white/70">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/blog"
                className="rounded-full bg-primary px-7 py-3 font-bold text-navy transition-colors hover:bg-primary-hover"
              >
                {t("ctaBlog")}
              </Link>
              <Link
                href="/analytics"
                className="rounded-full border-2 border-white/25 px-7 py-3 font-bold text-white transition-colors hover:border-primary hover:text-primary"
              >
                {t("ctaAnalytics")}
              </Link>
            </div>
          </div>
        </div>

        {/* Checkered strip */}
        <div aria-hidden className="checkered-strip" />
      </section>

      {/* Featured posts */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black text-navy md:text-3xl">
            {t("featuredTitle")}
          </h2>
          <Link
            href="/blog"
            className="text-sm font-bold text-primary-hover hover:text-navy"
          >
            {t("featuredAll")} ←
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-xl bg-silver/15 py-16 text-center text-body">
            <p className="text-lg">🏁</p>
            <p className="mt-2">
              {locale === "fa"
                ? "اولین مقاله به‌زودی منتشر می‌شود!"
                : "First article coming soon!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((post) => (
              <PostCard
                key={post.id}
                locale={locale}
                slug={post.slug}
                title={localizedTitle(post, locale)}
                excerpt={localizedExcerpt(post, locale)}
                coverImage={post.cover_image_url}
                publishedAt={post.published_at || post.created_at}
                views={post.view_count}
                likes={0}
                tags={post.tags.map((tg) => ({
                  name:
                    (locale === "en" ? tg.name_en : tg.name_fa) || tg.name_fa,
                  slug: tg.slug,
                }))}
              />
            ))}
          </div>
        )}
      </section>

      {/* About + Telegram CTA */}
      <section className="bg-silver/20">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl font-black text-navy md:text-3xl">
                {t("aboutTitle")}
              </h2>
              <p className="leading-relaxed text-body">{t("aboutText")}</p>
            </div>

            <div className="rounded-2xl bg-navy p-8 text-center shadow-lg">
              <p className="mb-5 font-bold text-white">
                📢{" "}
                {locale === "fa"
                  ? "تحلیل‌های روزانه در تلگرام"
                  : "Daily analysis on Telegram"}
              </p>
              <a
                href="https://t.me/Amir_formula"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-navy transition-transform hover:scale-105 hover:bg-primary-hover"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                {t("telegramCta")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
