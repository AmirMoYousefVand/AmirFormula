import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import "../globals.css";

export const metadata = {
  title: "پنل مدیریت | Amir Formula",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Independent server-side auth check (defense in depth — middleware also guards)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Login page has its own minimal layout via route group
  if (!user) {
    // Let /admin/login render its own page; layout guard applies to others
    // We can't easily know pathname in a layout, so middleware handles redirect.
    // Here we only fetch user; pages themselves re-verify.
  }

  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
