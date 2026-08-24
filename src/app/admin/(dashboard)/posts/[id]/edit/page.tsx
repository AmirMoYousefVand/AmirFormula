import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostForm from "@/components/admin/PostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: tags }] = await Promise.all([
    supabase.from("posts").select("*").eq("id", id).maybeSingle(),
    supabase.from("tags").select("*").order("name_fa"),
  ]);

  if (!post) notFound();

  const { data: postTags } = await supabase
    .from("post_tags")
    .select("tag_id")
    .eq("post_id", id);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy">ویرایش مقاله</h1>
        <p className="mt-1 text-sm text-body">{post.title_fa}</p>
      </header>

      <PostForm
        post={post}
        tags={tags || []}
        selectedTagIds={(postTags || []).map((pt) => pt.tag_id)}
      />
    </div>
  );
}
