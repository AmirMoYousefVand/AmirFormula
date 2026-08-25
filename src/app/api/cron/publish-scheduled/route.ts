import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends Authorization: Bearer CRON_SECRET)
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Publish due scheduled posts
  const { data: due, error } = await supabase
    .from("posts")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("status", "scheduled")
    .lte("published_at", new Date().toISOString())
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Keep-alive ping so Supabase free tier doesn't pause
  await supabase.from("posts").select("id").limit(1);

  return NextResponse.json({
    published: due?.length || 0,
    ranAt: new Date().toISOString(),
  });
}
