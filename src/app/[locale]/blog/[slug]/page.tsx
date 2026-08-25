import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getPostBySlug,
  getApprovedComments,
  localizedTitle,
  localizedExcerpt,
  localizedContent,
} from "@/lib/queries";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer";
import CommentsSection from "@/components/blog/CommentsSection";
import LikeButton from "@/components/blog/LikeButton";
import ViewTracker from "@/components/blog/ViewTracker";
import TagList from "@/components/blog/TagList";
import { formatDate, formatNumber } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };

  return {
    title: localizedTitle(post, locale),
    description: post.meta_description || localizedExcerpt(post, locale) || undefined,
    keywords: post.meta_keywords || undefined,
    openGraph: {
      title: localizedTitle(post, locale),
      description: post.meta_description || localizedExcerpt(post, locale) || undefined,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const tc = await getTranslations("comments");
  const comments = await getApprovedComments(post.id);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <ViewTracker slug={slug} />

      <Link
        href="/blog"
        className="mb-6 inline-block text-sm font-medium text-body hover:text-primary-hover"
      >
        → {t("backToBlog")}
      </Link>

      <header className="mb-8">
        <h1 className="mb-4 text-3xl font-black leading-tight text-navy md:text-4xl">
          {localizedTitle(post, locale)}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-silver/30 pb-5 text-sm text-body">
          <time dateTime={post.published_at || post.created_at}>
            {formatDate(post.published_at || post.created_at, locale)}
          </time>
          <span>
            👁 {formatNumber(post.view_count, locale)} {t("views")}
          </span>
        </div>

        {post.tags.length > 0 && (
          <div className="mt-4">
            <TagList
              tags={post.tags.map((tg) => ({
                name: (locale === "en" ? tg.name_en : tg.name_fa) || tg.name_fa,
                slug: tg.slug,
              }))}
              locale={locale}
            />
          </div>
        )}
      </header>

      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt={localizedTitle(post, locale)}
          className="mb-8 w-full rounded-xl shadow-md"
        />
      )}

      <MarkdownRenderer content={localizedContent(post, locale)} />

      <div className="mt-10 flex items-center gap-3">
        <LikeButton slug={slug} />
        <span className="text-sm text-body">{tc("title")}</span>
      </div>

      <CommentsSection slug={slug} comments={comments} />
    </article>
  );
}
