"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logInfo, logError } from "@/lib/logger";

export async function getSocialLinks() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("social_links")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching social links:", error);
    return [];
  }

  return data;
}

export async function getAllSocialLinks() {
  const supabase = await createClient();
  
  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "owner" && profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("social_links")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching all social links:", error);
    return [];
  }

  return data;
}

export async function addSocialLinkAction(formData: FormData) {
  const supabase = await createClient();

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner" && profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const data = {
    platform: String(formData.get("platform") || ""),
    url: String(formData.get("url") || ""),
    icon_name: String(formData.get("icon_name") || "Globe"),
    sort_order: parseInt(String(formData.get("sort_order") || "0")),
    is_active: formData.get("is_active") === "true"
  };

  const { error } = await supabase
    .from("social_links")
    .insert([data] as any);

  if (error) {
    await logError("ADD_SOCIAL_LINK_FAILED", { error: error.message, data }, user.id);
    throw new Error(error.message);
  }

  await logInfo("SOCIAL_LINK_ADDED", { platform: data.platform }, user.id);

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateSocialLinkAction(id: string, formData: FormData) {
  const supabase = await createClient();

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner" && profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const data = {
    platform: String(formData.get("platform") || ""),
    url: String(formData.get("url") || ""),
    icon_name: String(formData.get("icon_name") || "Globe"),
    sort_order: parseInt(String(formData.get("sort_order") || "0")),
    is_active: formData.get("is_active") === "true"
  };

  const { error } = await supabase
    .from("social_links")
    .update({ ...data, updated_at: new Date().toISOString() } as any)
    .eq("id", id);

  if (error) {
    await logError("UPDATE_SOCIAL_LINK_FAILED", { error: error.message, id }, user.id);
    throw new Error(error.message);
  }

  await logInfo("SOCIAL_LINK_UPDATED", { platform: data.platform, id }, user.id);

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteSocialLinkAction(id: string) {
  const supabase = await createClient();
  
  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  if (profile?.role !== "owner" && profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("social_links")
    .delete()
    .eq("id", id);

  if (error) {
    await logError("DELETE_SOCIAL_LINK_FAILED", { error: error.message, id }, user.id);
    throw new Error(error.message);
  }

  await logInfo("SOCIAL_LINK_DELETED", { id }, user.id);

  revalidatePath("/", "layout");
  return { success: true };
}
