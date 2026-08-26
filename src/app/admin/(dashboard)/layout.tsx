import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteLogoUrl } from "@/components/SiteLogo";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const [{ data: profile }, logoUrl] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, email, full_name")
      .eq("id", user.id)
      .single(),
    getSiteLogoUrl(),
  ]);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        role={profile?.role || "editor"}
        email={profile?.email || user.email || ""}
        logoUrl={logoUrl}
      />
      <main className="flex-1 px-4 pb-10 pt-16 lg:pt-8 lg:px-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
