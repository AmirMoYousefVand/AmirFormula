import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getPublishedPosts, localizedTitle, localizedExcerpt } from "@/lib/queries";
import PostCard from "@/components/blog/PostCard";
import Pagination from "@/components/ui/Pagination";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function BlogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  setRequestLocale(locale);

  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const t = await getTranslations("blog");
  const { posts, totalPages } = await getPublishedPosts(page);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10">
        <h1 className="mb-2 text-3xl font-black text-navy md:text-4xl">
          {t("title")}
        </h1>
        <p className="text-body">{t("subtitle")}</p>
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
