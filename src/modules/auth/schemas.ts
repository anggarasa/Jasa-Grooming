import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Kata sandi wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
    newPassword: z
      .string()
      .min(12, "Kata sandi baru minimal harus 12 karakter")
      .regex(/[A-Z]/, "Kata sandi baru harus mengandung minimal 1 huruf kapital")
      .regex(/[a-z]/, "Kata sandi baru harus mengandung minimal 1 huruf kecil")
      .regex(/[0-9]/, "Kata sandi baru harus mengandung minimal 1 angka")
      .regex(/[^A-Za-z0-9]/, "Kata sandi baru harus mengandung minimal 1 simbol / karakter khusus"),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok dengan kata sandi baru",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Kata sandi baru tidak boleh sama dengan kata sandi saat ini",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1, "ID sesi wajib diisi"),
});

export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal harus 2 karakter"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
