import Link from "next/link";
import { getTranslations } from "next-intl/server";
import TagList from "./TagList";
import { formatDate } from "@/lib/utils";

export default async function PostCard(
  props: {
    locale: string;
    slug: string;
    title: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: string;
    views: number;
    likes: number;
    tags: { name: string; slug: string }[];
  }
) {
  const t = await getTranslations({ locale: props.locale, namespace: "blog" });
  const href = `/${props.locale}/blog/${props.slug}`;

  return (
    <article className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-silver/40 transition-all hover:-translate-y-1 hover:shadow-md">
      <Link href={href} className="block">
        <div className="relative aspect-video bg-navy-light">
          {props.coverImage ? (
            <img
              src={props.coverImage}
              alt={props.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-white/20">
              F1
            </div>
          )}
          <span className="absolute start-3 top-3 rounded bg-primary px-2.5 py-1 text-xs font-bold text-navy">
            {formatDate(props.publishedAt, props.locale)}
          </span>
        </div>
      </Link>

      <div className="p-5">
        <Link href={href}>
          <h2 className="mb-2 text-lg font-bold leading-snug text-navy transition-colors group-hover:text-primary-hover">
            {props.title}
          </h2>
        </Link>

        {props.excerpt && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-body">
            {props.excerpt}
          </p>
        )}

        <div className="mb-4">
          <TagList tags={props.tags} locale={props.locale} small />
        </div>

        <div className="flex items-center gap-4 text-xs text-body">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {props.views.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {props.likes}
          </span>
        </div>
      </div>
    </article>
  );
}
