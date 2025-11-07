import { z } from "zod";

export const postInputSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  date: z.string().regex(/\d{4}-\d{2}-\d{2}/),
  excerpt: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  icon: z.string().max(8).optional().nullable(),
  published: z.boolean().default(true),
});

export const packageInputSchema = z.object({
  name: z.string().min(2),
  price: z.number().int().nonnegative(),
  detail: z.string().optional().nullable(),
  icon: z.string().max(8).optional().nullable(),
  featured: z.boolean().optional().default(false),
  features: z.array(z.string().min(1)).optional().default([]),
});

export const settingsInputSchema = z.object({
  siteName: z.string().min(2),
  whatsappNumber: z.string().min(6).optional().or(z.literal("")).nullable(),
  whatsappMessage: z.string().optional().or(z.literal("")).nullable(),
  currency: z.string().min(1),
  navbarLogoUrl: z.string().trim().min(1).optional().or(z.literal("")).nullable(),
  faviconUrl: z.string().trim().min(1).optional().or(z.literal("")).nullable(),
});

export type PostInput = z.infer<typeof postInputSchema>;
export type PackageInput = z.infer<typeof packageInputSchema>;
export type SettingsInput = z.infer<typeof settingsInputSchema>;
