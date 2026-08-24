import { createClient } from "@/lib/supabase/server";
import CommentActions from "./comment-actions";

export default async function AdminCommentsPage() {
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from("comments")
    .select("id, author_name, content, status, created_at, posts(title_fa, slug)")
    .order("created_at", { ascending: false });

  const pending = (comments || []).filter((c) => c.status === "pending");
  const approved = (comments || []).filter((c) => c.status === "approved");

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy">مدیریت نظرات</h1>
        <p className="mt-1 text-sm text-body">
          <span className="font-bold text-primary-hover">{pending.length}</span>{" "}
          نظر در انتظار تأیید
        </p>
      </header>

      {/* Pending */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-bold text-navy">در انتظار تأیید</h2>

        {pending.length === 0 ? (
          <div className="rounded-xl bg-white py-10 text-center shadow-sm ring-1 ring-silver/40">
            <p className="text-sm text-body">نظر جدیدی نیست 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((c) => (
              <CommentCard key={c.id} comment={c} />
            ))}
          </div>
        )}
      </section>

      {/* Approved */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-navy">تأییدشده</h2>

        {approved.length === 0 ? (
          <p className="rounded-xl bg-white py-8 text-center shadow-sm ring-1 ring-silver/40">
            <span className="text-sm text-body">هنوز نظری تأیید نشده</span>
          </p>
        ) : (
          <div className="space-y-3">
            {approved.map((c) => (
              <CommentCard key={c.id} comment={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CommentCard({ comment: c }: { comment: any }) {
  return (
    <article className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-silver/40">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-bold text-navy">{c.author_name}</span>
        <span className="text-xs text-body">
          درباره «{c.posts?.title_fa}»
        </span>
        <time className="ms-auto text-xs text-silver" dir="ltr">
          {new Date(c.created_at).toLocaleString("fa-IR")}
        </time>
      </div>

      <p className="whitespace-pre-wrap rounded-lg bg-silver/10 p-3 text-sm leading-relaxed text-body">
        {c.content}
      </p>

      <CommentActions commentId={c.id} status={c.status} />
    </article>
  );
}
