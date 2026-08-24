import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Use service-role to bypass RLS for the atomic increment function
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await supabase.rpc("increment_post_views", {
    p_slug: slug,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return the updated count
  const { data: post } = await supabase
    .from("posts")
    .select("view_count")
    .eq("slug", slug)
    .maybeSingle();

  return NextResponse.json({ views: post?.view_count || 0 });
}
