import { createClient } from "@/lib/supabase/server";

/**
 * Reads the uploaded logo URL from site_settings.
 * Must only be called from Server Components with request scope (layouts/pages).
 */
export async function getSiteLogoUrl(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "site_logo_url")
      .maybeSingle();

    return data?.value || null;
  } catch {
    return null;
  }
}
