import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import StorageManager from "./storage-manager";

export default async function AdminStoragePage() {
  const supabase = await createClient();
  // Service-role client lists ALL files regardless of storage RLS policies
  const adminClient = createAdminClient();

  const [{ data: files }, { data: posts }] = await Promise.all([
    adminClient.storage.from("covers").list(undefined, {
      limit: 500,
      sortBy: { column: "created_at", order: "desc" },
    }),
    supabase.from("posts").select("cover_image_url, content_fa, content_en"),
  ]);

  // Determine which files are referenced by any post
  const usedNames = new Set<string>();
  for (const post of posts || []) {
    const text = `${post.cover_image_url || ""} ${post.content_fa || ""} ${post.content_en || ""}`;
    for (const match of text.matchAll(
      /\/storage\/v1\/object\/public\/covers\/([^"'?)\s]+)/g
    )) {
      usedNames.add(decodeURIComponent(match[1]));
    }
  }

  const fileList = (files || [])
    .filter((f) => f.name && f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({
      name: f.name,
      size: f.metadata?.size || 0,
      createdAt: f.created_at || "",
      inUse: usedNames.has(f.name),
    }));

  const totalBytes = fileList.reduce((s, f) => s + f.size, 0);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy">فضای ذخیره‌سازی</h1>
        <p className="mt-1 text-sm text-body">
          مدیریت عکس‌های آپلودشده در سرور (باکت covers)
        </p>
      </header>

      <StorageManager files={fileList} totalBytes={totalBytes} />
    </div>
  );
}
