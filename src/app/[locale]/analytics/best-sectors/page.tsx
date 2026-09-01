import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import BestSectorsView from "@/components/analytics/BestSectorsView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return {
    title: "Best Sectors | Amir Formula",
    description:
      "Every driver's best sectors and ideal lap times per F1 session",
  };
}

export default async function TelemetryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BestSectorsView />;
}
