import { NextRequest, NextResponse } from "next/server";
import { likeSchema } from "@/lib/validation";
import { createClient } from "@supabase/supabase-js";

// GET /api/likes?slug=...&fingerprint=...
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const fp = request.nextUrl.searchParams.get("fingerprint");

  if (!slug || !fp) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get post id
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ count: 0, liked: false });
  }

  // Count total likes
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post.id);

  // Check if this fingerprint liked
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", post.id)
    .eq("fingerprint", fp)
    .maybeSingle();

  return NextResponse.json({
    count: count || 0,
    liked: !!existing,
  });
}

// POST /api/likes { slug, fingerprint }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = likeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { slug, fingerprint } = parsed.data;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get post
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Toggle: check if exists
  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", post.id)
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  let liked: boolean;

  if (existing) {
    // Unlike
    await supabase.from("likes").delete().eq("id", existing.id);
    liked = false;
  } else {
    // Like
    await supabase
      .from("likes")
      .insert({ post_id: post.id, fingerprint });
    liked = true;
  }

  // Get updated count
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", post.id);

  return NextResponse.json({ count: count || 0, liked });
}
