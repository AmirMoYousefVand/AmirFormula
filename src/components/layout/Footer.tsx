import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import FooterSocialLinks from "@/components/ui/SocialLinks/FooterSocialLinks";
import EditableText from "@/components/ui/EditableText";

export default function Footer({ logoUrl }: { logoUrl?: string | null }) {
  const t = useTranslations("footer");

  return (
    <footer className="mt-auto bg-navy">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="لوگو"
                width={32}
                height={32}
                className="shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-navy">
                A
              </span>
            )}
            <span className="font-black text-white" dir="ltr">
              Amir<span className="text-primary"> Formula</span>
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/70">
            <Link href="/blog" className="hover:text-primary">
              {t("blog")}
            </Link>
            <Link href="/analytics" className="hover:text-primary">
              {t("analytics")}
            </Link>
            <Link href="/contact" className="hover:text-primary">
              {t("contact")}
            </Link>
          </nav>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <FooterSocialLinks />
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Amir Formula —{" "}
          <EditableText namespace="footer" tKey="rights" text={t("rights")} as="span" />
        </div>
      </div>
    </footer>
  );
}
