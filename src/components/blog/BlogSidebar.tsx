import Link from "next/link";
import {
  getFeaturedPosts,
  getMostReadPosts,
  getMostLikedPosts,
  getLatestApprovedComments,
  localizedTitle,
} from "@/lib/queries";
import Image from "next/image";
import { Clock, Eye, Heart, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BlogSidebarProps {
  locale: string;
}

export default async function BlogSidebar({ locale }: BlogSidebarProps) {
  const [latestPosts, mostReadPosts, mostLikedPosts, latestComments] =
    await Promise.all([
      getFeaturedPosts(5),
      getMostReadPosts(5),
      getMostLikedPosts(5),
      getLatestApprovedComments(5),
    ]);

  const dict = {
    latestPosts: locale === "en" ? "Latest Articles" : "آخرین مقالات",
    mostRead: locale === "en" ? "Most Read" : "پربازدیدترین‌ها",
    mostLiked: locale === "en" ? "Most Liked" : "محبوب‌ترین‌ها",
    recentComments: locale === "en" ? "Recent Comments" : "آخرین نظرات",
    onPost: locale === "en" ? "on" : "در",
  };

  return (
    <div className="space-y-6">
      {/* Latest Posts Widget */}
      <SidebarWidget title={dict.latestPosts} icon={<Clock className="w-4 h-4 text-primary" />}>
        <div className="space-y-3">
          {latestPosts.map((post) => (
            <Link
              href={`/${locale}/blog/${post.slug}`}
              key={post.id}
              className="group flex gap-3 items-center"
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-silver/10">
                {post.cover_image_url && (
                  <Image
                    src={post.cover_image_url}
                    alt={localizedTitle(post, locale)}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
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
      </SidebarWidget>

      {/* Most Read Widget */}
      <SidebarWidget title={dict.mostRead} icon={<Eye className="w-4 h-4 text-primary" />}>
        <div className="space-y-3">
          {mostReadPosts.map((post, index) => (
            <Link
              href={`/${locale}/blog/${post.slug}`}
              key={post.id}
              className="group flex gap-3 items-center"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
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
      </SidebarWidget>

      {/* Most Liked Widget */}
      <SidebarWidget title={dict.mostLiked} icon={<Heart className="w-4 h-4 text-red-400" />}>
        <div className="space-y-3">
          {mostLikedPosts.map((post, index) => (
            <Link
              href={`/${locale}/blog/${post.slug}`}
              key={post.id}
              className="group flex gap-3 items-center"
            >
              <div className="w-7 h-7 rounded-full bg-red-50 text-red-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-navy group-hover:text-primary transition-colors line-clamp-2">
                  {localizedTitle(post, locale)}
                </h4>
                <div className="text-xs text-silver mt-1 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400" fill="currentColor" />
                  {post.like_count || 0}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SidebarWidget>

      {/* Recent Comments Widget */}
      {latestComments.length > 0 && (
        <SidebarWidget
          title={dict.recentComments}
          icon={<MessageSquare className="w-4 h-4 text-primary" />}
        >
          <div className="space-y-3">
            {latestComments.map((comment) => (
              <div
                key={comment.id}
                className="text-sm border-b border-silver/10 last:border-0 pb-3 last:pb-0"
              >
                <div className="font-bold text-navy mb-1 text-xs">
                  {comment.author_name}
                </div>
                <div className="text-xs text-body line-clamp-2 mb-1.5 italic bg-silver/5 p-2 rounded-lg border-r-2 border-primary">
                  {comment.content}
                </div>
                {comment.post && !Array.isArray(comment.post) && (
                  <div className="text-[11px] text-silver flex gap-1">
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
        </SidebarWidget>
      )}
    </div>
  );
}

function SidebarWidget({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-silver/20">
      <h3 className="text-base font-bold text-navy mb-3 pb-2 border-b border-silver/20 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}
