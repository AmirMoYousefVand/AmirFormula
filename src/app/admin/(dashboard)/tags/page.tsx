import { createClient } from "@/lib/supabase/server";
import TagManager from "./tag-manager";

export default async function AdminTagsPage() {
  const supabase = await createClient();
  const { data: tags } = await supabase.from("tags").select("*").order("name_fa");

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy">مدیریت برچسب‌ها</h1>
        <p className="mt-1 text-sm text-body">
          برچسب‌ها برای دسته‌بندی مقالات استفاده می‌شوند
        </p>
      </header>

      <TagManager initialTags={tags || []} />
    </div>
  );
}
