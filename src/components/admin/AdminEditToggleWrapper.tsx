import { createClient } from "@/lib/supabase/server";
import AdminEditToggle from "./AdminEditToggle";

export default async function AdminEditToggleWrapper() {
  let isAdmin = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = profile?.role === "owner" || profile?.role === "admin";
    }
  } catch {
    // Not logged in or error
  }

  return <AdminEditToggle isAdmin={isAdmin} />;
}
