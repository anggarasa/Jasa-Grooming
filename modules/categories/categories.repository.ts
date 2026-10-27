import { prisma } from "@backend/lib/prisma";
import { Prisma } from "@prisma/client";

export async function findCategories(
  businessId: string,
  options?: { isActive?: boolean }
) {
  const where: Prisma.ServiceCategoryWhereInput = { businessId };
  if (options?.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  return prisma.serviceCategory.findMany({
    where,
    include: {
      _count: {
        select: { services: true },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function findCategoryById(id: string, businessId?: string) {
  const where: Prisma.ServiceCategoryWhereInput = { id };
  if (businessId) {
    where.businessId = businessId;
  }

  return prisma.serviceCategory.findFirst({
    where,
    include: {
      services: {
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
      _count: {
        select: { services: true },
      },
    },
  });
}

export async function findCategoryBySlug(businessId: string, slug: string) {
  return prisma.serviceCategory.findUnique({
    where: {
      businessId_slug: {
        businessId,
        slug,
      },
    },
  });
}

export async function createCategory(
  data: Prisma.ServiceCategoryUncheckedCreateInput
) {
  return prisma.serviceCategory.create({
    data,
    include: {
      _count: {
        select: { services: true },
      },
    },
  });
}

export async function updateCategory(
  id: string,
  data: Prisma.ServiceCategoryUpdateInput
) {
  return prisma.serviceCategory.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { services: true },
      },
    },
  });
}

export async function deleteCategory(id: string) {
  return prisma.serviceCategory.delete({
    where: { id },
  });
}
