import { z } from "zod";

export const createGalleryItemSchema = z.object({
  objectKey: z
    .string()
    .trim()
    .min(1, "Object key media wajib diisi."),
  caption: z
    .string()
    .trim()
    .max(255, "Keterangan foto maksimal 255 karakter.")
    .nullable()
    .optional(),
  altText: z
    .string()
    .trim()
    .max(255, "Teks alternatif maksimal 255 karakter.")
    .nullable()
    .optional(),
  displayOrder: z
    .number()
    .int()
    .min(0, "Urutan tampilan minimal 0.")
    .default(0)
    .optional(),
  isActive: z.boolean().default(true).optional(),
});

export type CreateGalleryItemInput = z.infer<typeof createGalleryItemSchema>;

export const updateGalleryItemSchema = z.object({
  caption: z
    .string()
    .trim()
    .max(255, "Keterangan foto maksimal 255 karakter.")
    .nullable()
    .optional(),
  altText: z
    .string()
    .trim()
    .max(255, "Teks alternatif maksimal 255 karakter.")
    .nullable()
    .optional(),
  displayOrder: z
    .number()
    .int()
    .min(0, "Urutan tampilan minimal 0.")
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateGalleryItemInput = z.infer<typeof updateGalleryItemSchema>;
