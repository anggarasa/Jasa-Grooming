import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createServiceCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kategori minimal 2 karakter.")
    .max(100, "Nama kategori maksimal 100 karakter."),
  slug: z
    .string()
    .trim()
    .regex(slugRegex, "Format slug hanya boleh huruf kecil, angka, dan tanda hubung (-).")
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Deskripsi maksimal 500 karakter.")
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

export type CreateServiceCategoryInput = z.infer<typeof createServiceCategorySchema>;

export const updateServiceCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kategori minimal 2 karakter.")
    .max(100, "Nama kategori maksimal 100 karakter.")
    .optional(),
  slug: z
    .string()
    .trim()
    .regex(slugRegex, "Format slug hanya boleh huruf kecil, angka, dan tanda hubung (-).")
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Deskripsi maksimal 500 karakter.")
    .nullable()
    .optional(),
  displayOrder: z
    .number()
    .int()
    .min(0, "Urutan tampilan minimal 0.")
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateServiceCategoryInput = z.infer<typeof updateServiceCategorySchema>;
