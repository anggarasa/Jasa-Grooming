import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Nama pelanggan minimal 2 karakter").max(100, "Nama terlalu panjang"),
  phone: z
    .string()
    .trim()
    .min(8, "Nomor telepon minimal 8 digit")
    .max(20, "Nomor telepon maksimal 20 digit")
    .regex(/^[0-9+() -]+$/, "Format nomor telepon tidak valid"),
  email: z.string().trim().email("Format email tidak valid").optional().or(z.literal("")),
});

export const petSchema = z.object({
  name: z.string().trim().min(1, "Nama anabul wajib diisi").max(50, "Nama anabul maksimal 50 karakter"),
  type: z.string().trim().min(1, "Jenis anabul wajib diisi").max(30, "Jenis anabul maksimal 30 karakter"),
  breed: z.string().trim().max(50, "Ras anabul maksimal 50 karakter").optional().or(z.literal("")),
  age: z.coerce.number().int().min(0, "Usia anabul minimal 0 tahun").max(35, "Usia anabul maksimal 35 tahun").optional(),
  notes: z.string().trim().max(500, "Catatan anabul maksimal 500 karakter").optional().or(z.literal("")),
});

export const createBookingSchema = z.object({
  serviceId: z.string().trim().min(1, "Layanan wajib dipilih"),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  time: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam harus HH:mm"),
  customer: customerSchema,
  pet: petSchema,
  notes: z.string().trim().max(500, "Catatan reservasi maksimal 500 karakter").optional().or(z.literal("")),
  customerNotes: z.string().trim().max(500, "Catatan reservasi maksimal 500 karakter").optional().or(z.literal("")),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
