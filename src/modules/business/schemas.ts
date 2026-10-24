import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const updateBusinessProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama bisnis minimal 2 karakter.")
    .max(100, "Nama bisnis maksimal 100 karakter."),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi maksimal 1000 karakter.")
    .nullable()
    .optional(),
  email: z
    .string()
    .trim()
    .email("Format email tidak valid.")
    .nullable()
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(20, "Nomor telepon maksimal 20 karakter.")
    .nullable()
    .optional(),
  whatsapp: z
    .string()
    .trim()
    .max(20, "Nomor WhatsApp maksimal 20 karakter.")
    .nullable()
    .optional(),
  address: z
    .string()
    .trim()
    .max(255, "Alamat singkat maksimal 255 karakter.")
    .nullable()
    .optional(),
  fullAddress: z
    .string()
    .trim()
    .max(500, "Alamat lengkap maksimal 500 karakter.")
    .nullable()
    .optional(),
  city: z
    .string()
    .trim()
    .max(100, "Kota/Kabupaten maksimal 100 karakter.")
    .nullable()
    .optional(),
  province: z
    .string()
    .trim()
    .max(100, "Provinsi maksimal 100 karakter.")
    .nullable()
    .optional(),
  postalCode: z
    .string()
    .trim()
    .max(10, "Kode pos maksimal 10 karakter.")
    .nullable()
    .optional(),
  googleMapsUrl: z
    .string()
    .trim()
    .url("URL Google Maps harus berupa tautan yang valid.")
    .nullable()
    .optional()
    .or(z.literal("")),
  timezone: z.string().trim().default("Asia/Jakarta"),
  logoObjectKey: z.string().trim().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>;

export const operatingBreakSchema = z.object({
  id: z.string().optional(),
  startTime: z
    .string()
    .regex(timeRegex, "Format waktu mulai istirahat harus HH:mm (contoh: 12:00)"),
  endTime: z
    .string()
    .regex(timeRegex, "Format waktu selesai istirahat harus HH:mm (contoh: 13:00)"),
});

export const operatingDaySchema = z
  .object({
    id: z.string().optional(),
    dayOfWeek: z
      .number()
      .int()
      .min(0, "Hari harus antara 0 (Minggu) dan 6 (Sabtu)")
      .max(6, "Hari harus antara 0 (Minggu) dan 6 (Sabtu)"),
    isOpen: z.boolean().default(true),
    openTime: z
      .string()
      .regex(timeRegex, "Format jam buka harus HH:mm (contoh: 09:00)")
      .default("09:00"),
    closeTime: z
      .string()
      .regex(timeRegex, "Format jam tutup harus HH:mm (contoh: 18:00)")
      .default("18:00"),
    breaks: z.array(operatingBreakSchema).default([]),
  })
  .superRefine((day, ctx) => {
    if (day.isOpen) {
      if (day.openTime >= day.closeTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Jam buka (${day.openTime}) harus lebih awal dari jam tutup (${day.closeTime}).`,
          path: ["closeTime"],
        });
      }

      // Validasi tiap break
      for (let i = 0; i < day.breaks.length; i++) {
        const b = day.breaks[i];
        if (b.startTime >= b.endTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Waktu mulai istirahat (${b.startTime}) harus lebih awal dari waktu selesai (${b.endTime}).`,
            path: ["breaks", i, "endTime"],
          });
        }
        if (b.startTime < day.openTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Waktu istirahat (${b.startTime}) tidak boleh sebelum jam buka (${day.openTime}).`,
            path: ["breaks", i, "startTime"],
          });
        }
        if (b.endTime > day.closeTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Waktu selesai istirahat (${b.endTime}) tidak boleh melebihi jam tutup (${day.closeTime}).`,
            path: ["breaks", i, "endTime"],
          });
        }

        // Cek overlap antar break
        for (let j = i + 1; j < day.breaks.length; j++) {
          const other = day.breaks[j];
          if (b.startTime < other.endTime && b.endTime > other.startTime) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Jadwal istirahat (${b.startTime}-${b.endTime}) bentrok dengan (${other.startTime}-${other.endTime}).`,
              path: ["breaks", j],
            });
          }
        }
      }
    }
  });

export const updateOperatingHoursSchema = z.object({
  hours: z
    .array(operatingDaySchema)
    .min(1, "Data jam operasional wajib dikirim.")
    .max(7, "Jam operasional maksimal 7 hari.")
    .refine((hours) => {
      const days = new Set(hours.map((h) => h.dayOfWeek));
      return days.size === hours.length;
    }, "Data jam operasional tidak boleh mengandung hari yang duplikat."),
});

export type UpdateOperatingHoursInput = z.infer<typeof updateOperatingHoursSchema>;

export const updateBookingSettingsSchema = z.object({
  bookingEnabled: z.boolean().optional(),
  currency: z.string().trim().default("IDR").optional(),
  bookingIntervalMinutes: z
    .number()
    .int()
    .min(10, "Interval booking minimal 10 menit.")
    .max(120, "Interval booking maksimal 120 menit.")
    .optional(),
  defaultBufferMinutes: z
    .number()
    .int()
    .min(0, "Buffer minutes minimal 0 menit.")
    .max(60, "Buffer minutes maksimal 60 menit.")
    .optional(),
  minimumAdvanceMinutes: z
    .number()
    .int()
    .min(0, "Minimum waktu pemesanan awal minimal 0 menit.")
    .max(10080, "Minimum waktu pemesanan awal maksimal 7 hari (10080 menit).")
    .optional(),
  maximumAdvanceDays: z
    .number()
    .int()
    .min(1, "Maksimum hari pemesanan ke depan minimal 1 hari.")
    .max(365, "Maksimum hari pemesanan ke depan maksimal 365 hari.")
    .optional(),
  cancellationWindowHours: z
    .number()
    .int()
    .min(0, "Batas pembatalan minimal 0 jam.")
    .max(168, "Batas pembatalan maksimal 7 hari (168 jam).")
    .optional(),
  autoConfirmBooking: z.boolean().optional(),
  allowCustomerReschedule: z.boolean().optional(),
});

export type UpdateBookingSettingsInput = z.infer<typeof updateBookingSettingsSchema>;
