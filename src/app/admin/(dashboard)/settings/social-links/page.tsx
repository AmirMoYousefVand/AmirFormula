import { getAllSocialLinks } from "@/actions/social-links";
import { SocialLinksManager } from "./social-links-manager";
import SettingsTabs from "../settings-tabs";

export default async function AdminSocialLinksPage() {
  const links = await getAllSocialLinks();

  return (
    <div>
      <SettingsTabs />

      <SocialLinksManager initialLinks={links || []} />
    </div>
  );
}