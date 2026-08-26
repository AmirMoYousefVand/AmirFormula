import { createClient } from "@/lib/supabase/server";
import SiteSettingsForm from "./settings-form";
import SettingsTabs from "./settings-tabs";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from("site_settings").select("key, value");

  const settings: Record<string, string> = {};
  for (const row of rows || []) {
    if (row.value) settings[row.key] = row.value;
  }

  return (
    <div>
      <SettingsTabs />

      <SiteSettingsForm initial={settings} />
    </div>
  );
}
