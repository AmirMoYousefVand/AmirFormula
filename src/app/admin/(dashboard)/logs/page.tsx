import { createClient } from "@/lib/supabase/server";
import LogsTable from "./logs-table";
import { redirect } from "next/navigation";

export default async function AdminLogsPage() {
  const supabase = await createClient();

  // Verify owner/admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "author") {
    redirect("/admin");
  }

  // Fetch logs
  const { data: logs } = await supabase
    .from("system_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-navy">لاگ‌های سیستم</h1>
          <p className="mt-1 text-sm text-body">
            گزارش اتفاقات و عملیات ۲۴ ساعت اخیر (خودکار پاک می‌شوند)
          </p>
        </div>
      </header>

      <LogsTable initialLogs={logs || []} />
    </div>
  );
}
