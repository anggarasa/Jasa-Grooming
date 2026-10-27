import { prisma } from "@backend/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ServiceFilterOptions {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
}

export async function findServices(
  businessId: string,
  filters?: ServiceFilterOptions
) {
  const where: Prisma.ServiceWhereInput = { businessId };

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { shortDescription: { contains: filters.search, mode: "insensitive" } },
      { fullDescription: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.service.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function findServiceById(id: string, businessId?: string) {
  const where: Prisma.ServiceWhereInput = { id };
  if (businessId) {
    where.businessId = businessId;
  }

  return prisma.service.findFirst({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: { bookings: true },
      },
    },
  });
}

export async function findServiceBySlug(businessId: string, slug: string) {
  return prisma.service.findUnique({
    where: {
      businessId_slug: {
        businessId,
        slug,
      },
    },
  });
}

export async function createService(
  data: Prisma.ServiceUncheckedCreateInput
) {
  return prisma.service.create({
    data,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function updateService(
  id: string,
  data: Prisma.ServiceUpdateInput
) {
  return prisma.service.update({
    where: { id },
    data,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function deleteService(id: string) {
  return prisma.service.delete({
    where: { id },
  });
}

export async function countBookingsByServiceId(serviceId: string) {
  return prisma.booking.count({
    where: { serviceId },
  });
}
