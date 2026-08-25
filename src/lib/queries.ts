import { createClient } from "@/lib/supabase/server";
import { PUBLIC_POST_FILTER, POSTS_PER_PAGE } from "@/lib/utils";
import type { Post, Tag } from "@/lib/supabase/database.types";

export type PostWithTags = Post & {
  tags: Pick<Tag, "slug" | "name_fa" | "name_en">[];
};

export function localizedTitle(
  post: Pick<Post, "title_fa" | "title_en">,
  locale: string
): string {
  return (locale === "en" ? post.title_en : post.title_fa) || post.title_fa;
}

export function localizedExcerpt(
  post: Pick<Post, "excerpt_fa" | "excerpt_en">,
  locale: string
): string | null {
  return (locale === "en" ? post.excerpt_en : post.excerpt_fa) || post.excerpt_fa;
}

export function localizedContent(
  post: Pick<Post, "content_fa" | "content_en">,
  locale: string
): string {
  return (locale === "en" ? post.content_en : post.content_fa) || post.content_fa;
}

async function getTagsForPosts(postIds: string[]) {
  if (!postIds.length) return new Map<string, Tag[]>();

  const supabase = await createClient();
  const { data } = await supabase
    .from("post_tags")
    .select("post_id, tags(*)")
    .in("post_id", postIds);

  const map = new Map<string, Tag[]>();
  for (const row of data || []) {
    const tag = row.tags as unknown as Tag;
    if (!tag) continue;
    const list = map.get(row.post_id) || [];
    list.push(tag);
    map.set(row.post_id, list);
  }
  return map;
}

function attachTags(
  posts: Post[],
  tagMap: Map<string, Tag[]>
): PostWithTags[] {
  return posts.map((p) => ({ ...p, tags: tagMap.get(p.id) || [] }));
}

export async function getPublishedPosts(page = 1, tagSlug?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("*", { count: "estimated" })
    .or(PUBLIC_POST_FILTER)
    .order("published_at", { ascending: false });

  if (tagSlug) {
    const { data: tagRow } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", tagSlug)
      .maybeSingle();

    if (!tagRow) {
      return { posts: [], total: 0, totalPages: 0 };
    }

    const { data: ptRows } = await supabase
      .from("post_tags")
      .select("post_id")
      .eq("tag_id", tagRow.id);

    const ids = (ptRows || []).map((r) => r.post_id);
    if (!ids.length) return { posts: [], total: 0, totalPages: 0 };
    query = query.in("id", ids);
  }

  const { data: posts, count } = await query
    .range(
      (page - 1) * POSTS_PER_PAGE,
      page * POSTS_PER_PAGE - 1
    );

  const total = count || 0;
  const tagMap = await getTagsForPosts((posts || []).map((p) => p.id));

  return {
    posts: attachTags(posts || [], tagMap),
    total,
    totalPages: Math.max(1, Math.ceil(total / POSTS_PER_PAGE)),
  };
}

export async function getPostBySlug(slug: string) {
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .or(PUBLIC_POST_FILTER)
    .eq("slug", slug)
    .maybeSingle();

  if (!post) return null;

  const tagMap = await getTagsForPosts([post.id]);
  return attachTags([post], tagMap)[0];
}

export async function getFeaturedPosts(limit = 3) {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .or(PUBLIC_POST_FILTER)
    .order("published_at", { ascending: false })
    .limit(limit);

  const tagMap = await getTagsForPosts((posts || []).map((p) => p.id));
  return attachTags(posts || [], tagMap);
}

export async function getAllTags() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tags")
    .select("*")
    .order("name_fa");
  return data || [];
}

export async function getApprovedComments(postId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("id, author_name, content, created_at")
    .eq("post_id", postId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });
  return data || [];
}
