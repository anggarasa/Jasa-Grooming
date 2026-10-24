import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createServiceSchema = z.object({
  categoryId: z
    .string()
    .min(1, "Kategori layanan wajib dipilih."),
  name: z
    .string()
    .trim()
    .min(2, "Nama layanan minimal 2 karakter.")
    .max(100, "Nama layanan maksimal 100 karakter."),
  slug: z
    .string()
    .trim()
    .regex(slugRegex, "Format slug hanya boleh huruf kecil, angka, dan tanda hubung (-).")
    .optional(),
  shortDescription: z
    .string()
    .trim()
    .max(255, "Deskripsi singkat maksimal 255 karakter.")
    .nullable()
    .optional(),
  fullDescription: z
    .string()
    .trim()
    .max(3000, "Deskripsi lengkap maksimal 3000 karakter.")
    .nullable()
    .optional(),
  durationMinutes: z
    .number()
    .int()
    .min(5, "Durasi minimal 5 menit.")
    .max(480, "Durasi maksimal 480 menit (8 jam).")
    .default(60),
  bufferMinutes: z
    .number()
    .int()
    .min(0, "Buffer minutes minimal 0 menit.")
    .max(120, "Buffer minutes maksimal 120 menit.")
    .default(15)
    .optional(),
  price: z.coerce
    .number()
    .min(0, "Harga layanan tidak boleh negatif.")
    .max(100_000_000, "Harga layanan maksimal Rp 100.000.000."),
  imageObjectKey: z
    .string()
    .trim()
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

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = z.object({
  categoryId: z.string().min(1).optional(),
  name: z
    .string()
    .trim()
    .min(2, "Nama layanan minimal 2 karakter.")
    .max(100, "Nama layanan maksimal 100 karakter.")
    .optional(),
  slug: z
    .string()
    .trim()
    .regex(slugRegex, "Format slug hanya boleh huruf kecil, angka, dan tanda hubung (-).")
    .optional(),
  shortDescription: z
    .string()
    .trim()
    .max(255, "Deskripsi singkat maksimal 255 karakter.")
    .nullable()
    .optional(),
  fullDescription: z
    .string()
    .trim()
    .max(3000, "Deskripsi lengkap maksimal 3000 karakter.")
    .nullable()
    .optional(),
  durationMinutes: z
    .number()
    .int()
    .min(5, "Durasi minimal 5 menit.")
    .max(480, "Durasi maksimal 480 menit (8 jam).")
    .optional(),
  bufferMinutes: z
    .number()
    .int()
    .min(0, "Buffer minutes minimal 0 menit.")
    .max(120, "Buffer minutes maksimal 120 menit.")
    .optional(),
  price: z.coerce
    .number()
    .min(0, "Harga layanan tidak boleh negatif.")
    .max(100_000_000, "Harga layanan maksimal Rp 100.000.000.")
    .optional(),
  imageObjectKey: z
    .string()
    .trim()
    .nullable()
    .optional(),
  displayOrder: z
    .number()
    .int()
    .min(0, "Urutan tampilan minimal 0.")
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
