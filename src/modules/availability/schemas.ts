import { z } from "zod";

export const getAvailabilityQuerySchema = z.object({
  serviceId: z.string().min(1, "serviceId wajib diisi"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD (contoh: 2026-10-24)"),
});

export type GetAvailabilityQuery = z.infer<typeof getAvailabilityQuerySchema>;
