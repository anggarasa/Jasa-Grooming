import { z } from "zod";
import { BookingStatus } from "@prisma/client";

export const adminBookingStatusEnum = z.nativeEnum(BookingStatus);

export const adminListBookingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  status: adminBookingStatusEnum.optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional(),
  serviceId: z.string().trim().optional(),
  resourceId: z.string().trim().optional(),
  sortBy: z.enum(["startAt", "createdAt", "totalPrice"]).default("startAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type AdminListBookingsQuery = z.infer<typeof adminListBookingsQuerySchema>;

export const updateBookingStatusSchema = z.object({
  status: adminBookingStatusEnum,
  reason: z.string().trim().max(500).optional(),
  internalNotes: z.string().trim().max(1000).optional(),
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;

export const updateBookingNotesSchema = z.object({
  internalNotes: z.string().trim().max(2000),
});

export type UpdateBookingNotesInput = z.infer<typeof updateBookingNotesSchema>;

export const rescheduleBookingSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format waktu harus HH:mm (contoh: 09:30)"),
  reason: z.string().trim().min(3, "Alasan reschedule minimal 3 karakter").max(500),
});

export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;

export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(3, "Alasan pembatalan minimal 3 karakter").max(500),
});

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export const adminWalkInSchema = z.object({
  serviceId: z.string().min(1, "serviceId wajib diisi"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format waktu harus HH:mm"),
  customer: z.object({
    name: z.string().trim().min(2, "Nama pelanggan minimal 2 karakter").max(100),
    phone: z.string().trim().min(8, "Nomor telepon minimal 8 digit").max(20),
    email: z.string().trim().email("Format email tidak valid").optional().or(z.literal("")),
  }),
  pet: z.object({
    name: z.string().trim().min(1, "Nama anabul wajib diisi").max(50),
    type: z.string().trim().min(1, "Jenis anabul wajib diisi").max(50),
    breed: z.string().trim().max(50).optional().or(z.literal("")),
    age: z.coerce.number().int().min(0).max(30).optional(),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  }),
  internalNotes: z.string().trim().max(1000).optional(),
  customerNotes: z.string().trim().max(1000).optional(),
  autoConfirm: z.boolean().default(true),
  source: z.enum(["WALK_IN", "ADMIN"]).default("WALK_IN"),
});

export type AdminWalkInInput = z.infer<typeof adminWalkInSchema>;

export const createResourceBlockSchema = z.object({
  resourceId: z.string().min(1, "resourceId wajib diisi"),
  startAt: z.string().datetime({ message: "startAt harus berupa ISO 8601 UTC string" }),
  endAt: z.string().datetime({ message: "endAt harus berupa ISO 8601 UTC string" }),
  reason: z.string().trim().min(3, "Alasan pemblokiran waktu minimal 3 karakter").max(500),
}).refine(
  (data) => new Date(data.startAt) < new Date(data.endAt),
  {
    message: "Waktu mulai harus sebelum waktu selesai",
    path: ["endAt"],
  }
);

export type CreateResourceBlockInput = z.infer<typeof createResourceBlockSchema>;

export const calendarRangeQuerySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format start harus YYYY-MM-DD"),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format end harus YYYY-MM-DD"),
  resourceId: z.string().trim().optional(),
});

export type CalendarRangeQuery = z.infer<typeof calendarRangeQuerySchema>;

export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
