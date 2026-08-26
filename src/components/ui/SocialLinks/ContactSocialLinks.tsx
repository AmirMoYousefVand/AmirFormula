import { getSocialLinks } from "@/actions/social-links";
import { DynamicIcon, getBrandColor } from "./DynamicIcon";

export default async function ContactSocialLinks() {
  const links = await getSocialLinks();

  if (!links || links.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-silver/40">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-navy">
        <DynamicIcon name="link" className="h-6 w-6 text-primary" />
        شبکه‌های اجتماعی
      </h2>

      <div className="flex flex-col gap-3">
        {links.map((link) => {
          const color = getBrandColor(link.icon_name);

          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl p-4 text-navy transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: color,
                boxShadow: `0 4px 12px ${color}44`,
              }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25 shadow-sm">
                <DynamicIcon
                  name={link.icon_name || "Globe"}
                  className="h-5 w-5"
                  withColor={false}
                />
              </div>
              <span className="font-bold text-white">{link.platform}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
