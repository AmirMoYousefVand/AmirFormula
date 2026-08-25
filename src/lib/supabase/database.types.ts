export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Relationships: [];
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "superadmin" | "editor";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "superadmin" | "editor";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "superadmin" | "editor";
          created_at?: string;
        };
      };
      posts: {
        Relationships: [];
        Row: {
          id: string;
          slug: string;
          status: "draft" | "scheduled" | "published";
          title_fa: string;
          title_en: string | null;
          excerpt_fa: string | null;
          excerpt_en: string | null;
          content_fa: string;
          content_en: string | null;
          cover_image_url: string | null;
          author_id: string | null;
          published_at: string | null;
          view_count: number;
          like_count: number;
          meta_description: string | null;
          meta_keywords: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          status?: "draft" | "scheduled" | "published";
          title_fa: string;
          title_en?: string | null;
          excerpt_fa?: string | null;
          excerpt_en?: string | null;
          content_fa: string;
          content_en?: string | null;
          cover_image_url?: string | null;
          author_id?: string | null;
          published_at?: string | null;
          view_count?: number;
          like_count?: number;
          meta_description?: string | null;
          meta_keywords?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          status?: "draft" | "scheduled" | "published";
          title_fa?: string;
          title_en?: string | null;
          excerpt_fa?: string | null;
          excerpt_en?: string | null;
          content_fa?: string;
          content_en?: string | null;
          cover_image_url?: string | null;
          author_id?: string | null;
          published_at?: string | null;
          view_count?: number;
          like_count?: number;
          meta_description?: string | null;
          meta_keywords?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tags: {
        Relationships: [];
        Row: {
          id: string;
          slug: string;
          name_fa: string;
          name_en: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_fa: string;
          name_en: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name_fa?: string;
          name_en?: string;
          created_at?: string;
        };
      };
      post_tags: {
        Relationships: [];
        Row: {
          post_id: string;
          tag_id: string;
        };
        Insert: {
          post_id: string;
          tag_id: string;
        };
        Update: {
          post_id?: string;
          tag_id?: string;
        };
      };
      comments: {
        Relationships: [];
        Row: {
          id: string;
          post_id: string;
          parent_id: string | null;
          author_name: string;
          author_fingerprint: string;
          content: string;
          status: "pending" | "approved";
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          parent_id?: string | null;
          author_name: string;
          author_fingerprint: string;
          content: string;
          status?: "pending" | "approved";
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          parent_id?: string | null;
          author_name?: string;
          author_fingerprint?: string;
          content?: string;
          status?: "pending" | "approved";
          created_at?: string;
        };
      };
      likes: {
        Relationships: [];
        Row: {
          id: string;
          post_id: string;
          fingerprint: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          fingerprint: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          fingerprint?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_post_views: {
        Args: { p_slug: string };
        Returns: undefined;
      };
      toggle_post_like: {
        Args: { p_post_id: string; p_fingerprint: string };
        Returns: number;
      };
      is_superadmin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
