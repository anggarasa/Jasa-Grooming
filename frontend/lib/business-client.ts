import {
  UpdateBusinessProfileInput,
  UpdateOperatingHoursInput,
  UpdateBookingSettingsInput,
} from "@backend/modules/business/schemas";
import {
  CreateServiceCategoryInput,
  UpdateServiceCategoryInput,
} from "@backend/modules/categories/schemas";
import {
  CreateServiceInput,
  UpdateServiceInput,
} from "@backend/modules/services/schemas";
import {
  CreateGalleryItemInput,
  UpdateGalleryItemInput,
} from "@backend/modules/gallery/schemas";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface BusinessProfile {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  fullAddress?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  googleMapsUrl?: string | null;
  timezone: string;
  logoObjectKey?: string | null;
  status: "ACTIVE" | "INACTIVE";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OperatingBreak {
  id?: string;
  startTime: string;
  endTime: string;
}

export interface OperatingHour {
  id?: string;
  businessId?: string;
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breaks: OperatingBreak[];
}

export interface BookingSettings {
  id: string;
  businessId: string;
  bookingEnabled: boolean;
  currency: string;
  bookingIntervalMinutes: number;
  defaultBufferMinutes: number;
  minimumAdvanceMinutes: number;
  maximumAdvanceDays: number;
  cancellationWindowHours: number;
  autoConfirmBooking: boolean;
  allowCustomerReschedule: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    services: number;
  };
}

export interface GroomingService {
  id: string;
  businessId: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  price: number | string;
  durationMinutes: number;
  bufferMinutes: number;
  imageObjectKey?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  _count?: {
    bookings: number;
  };
}

export interface GalleryItem {
  id: string;
  businessId: string;
  objectKey: string;
  caption?: string | null;
  altText?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaUploadResult {
  id: string;
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  folder: string;
  url: string;
}

/**
 * Format angka ke format mata uang Rupiah Indonesia (Rp 150.000)
 */
export function formatRupiah(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "Rp 0";
  const num = typeof value === "string" ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Mendapatkan URL akses gambar yang valid dari MinIO objectKey atau URL
 */
export function getMediaUrl(keyOrUrl?: string | null): string {
  if (!keyOrUrl || typeof keyOrUrl !== "string") return "";
  if (
    keyOrUrl.startsWith("http://") ||
    keyOrUrl.startsWith("https://") ||
    keyOrUrl.startsWith("/api/")
  ) {
    return keyOrUrl;
  }
  return `/api/media/${encodeURIComponent(keyOrUrl)}`;
}

// ---------------------------------------------------------------------------
// Business Profile API
// ---------------------------------------------------------------------------
export async function fetchBusinessProfile(): Promise<ApiResponse<BusinessProfile>> {
  const res = await fetch("/api/business", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

export async function updateBusinessProfileApi(
  input: UpdateBusinessProfileInput
): Promise<ApiResponse<BusinessProfile>> {
  const res = await fetch("/api/business", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// Operating Hours API
// ---------------------------------------------------------------------------
export async function fetchOperatingHours(): Promise<ApiResponse<OperatingHour[]>> {
  const res = await fetch("/api/business/hours", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

export async function updateOperatingHoursApi(
  input: UpdateOperatingHoursInput
): Promise<ApiResponse<OperatingHour[]>> {
  const res = await fetch("/api/business/hours", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// Booking Settings API
// ---------------------------------------------------------------------------
export async function fetchBookingSettings(): Promise<ApiResponse<BookingSettings>> {
  const res = await fetch("/api/business/booking-settings", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

export async function updateBookingSettingsApi(
  input: UpdateBookingSettingsInput
): Promise<ApiResponse<BookingSettings>> {
  const res = await fetch("/api/business/booking-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// Service Categories API
// ---------------------------------------------------------------------------
export async function fetchServiceCategories(
  activeOnly?: boolean
): Promise<ApiResponse<ServiceCategory[]>> {
  const query = activeOnly ? "?activeOnly=true" : "";
  const res = await fetch(`/api/service-categories${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

export async function createServiceCategoryApi(
  input: CreateServiceCategoryInput
): Promise<ApiResponse<ServiceCategory>> {
  const res = await fetch("/api/service-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateServiceCategoryApi(
  id: string,
  input: UpdateServiceCategoryInput
): Promise<ApiResponse<ServiceCategory>> {
  const res = await fetch(`/api/service-categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteServiceCategoryApi(
  id: string,
  force = false
): Promise<ApiResponse<{ message: string; deactivated?: boolean; category?: ServiceCategory }>> {
  const query = force ? "?force=true" : "";
  const res = await fetch(
    `/api/service-categories/${encodeURIComponent(id)}${query}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );
  return res.json();
}

// ---------------------------------------------------------------------------
// Services API
// ---------------------------------------------------------------------------
export async function fetchServices(filters?: {
  categoryId?: string;
  activeOnly?: boolean;
  search?: string;
}): Promise<ApiResponse<GroomingService[]>> {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.set("categoryId", filters.categoryId);
  if (filters?.activeOnly) params.set("activeOnly", "true");
  if (filters?.search) params.set("search", filters.search);

  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`/api/services${qs}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

export async function fetchServiceById(
  id: string
): Promise<ApiResponse<GroomingService>> {
  const res = await fetch(`/api/services/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

export async function createServiceApi(
  input: CreateServiceInput
): Promise<ApiResponse<GroomingService>> {
  const res = await fetch("/api/services", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateServiceApi(
  id: string,
  input: UpdateServiceInput
): Promise<ApiResponse<GroomingService>> {
  const res = await fetch(`/api/services/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteServiceApi(
  id: string,
  force = false
): Promise<ApiResponse<{ message: string; deactivated?: boolean }>> {
  const query = force ? "?force=true" : "";
  const res = await fetch(`/api/services/${encodeURIComponent(id)}${query}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// Gallery API
// ---------------------------------------------------------------------------
export async function fetchGallery(
  activeOnly?: boolean
): Promise<ApiResponse<GalleryItem[]>> {
  const query = activeOnly ? "?activeOnly=true" : "";
  const res = await fetch(`/api/gallery${query}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

export async function createGalleryItemApi(
  input: CreateGalleryItemInput
): Promise<ApiResponse<GalleryItem>> {
  const res = await fetch("/api/gallery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateGalleryItemApi(
  id: string,
  input: UpdateGalleryItemInput
): Promise<ApiResponse<GalleryItem>> {
  const res = await fetch(`/api/gallery/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteGalleryItemApi(
  id: string
): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(`/api/gallery/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

// ---------------------------------------------------------------------------
// MinIO Media Upload API
// ---------------------------------------------------------------------------
export async function uploadMediaApi(
  file: File,
  folder: "business/logos" | "services/images" | "gallery/images"
): Promise<ApiResponse<MediaUploadResult>> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch("/api/media/upload", {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export async function deleteMediaApi(
  objectKey: string
): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(`/api/media/${encodeURIComponent(objectKey)}`, {
    method: "DELETE",
  });
  return res.json();
}
