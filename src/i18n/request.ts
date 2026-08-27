import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { createClient } from "@/lib/supabase/server";

function deepMerge(target: any, source: any) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

function unflattenObject(data: Record<string, string>) {
  const result: any = {};
  for (const key in data) {
    const keys = key.split(".");
    keys.reduce((acc, curr, idx) => {
      return (acc[curr] =
        idx === keys.length - 1 ? data[key] : acc[curr] || {});
    }, result);
  }
  return result;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Load static messages
  const baseMessages = (await import(`../../messages/${locale}.json`)).default;

  // Load overrides from DB
  let dbMessages = {};
  try {
    const supabase = await createClient();
    const { data: overrides } = await supabase
      .from("translation_overrides")
      .select("key, value")
      .eq("locale", locale);

    if (overrides && overrides.length > 0) {
      const flatObj: Record<string, string> = {};
      for (const row of overrides) {
        flatObj[row.key] = row.value;
      }
      dbMessages = unflattenObject(flatObj);
    }
  } catch (error) {
    console.error("Failed to fetch translation overrides:", error);
  }

  // Merge deeply
  const messages = deepMerge({ ...baseMessages }, dbMessages);

  return {
    locale,
    messages,
  };
});
