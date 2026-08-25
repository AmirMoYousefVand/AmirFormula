import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Parallel queries for stats
  const [postsRes, commentsRes, topPostsRes] = await Promise.all([
    supabase.from("posts").select("id, status, view_count, like_count, title_fa, slug, published_at"),
    supabase
      .from("comments")
      .select("id, status, author_name, content, created_at, posts(title_fa, slug)"),
    supabase.from("posts").select("title_fa, view_count, like_count, slug").order("view_count", { ascending: false }).limit(5)
  ]);

  const posts = postsRes.data || [];
  const topPosts = topPostsRes.data || [];
  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    draft: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    totalViews: posts.reduce((s, p) => s + p.view_count, 0),
  };

  const allComments = commentsRes.data || [];
  const pendingComments = allComments.filter((c) => c.status === "pending");
  const recentComments = [...allComments]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const scheduledPosts = posts
    .filter((p) => p.status === "scheduled" && p.published_at)
    .sort(
      (a, b) =>
        new Date(a.published_at!).getTime() - new Date(b.published_at!).getTime()
    )
    .slice(0, 5);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-black text-navy">داشبورد</h1>
        <p className="mt-1 text-sm text-body">خلاصه وضعیت سایت</p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="کل مقالات" value={formatNumber(stats.total, "fa")} icon="📝" />
        <StatCard label="منتشرشده" value={formatNumber(stats.published, "fa")} icon="✅" />
        <StatCard label="پیش‌نویس" value={formatNumber(stats.draft, "fa")} icon="📄" />
        <StatCard label="زمان‌بندی‌شده" value={formatNumber(stats.scheduled, "fa")} icon="⏰" />
        <StatCard label="کامنت در انتظار" value={formatNumber(pendingComments.length, "fa")} icon="💬" highlight={pendingComments.length > 0} />
        <StatCard label="کل بازدیدها" value={formatNumber(stats.totalViews, "fa")} icon="👁" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Top Posts */}
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40 lg:col-span-2">
          <h2 className="mb-4 font-bold text-navy">مقاله‌های پربازدید</h2>
          {topPosts.length === 0 ? (
            <p className="py-6 text-center text-sm text-body">مقاله‌ای وجود ندارد</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topPosts.map((p) => (
                <Link key={p.slug} href={`/fa/blog/${p.slug}`} target="_blank" className="flex flex-col rounded-lg bg-silver/10 p-4 transition-colors hover:bg-silver/20">
                  <span className="font-bold text-navy line-clamp-1">{p.title_fa}</span>
                  <div className="mt-2 flex items-center gap-4 text-xs text-body">
                    <span className="flex items-center gap-1">👁 {formatNumber(p.view_count, "fa")}</span>
                    <span className="flex items-center gap-1">❤️ {formatNumber(p.like_count, "fa")}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Pending comments */}
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-navy">آخرین نظرات</h2>
            <Link href="/admin/comments" className="text-xs font-bold text-primary-hover hover:text-navy">
              مدیریت نظرات ←
            </Link>
          </div>

          {recentComments.length === 0 ? (
            <p className="py-6 text-center text-sm text-body">نظری ثبت نشده</p>
          ) : (
            <div className="space-y-3">
              {recentComments.map((c) => (
                <div key={c.id} className="rounded-lg bg-silver/10 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-navy">{c.author_name}</span>
                    {c.status === "pending" && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700">
                        در انتظار
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-body">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Scheduled posts */}
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-silver/40">
          <h2 className="mb-4 font-bold text-navy">انتشارهای زمان‌بندی‌شده</h2>

          {scheduledPosts.length === 0 ? (
            <p className="py-6 text-center text-sm text-body">مقاله زمان‌بندی‌شده‌ای نیست</p>
          ) : (
            <div className="space-y-3">
              {scheduledPosts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-silver/10 p-3">
                  <span className="truncate text-sm font-medium text-navy">{p.title_fa}</span>
                  <time className="shrink-0 text-xs text-primary-hover" dir="ltr">
                    {new Date(p.published_at!).toLocaleString("fa-IR")}
                  </time>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-primary-hover"
        >
          + مقاله جدید
        </Link>
        <Link
          href="/admin/comments"
          className="rounded-full bg-navy-light px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy"
        >
          بررسی کامنت‌ها
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-5 shadow-sm ring-1 ${
        highlight
          ? "bg-yellow-50 ring-primary/40"
          : "bg-white ring-silver/40"
      }`}
    >
      <div className="mb-1 text-xl">{icon}</div>
      <div className="text-2xl font-black text-navy">{value}</div>
      <div className="text-xs text-body">{label}</div>
    </div>
  );
}
