import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_POST_FILTER } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const locale = request.nextUrl.searchParams.get("locale") || "fa";

  if (q.length < 2 || q.length > 100) {
    return NextResponse.json({ results: [] });
  }

  const titleCol = locale === "en" ? "title_en" : "title_fa";
  const excerptCol = locale === "en" ? "excerpt_en" : "excerpt_fa";

  const supabase = await createClient();

  // RLS ensures only publicly visible posts are searched
  const { data: posts } = await supabase
    .from("posts")
    .select(`slug, ${titleCol}, ${excerptCol}`)
    .or(PUBLIC_POST_FILTER)
    .or(`${titleCol}.ilike.%${q}%,${excerptCol}.ilike.%${q}%,title_fa.ilike.%${q}%`)
    .limit(10);

  return NextResponse.json({
    results: (posts || []).map((p) => ({
      slug: p.slug,
      title: p[titleCol as keyof typeof p],
      excerpt: p[excerptCol as keyof typeof p],
    })),
  });
}
