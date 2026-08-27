import { createAdminClient } from "./supabase/admin";

type LogLevel = "info" | "warn" | "error";

async function logEvent(
  level: LogLevel,
  action: string,
  details?: any,
  userId?: string | null
) {
  try {
    // Only use admin client because we want to log regardless of current user's RLS permissions
    // and this happens server-side only.
    const supabase = createAdminClient();
    await supabase.from("system_logs").insert({
      level,
      action,
      details: details ? JSON.parse(JSON.stringify(details)) : null,
      user_id: userId || null,
    });
  } catch (error) {
    console.error("Failed to write system log:", error);
  }
}

export async function logInfo(action: string, details?: any, userId?: string | null) {
  return logEvent("info", action, details, userId);
}

export async function logWarn(action: string, details?: any, userId?: string | null) {
  return logEvent("warn", action, details, userId);
}

export async function logError(action: string, details?: any, userId?: string | null) {
  return logEvent("error", action, details, userId);
}
