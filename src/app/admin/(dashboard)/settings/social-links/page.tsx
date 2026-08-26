import { getAllSocialLinks } from "@/actions/social-links";
import { SocialLinksManager } from "./social-links-manager";

export default async function AdminSocialLinksPage() {
  const links = await getAllSocialLinks();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy">مدیریت شبکه‌های اجتماعی</h1>
        <p className="mt-1 text-sm text-body">
          لینک‌های نمایش داده شده در فوتر و صفحه تماس را مدیریت کنید
        </p>
      </header>

      <SocialLinksManager initialLinks={links || []} />
    </div>
  );
}