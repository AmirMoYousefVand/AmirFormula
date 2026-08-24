import { createClient } from "@/lib/supabase/server";
import PostForm from "@/components/admin/PostForm";

export default async function NewPostPage() {
  const supabase = await createClient();
  const { data: tags } = await supabase.from("tags").select("*").order("name_fa");

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy">مقاله جدید</h1>
        <p className="mt-1 text-sm text-body">
          مقاله را با Markdown بنویسید — پیش‌نمایش زنده در ادیتور
        </p>
      </header>

      <PostForm tags={tags || []} selectedTagIds={[]} />
    </div>
  );
}
