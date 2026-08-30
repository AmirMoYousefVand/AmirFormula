import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import TelemetryCompare from "@/components/analytics/TelemetryCompare";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Telemetry Compare | Amir Formula",
    description: "Compare F1 driver telemetry data across sessions",
  };
}

export default async function TelemetryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TelemetryCompare />;
}
