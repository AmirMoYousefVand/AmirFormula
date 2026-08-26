import { Database } from "@/lib/supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type SocialLink = Database["public"]["Tables"]["social_links"]["Row"];

export type UserRole = Profile["role"];
