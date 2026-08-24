import Link from "next/link";

export default function TagList({
  tags,
  locale,
  small = false,
}: {
  tags: { name: string; slug: string }[];
  locale: string;
  small?: boolean;
}) {
  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Link
          key={tag.slug}
          href={`/${locale}/blog/tag/${tag.slug}`}
          className={`inline-block rounded-full bg-silver/20 px-2.5 py-0.5 font-medium text-navy-light transition-colors hover:bg-primary/20 hover:text-navy ${
            small ? "text-xs" : "text-sm"
          }`}
        >
          {tag.name}
        </Link>
      ))}
    </div>
  );
}
