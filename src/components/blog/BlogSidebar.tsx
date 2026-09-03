import Link from "next/link";
import {
  getFeaturedPosts,
  getMostReadPosts,
  getLatestApprovedComments,
  localizedTitle,
} from "@/lib/queries";
import Image from "next/image";
import { Clock, Eye, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BlogSidebarProps {
  locale: string;
}

export default async function BlogSidebar({ locale }: BlogSidebarProps) {
  const [latestPosts, mostReadPosts, latestComments] = await Promise.all([
    getFeaturedPosts(5),
    getMostReadPosts(5),
    getLatestApprovedComments(5),
  ]);

  const dict = {
    latestPosts: locale === "en" ? "Latest Articles" : "آخرین مقالات",
    mostRead: locale === "en" ? "Most Read" : "پربازدیدترین‌ها",
    recentComments: locale === "en" ? "Recent Comments" : "آخرین نظرات",
    readMore: locale === "en" ? "Read more" : "ادامه مطلب",
    onPost: locale === "en" ? "on" : "در",
  };

  return (
    <div className="space-y-8">
      {/* Latest Posts Widget */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-silver/20">
        <h3 className="text-xl font-bold text-navy mb-4 pb-2 border-b border-silver/20 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          {dict.latestPosts}
        </h3>
        <div className="space-y-4">
          {latestPosts.map((post) => (
            <Link
              href={`/${locale}/blog/${post.slug}`}
              key={post.id}
              className="group flex gap-3 items-center"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-silver/10">
                {post.cover_image_url && (
                  <Image
                    src={post.cover_image_url}
                    alt={localizedTitle(post, locale)}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-navy group-hover:text-primary transition-colors line-clamp-2">
                  {localizedTitle(post, locale)}
                </h4>
                <div className="text-xs text-silver mt-1">
                  {formatDate(post.published_at || post.created_at, locale)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Most Read Widget */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-silver/20">
        <h3 className="text-xl font-bold text-navy mb-4 pb-2 border-b border-silver/20 flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          {dict.mostRead}
        </h3>
        <div className="space-y-4">
          {mostReadPosts.map((post, index) => (
            <Link
              href={`/${locale}/blog/${post.slug}`}
              key={post.id}
              className="group flex gap-3 items-center"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-navy group-hover:text-primary transition-colors line-clamp-2">
                  {localizedTitle(post, locale)}
                </h4>
                <div className="text-xs text-silver mt-1">
                  {post.view_count || 0} {locale === "en" ? "views" : "بازدید"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Comments Widget */}
      {latestComments.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-silver/20">
          <h3 className="text-xl font-bold text-navy mb-4 pb-2 border-b border-silver/20 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {dict.recentComments}
          </h3>
          <div className="space-y-4">
            {latestComments.map((comment) => (
              <div key={comment.id} className="text-sm border-b border-silver/10 last:border-0 pb-3 last:pb-0">
                <div className="font-bold text-navy mb-1">{comment.author_name}</div>
                <div className="text-body line-clamp-2 mb-2 italic bg-silver/5 p-2 rounded-lg border-r-2 border-primary">
                  {comment.content}
                </div>
                {comment.post && !Array.isArray(comment.post) && (
                  <div className="text-xs text-silver flex gap-1">
                    {dict.onPost}{" "}
                    <Link
                      href={`/${locale}/blog/${(comment.post as any).slug}#comments`}
                      className="text-primary hover:underline line-clamp-1"
                    >
                      {localizedTitle(comment.post as any, locale)}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
