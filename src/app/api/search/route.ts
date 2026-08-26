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

  // RLS ensures only publicly visible posts are searched.
  // Full-text: titles, excerpts, AND raw Markdown/HTML content in both languages.
  const searchFilter =
    [
      `${titleCol}.ilike.%${q}%`,
      `${excerptCol}.ilike.%${q}%`,
      `title_fa.ilike.%${q}%`,
      `content_fa.ilike.%${q}%`,
      `content_en.ilike.%${q}%`,
    ].join(",");

  const { data: posts } = await supabase
    .from("posts")
    .select(
      `slug, ${titleCol}, ${excerptCol}, title_fa, title_en, excerpt_fa, excerpt_en, content_fa, content_en`
    )
    .or(PUBLIC_POST_FILTER)
    .or(searchFilter)
    .limit(10);

  // Build snippets from content around the first match
  const results = (posts || []).map((p) => {
    const title =
      ((p as Record<string, unknown>)[titleCol] as string) || p.title_fa;
    const excerpt =
      ((p as Record<string, unknown>)[excerptCol] as string) || p.excerpt_fa;

    // Find the query in either content column and extract a ~120 char snippet
    const contents = [p.content_fa || "", p.content_en || ""];
    let snippet = excerpt || "";
    const needle = q.toLowerCase();

    for (const text of contents) {
      if (!text) continue;
      const idx = text.toLowerCase().indexOf(needle);
      if (idx === -1) continue;

      // Strip markdown noise for a clean snippet
      const plain = text
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → text
        .replace(/[#*_>`~]/g, "")
        .replace(/\s+/g, " ");

      const plainIdx = plain.toLowerCase().indexOf(needle);
      if (plainIdx !== -1) {
        const start = Math.max(0, plainIdx - 40);
        snippet =
          (start > 0 ? "…" : "") +
          plain.slice(start, plainIdx + needle.length + 80).trim() +
          "…";
        break;
      }
    }

    return { slug: p.slug, title, excerpt: snippet };
  });

  return NextResponse.json({ results });
}
