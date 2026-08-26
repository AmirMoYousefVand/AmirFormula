import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Purge the ISR/page caches for every public route so fresh content
  // is served immediately — no files are touched.
  for (const path of ["/", "/fa", "/en", "/fa/blog", "/en/blog", "/fa/analytics", "/en/analytics", "/fa/contact", "/en/contact"]) {
    revalidatePath(path);
  }
  // Blog detail/tag pages are dynamic; layouts cover their shells
  revalidatePath("/fa/blog/[slug]", "page");
  revalidatePath("/en/blog/[slug]", "page");

  return NextResponse.json({ ok: true });
}
