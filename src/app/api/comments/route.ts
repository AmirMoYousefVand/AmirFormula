import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { commentSchema } from "@/lib/validation";
import { PUBLIC_POST_FILTER } from "@/lib/utils";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot: bots fill the "website" field — pretend success
  if (
    typeof body === "object" &&
    body !== null &&
    (body as Record<string, unknown>).website
  ) {
    return NextResponse.json({ ok: true });
  }

  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { slug, author_name, author_fingerprint, content, parent_id } = parsed.data;
  const supabase = await createClient();

  // Resolve slug → post id (only for publicly visible posts)
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", slug)
    .or(PUBLIC_POST_FILTER)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Identity verification to prevent spoofing:
  // 1. Has this fingerprint used a different name?
  const { data: fpUsedName } = await supabase
    .from("comments")
    .select("author_name")
    .eq("author_fingerprint", author_fingerprint)
    .limit(1)
    .maybeSingle();

  if (fpUsedName && fpUsedName.author_name !== author_name) {
    return NextResponse.json({ error: `شما قبلا با نام '${fpUsedName.author_name}' کامنت گذاشته‌اید. از همان نام استفاده کنید.` }, { status: 403 });
  }

  // 2. Has this name been used by a different fingerprint?
  const { data: nameUsedFp } = await supabase
    .from("comments")
    .select("author_fingerprint")
    .eq("author_name", author_name)
    .limit(1)
    .maybeSingle();

  if (nameUsedFp && nameUsedFp.author_fingerprint !== author_fingerprint) {
    return NextResponse.json({ error: "این نام قبلا توسط شخص دیگری استفاده شده است." }, { status: 403 });
  }

  // Insert as pending — RLS enforces status='pending' for anon
  const { error } = await supabase.from("comments").insert({
    post_id: post.id,
    parent_id: parent_id || null,
    author_name,
    author_fingerprint,
    content,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
