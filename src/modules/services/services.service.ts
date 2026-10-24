import { Prisma } from "@prisma/client";
import { getPrimaryBusiness } from "@/modules/business/business.service";
import { slugify } from "@/modules/categories/categories.service";
import { findCategoryById } from "@/modules/categories/categories.repository";
import {
  findServices,
  findServiceById,
  findServiceBySlug,
  createService as repoCreateService,
  updateService as repoUpdateService,
  deleteService as repoDeleteService,
  countBookingsByServiceId,
  ServiceFilterOptions,
} from "./services.repository";
import { CreateServiceInput, UpdateServiceInput } from "./schemas";

export async function listServices(filters?: ServiceFilterOptions) {
  const business = await getPrimaryBusiness();
  return findServices(business.id, filters);
}

export async function getServiceById(id: string) {
  const business = await getPrimaryBusiness();
  const service = await findServiceById(id, business.id);
  if (!service) {
    throw new Error("Layanan grooming tidak ditemukan.");
  }
  return service;
}

export async function createService(input: CreateServiceInput) {
  const business = await getPrimaryBusiness();

  // Validasi kategori harus ada dan milik bisnis ini
  const category = await findCategoryById(input.categoryId, business.id);
  if (!category) {
    throw new Error("Kategori layanan yang dipilih tidak ditemukan.");
  }

  let slug = input.slug ? slugify(input.slug) : slugify(input.name);
  if (!slug) {
    slug = `layanan-${Date.now()}`;
  }

  // Cek duplikasi slug
  const existingSlug = await findServiceBySlug(business.id, slug);
  if (existingSlug) {
    throw new Error(`Slug layanan '${slug}' sudah digunakan.`);
  }

  return repoCreateService({
    businessId: business.id,
    categoryId: input.categoryId,
    name: input.name,
    slug,
    shortDescription: input.shortDescription || null,
    fullDescription: input.fullDescription || null,
    durationMinutes: input.durationMinutes,
    bufferMinutes: input.bufferMinutes ?? 15,
    price: new Prisma.Decimal(input.price),
    imageObjectKey: input.imageObjectKey || null,
    displayOrder: input.displayOrder ?? 0,
    isActive: input.isActive ?? true,
  });
}

export async function updateService(id: string, input: UpdateServiceInput) {
  const business = await getPrimaryBusiness();
  const existing = await findServiceById(id, business.id);
  if (!existing) {
    throw new Error("Layanan grooming tidak ditemukan.");
  }

  // Validasi kategori jika diubah
  if (input.categoryId && input.categoryId !== existing.categoryId) {
    const category = await findCategoryById(input.categoryId, business.id);
    if (!category) {
      throw new Error("Kategori layanan yang dipilih tidak ditemukan.");
    }
  }

  let finalSlug: string | undefined = undefined;
  if (input.slug !== undefined) {
    finalSlug = slugify(input.slug);
    if (finalSlug !== existing.slug) {
      const slugDuplicate = await findServiceBySlug(business.id, finalSlug);
      if (slugDuplicate && slugDuplicate.id !== id) {
        throw new Error(`Slug layanan '${finalSlug}' sudah digunakan.`);
      }
    }
  }

  return repoUpdateService(id, {
    ...(input.categoryId && { category: { connect: { id: input.categoryId } } }),
    ...(input.name !== undefined && { name: input.name }),
    ...(finalSlug !== undefined && { slug: finalSlug }),
    ...(input.shortDescription !== undefined && { shortDescription: input.shortDescription }),
    ...(input.fullDescription !== undefined && { fullDescription: input.fullDescription }),
    ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
    ...(input.bufferMinutes !== undefined && { bufferMinutes: input.bufferMinutes }),
    ...(input.price !== undefined && { price: new Prisma.Decimal(input.price) }),
    ...(input.imageObjectKey !== undefined && { imageObjectKey: input.imageObjectKey }),
    ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
  });
}

export async function deleteService(id: string, force = false) {
  const business = await getPrimaryBusiness();
  const existing = await findServiceById(id, business.id);
  if (!existing) {
    throw new Error("Layanan grooming tidak ditemukan.");
  }

  // Cek apakah ada booking historis atau aktif
  const bookingsCount = await countBookingsByServiceId(id);

  if (bookingsCount > 0 && !force) {
    // Soft deletion: nonaktifkan layanan agar integritas relasi booking terjaga
    const deactivated = await repoUpdateService(id, { isActive: false });
    return {
      success: true,
      deactivated: true,
      message: `Layanan '${existing.name}' dinonaktifkan (bukan dihapus permanen) karena memiliki ${bookingsCount} riwayat pemesanan.`,
      service: deactivated,
    };
  }

  // Jika tidak ada riwayat booking atau force = true
  await repoDeleteService(id);
  return {
    success: true,
    deactivated: false,
    message: `Layanan '${existing.name}' berhasil dihapus permanen.`,
  };
}
