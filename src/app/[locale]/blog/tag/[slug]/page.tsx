import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedPosts, localizedTitle, localizedExcerpt } from "@/lib/queries";
import PostCard from "@/components/blog/PostCard";
import Pagination from "@/components/ui/Pagination";

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, slug } = await params;
  const { page: pageParam } = await searchParams;
  setRequestLocale(locale);

  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const t = await getTranslations("blog");
  const { posts, totalPages } = await getPublishedPosts(page, slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link
        href="/blog"
        className="mb-6 inline-block text-sm font-medium text-body hover:text-primary-hover"
      >
        → {t("backToBlog")}
      </Link>

      <header className="mb-10">
        <p className="mb-1 text-sm text-body">{t("taggedWith")}</p>
        <h1 className="text-3xl font-black text-navy">#{slug}</h1>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-xl bg-silver/15 py-20 text-center text-lg text-body">
          🏁 {t("empty")}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
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
                name: (locale === "en" ? tg.name_en : tg.name_fa) || tg.name_fa,
                slug: tg.slug,
              }))}
            />
          ))}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
