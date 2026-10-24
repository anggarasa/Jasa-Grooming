import { revalidatePath } from "next/cache";

/**
 * Helper pembungkus aman untuk Next.js cache revalidation.
 * Menghindari throw invariant saat dieksekusi di runner testing (Vitest).
 */
export function safeRevalidatePath(originalPath: string, type?: "layout" | "page"): void {
  try {
    revalidatePath(originalPath, type);
  } catch {
    // Abaikan jika tidak berada di Next.js request context (mis. unit/integration test)
  }
}

/**
 * Invalidasi cache publik terkait profil bisnis & kontak
 */
export function revalidateBusinessCache(): void {
  safeRevalidatePath("/");
  safeRevalidatePath("/about");
  safeRevalidatePath("/contact");
  safeRevalidatePath("/services");
  safeRevalidatePath("/sitemap.xml");
}

/**
 * Invalidasi cache publik terkait jam operasional
 */
export function revalidateHoursCache(): void {
  safeRevalidatePath("/");
  safeRevalidatePath("/contact");
}

/**
 * Invalidasi cache publik terkait pengaturan booking
 */
export function revalidateBookingSettingsCache(): void {
  safeRevalidatePath("/booking");
  safeRevalidatePath("/services");
}

/**
 * Invalidasi cache publik terkait layanan & katalog
 */
export function revalidateServicesCache(slug?: string): void {
  safeRevalidatePath("/");
  safeRevalidatePath("/services");
  safeRevalidatePath("/sitemap.xml");
  if (slug) {
    safeRevalidatePath(`/services/${slug}`);
  }
}

/**
 * Invalidasi cache publik terkait kategori layanan
 */
export function revalidateCategoriesCache(): void {
  safeRevalidatePath("/");
  safeRevalidatePath("/services");
  safeRevalidatePath("/sitemap.xml");
}

/**
 * Invalidasi cache publik terkait foto galeri
 */
export function revalidateGalleryCache(): void {
  safeRevalidatePath("/");
  safeRevalidatePath("/gallery");
  safeRevalidatePath("/about");
}
