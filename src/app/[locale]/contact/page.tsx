import ContactForm from "./ContactForm";
import { getTranslations } from "next-intl/server";
import ContactSocialLinks from "@/components/ui/SocialLinks/ContactSocialLinks";
import EditableText from "@/components/ui/EditableText";

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
        <EditableText
          namespace="contact"
          tKey="title"
          text={t("title")}
          as="h1"
          className="mb-3 text-3xl font-black text-navy md:text-4xl"
        />
        <EditableText
          namespace="contact"
          tKey="subtitle"
          text={t("subtitle")}
          as="p"
          className="text-body"
        />
      </header>

      <div className="grid gap-12 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <ContactForm />
        </div>

        <div className="lg:col-span-2 space-y-8">
          <ContactSocialLinks />
        </div>
      </div>
    </div>
  );
}
