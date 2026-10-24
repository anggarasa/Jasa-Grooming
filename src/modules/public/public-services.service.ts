import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/utils";
import { Prisma } from "@prisma/client";

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  serviceCount: number;
}

export interface PublicServiceItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  fullDescription: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  formattedPrice: string;
  imageObjectKey: string | null;
  displayOrder: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicServiceDetail extends PublicServiceItem {
  relatedServices: PublicServiceItem[];
}

export interface GetPublicServicesOptions {
  categorySlug?: string;
  search?: string;
}

interface RawServiceWithCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  fullDescription: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  price: Prisma.Decimal | number;
  imageObjectKey: string | null;
  displayOrder: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

function formatService(raw: RawServiceWithCategory): PublicServiceItem {
  const priceNum = Number(raw.price);
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    shortDescription: raw.shortDescription,
    fullDescription: raw.fullDescription,
    durationMinutes: raw.durationMinutes,
    bufferMinutes: raw.bufferMinutes,
    price: priceNum,
    formattedPrice: formatIDR(priceNum),
    imageObjectKey: raw.imageObjectKey,
    displayOrder: raw.displayOrder,
    category: {
      id: raw.category.id,
      name: raw.category.name,
      slug: raw.category.slug,
    },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/**
 * Mengambil seluruh kategori aktif yang memiliki bisnis aktif.
 */
export async function getPublicCategories(): Promise<PublicCategory[]> {
  const categories = await prisma.serviceCategory.findMany({
    where: {
      isActive: true,
      business: { isActive: true },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      displayOrder: true,
      _count: {
        select: {
          services: {
            where: { isActive: true },
          },
        },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    displayOrder: cat.displayOrder,
    serviceCount: cat._count.services,
  }));
}

/**
 * Mengambil daftar layanan aktif dengan filter kategori & pencarian kata kunci.
 */
export async function getPublicServices(
  options: GetPublicServicesOptions = {}
): Promise<PublicServiceItem[]> {
  const { categorySlug, search } = options;

  const whereClause: Prisma.ServiceWhereInput = {
    isActive: true,
    business: { isActive: true },
    category: {
      isActive: true,
      ...(categorySlug ? { slug: categorySlug } : {}),
    },
  };

  if (search && search.trim() !== "") {
    const q = search.trim();
    whereClause.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { shortDescription: { contains: q, mode: "insensitive" } },
      { fullDescription: { contains: q, mode: "insensitive" } },
    ];
  }

  const rawServices = await prisma.service.findMany({
    where: whereClause,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
  });

  return rawServices.map(formatService);
}

/**
 * Mengambil detail 1 layanan aktif berdasarkan slug, termasuk related services.
 */
export async function getPublicServiceBySlug(
  slug: string
): Promise<PublicServiceDetail | null> {
  if (!slug || slug.trim() === "") {
    return null;
  }

  const rawService = await prisma.service.findFirst({
    where: {
      slug: slug.trim(),
      isActive: true,
      business: { isActive: true },
      category: { isActive: true },
    },
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

  if (!rawService) {
    return null;
  }

  // Cari layanan sejenis dalam kategori yang sama (maksimal 3)
  const relatedRaw = await prisma.service.findMany({
    where: {
      id: { not: rawService.id },
      categoryId: rawService.categoryId,
      isActive: true,
      business: { isActive: true },
      category: { isActive: true },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
    take: 3,
  });

  return {
    ...formatService(rawService),
    relatedServices: relatedRaw.map(formatService),
  };
}

/**
 * Mengambil 1 layanan aktif berdasarkan ID untuk validasi query param di /booking?service={id}
 */
export async function getPublicServiceById(
  id: string
): Promise<PublicServiceItem | null> {
  if (!id || id.trim() === "") {
    return null;
  }

  const rawService = await prisma.service.findFirst({
    where: {
      id: id.trim(),
      isActive: true,
      business: { isActive: true },
      category: { isActive: true },
    },
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

  if (!rawService) {
    return null;
  }

  return formatService(rawService);
}
