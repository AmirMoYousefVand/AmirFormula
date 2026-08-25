import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Vazirmatn, Inter } from "next/font/google";
import "../globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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

  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.variable} ${inter.variable} min-h-screen bg-slate-50`}>{children}</body>
    </html>
  );
}
