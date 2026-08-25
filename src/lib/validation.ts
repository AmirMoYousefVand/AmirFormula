import { z } from "zod";

export const commentSchema = z.object({
  slug: z.string().min(1).max(120),
  author_name: z.string().trim().min(2).max(80),
  author_fingerprint: z.string().min(8).max(64).regex(/^[\w-]+$/),
  content: z.string().trim().min(2).max(2000),
  parent_id: z.string().uuid().optional(),
});

export const likeSchema = z.object({
  slug: z.string().min(1).max(120),
  fingerprint: z.string().min(8).max(64).regex(/^[\w-]+$/),
});

export const postSchema = z
  .object({
    id: z.string().uuid().optional(),
    slug: z.string().min(1).max(100),
    status: z.enum(["draft", "scheduled", "published"]),
    title_fa: z.string().trim().min(2).max(200),
    title_en: z.string().trim().max(200).optional().or(z.literal("")),
    excerpt_fa: z.string().trim().max(300).optional().or(z.literal("")),
    excerpt_en: z.string().trim().max(300).optional().or(z.literal("")),
    content_fa: z.string().min(1),
    content_en: z.string().optional().or(z.literal("")),
    cover_image_url: z.string().url().optional().or(z.literal("")),
    published_at: z.string().optional(),
    meta_description: z.string().trim().max(300).optional().or(z.literal("")),
    meta_keywords: z.string().trim().max(200).optional().or(z.literal("")),
    tag_ids: z.array(z.string().uuid()).default([]),
  })
  .refine(
    (data) =>
      data.status !== "scheduled" ||
      (data.published_at && !isNaN(Date.parse(data.published_at))),
    {
      message: "Scheduled posts need a valid publish date",
      path: ["published_at"],
    }
  );

export const tagSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9؀-ۿ-]+$/, "Invalid slug"),
  name_fa: z.string().trim().min(1).max(80),
  name_en: z.string().trim().min(1).max(80),
});

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(6).max(100),
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().max(200),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(5000),
});

export type PostInput = z.infer<typeof postSchema>;
export type TagInput = z.infer<typeof tagSchema>;
