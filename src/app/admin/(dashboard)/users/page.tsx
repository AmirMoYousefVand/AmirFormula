import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UsersManager from "./users-manager";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  // Server-side admin/owner gate (defense in depth)
  if (!me || !["owner", "admin"].includes(me.role)) {
    redirect("/admin");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: true });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy">مدیریت کاربران</h1>
        <p className="mt-1 text-sm text-body">
          دعوت کاربران جدید، تغییر نقش‌ها و حذف حساب‌ها
        </p>
      </header>

      <UsersManager
        profiles={profiles || []}
        currentUserId={user!.id}
        currentUserRole={me.role as "owner" | "admin" | "author"}
      />
    </div>
  );
}
