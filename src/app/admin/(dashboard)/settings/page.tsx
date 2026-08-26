import { createClient } from "@/lib/supabase/server";
import SiteSettingsForm from "./settings-form";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from("site_settings").select("key, value");

  const settings: Record<string, string> = {};
  for (const row of rows || []) {
    if (row.value) settings[row.key] = row.value;
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy">تنظیمات سایت</h1>
        <p className="mt-1 text-sm text-body">
          نام سایت، توضیحات و فاوآیکون را از اینجا تغییر دهید
        </p>
      </header>

      <SiteSettingsForm initial={settings} />
    </div>
  );
}
