import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PostActions from "./post-actions";

export default async function AdminPostsPage() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, slug, title_fa, title_en, status, view_count, published_at, created_at")
    .order("created_at", { ascending: false });

  const statusLabel: Record<string, string> = {
    published: "منتشرشده",
    draft: "پیش‌نویس",
    scheduled: "زمان‌بندی‌شده",
  };

  const statusColor: Record<string, string> = {
    published: "bg-green-100 text-green-700",
    draft: "bg-silver/20 text-body",
    scheduled: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-navy">مدیریت مقالات</h1>
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-navy transition-colors hover:bg-primary-hover"
        >
          + مقاله جدید
        </Link>
      </header>

      {!posts?.length ? (
        <div className="rounded-xl bg-white py-16 text-center shadow-sm ring-1 ring-silver/40">
          <p className="text-body">هنوز مقاله‌ای وجود ندارد</p>
          <Link href="/admin/posts/new" className="mt-4 inline-block text-sm font-bold text-primary-hover">
            اولین مقاله را بنویسید
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-silver/40">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-silver/15 text-xs text-body">
                <tr>
                  <th className="px-4 py-3 text-start font-bold">عنوان</th>
                  <th className="px-4 py-3 text-center font-bold">وضعیت</th>
                  <th className="hidden px-4 py-3 text-center font-bold md:table-cell">بازدید</th>
                  <th className="hidden px-4 py-3 text-start font-bold md:table-cell">تاریخ</th>
                  <th className="px-4 py-3 text-center font-bold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver/20">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-silver/5">
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy">{post.title_fa}</div>
                      {post.title_en && (
                        <div className="text-xs text-body" dir="ltr">
                          {post.title_en}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${statusColor[post.status]}`}>
                        {statusLabel[post.status]}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-center md:table-cell">
                      <span className="text-body">{post.view_count.toLocaleString("fa-IR")}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-body md:table-cell">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString("fa-IR")
                        : new Date(post.created_at).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="px-4 py-3">
                      <PostActions postId={post.id} postSlug={post.slug} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
