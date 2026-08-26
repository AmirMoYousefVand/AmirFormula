import ContactForm from "./ContactForm";
import Donations from "@/components/Donations";
import { getTranslations } from "next-intl/server";
import ContactSocialLinks from "@/components/ui/SocialLinks/ContactSocialLinks";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-black text-navy md:text-4xl">
          {t("title")}
        </h1>
        <p className="text-body">{t("subtitle")}</p>
      </header>

      <div className="grid gap-12 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <ContactForm />
        </div>

        <div className="lg:col-span-2 space-y-8">
          <ContactSocialLinks />
          <Donations />
        </div>
      </div>
    </div>
  );
}
