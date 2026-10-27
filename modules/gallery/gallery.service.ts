import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import { deleteMediaAsset } from "@backend/modules/storage/media.service";
import {
  findGalleryItems,
  findGalleryItemById,
  createGalleryItem as repoCreateGalleryItem,
  updateGalleryItem as repoUpdateGalleryItem,
  deleteGalleryItem as repoDeleteGalleryItem,
} from "./gallery.repository";
import {
  CreateGalleryItemInput,
  UpdateGalleryItemInput,
} from "./schemas";

export async function listGallery(filters?: { isActive?: boolean }) {
  const business = await getPrimaryBusiness();
  return findGalleryItems(business.id, filters);
}

export async function getGalleryItemById(id: string) {
  const business = await getPrimaryBusiness();
  const item = await findGalleryItemById(id, business.id);
  if (!item) {
    throw new Error("Foto galeri tidak ditemukan.");
  }
  return item;
}

export async function createGalleryItem(input: CreateGalleryItemInput) {
  const business = await getPrimaryBusiness();

  return repoCreateGalleryItem({
    businessId: business.id,
    objectKey: input.objectKey,
    caption: input.caption || null,
    altText: input.altText || null,
    displayOrder: input.displayOrder ?? 0,
    isActive: input.isActive ?? true,
  });
}

export async function updateGalleryItem(
  id: string,
  input: UpdateGalleryItemInput
) {
  const business = await getPrimaryBusiness();
  const existing = await findGalleryItemById(id, business.id);
  if (!existing) {
    throw new Error("Foto galeri tidak ditemukan.");
  }

  return repoUpdateGalleryItem(id, {
    ...(input.caption !== undefined && { caption: input.caption }),
    ...(input.altText !== undefined && { altText: input.altText }),
    ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
  });
}

export async function deleteGalleryItem(id: string) {
  const business = await getPrimaryBusiness();
  const existing = await findGalleryItemById(id, business.id);
  if (!existing) {
    throw new Error("Foto galeri tidak ditemukan.");
  }

  // 1. Hapus dari database
  await repoDeleteGalleryItem(id);

  // 2. Hapus aset media terkait dari MinIO & MediaAsset jika ada
  if (existing.objectKey) {
    try {
      await deleteMediaAsset(existing.objectKey, business.id);
    } catch (err) {
      console.warn(`Gagal menghapus file media MinIO untuk galeri: ${existing.objectKey}`, err);
    }
  }

  return {
    success: true,
    message: "Foto galeri berhasil dihapus permanen.",
  };
}
