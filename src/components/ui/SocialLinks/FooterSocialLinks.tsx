import { getSocialLinks } from "@/actions/social-links";
import { DynamicIcon } from "./DynamicIcon";

export default async function FooterSocialLinks() {
  const links = await getSocialLinks();

  if (!links || links.length === 0) {
    return null;
  }

  return (
    <>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-full bg-white/10 p-2 text-white/80 transition-all hover:scale-110 hover:bg-white/20 hover:text-white"
          title={link.platform}
        >
          <DynamicIcon
            name={link.icon_name || "Globe"}
            className="h-4 w-4"
            withColor
          />
        </a>
      ))}
    </>
  );
}
