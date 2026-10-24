import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function findGalleryItems(
  businessId: string,
  options?: { isActive?: boolean }
) {
  const where: Prisma.BusinessGalleryWhereInput = { businessId };
  if (options?.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  return prisma.businessGallery.findMany({
    where,
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function findGalleryItemById(id: string, businessId?: string) {
  const where: Prisma.BusinessGalleryWhereInput = { id };
  if (businessId) {
    where.businessId = businessId;
  }

  return prisma.businessGallery.findFirst({
    where,
  });
}

export async function createGalleryItem(
  data: Prisma.BusinessGalleryUncheckedCreateInput
) {
  return prisma.businessGallery.create({
    data,
  });
}

export async function updateGalleryItem(
  id: string,
  data: Prisma.BusinessGalleryUpdateInput
) {
  return prisma.businessGallery.update({
    where: { id },
    data,
  });
}

export async function deleteGalleryItem(id: string) {
  return prisma.businessGallery.delete({
    where: { id },
  });
}
