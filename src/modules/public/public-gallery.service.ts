import { prisma } from "@/lib/prisma";

export interface PublicGalleryItem {
  id: string;
  objectKey: string;
  caption: string | null;
  altText: string | null;
  displayOrder: number;
  createdAt: Date;
}

/**
 * Mengambil foto galeri aktif untuk showcase di halaman utama atau galeri publik.
 */
export async function getPublicGallery(
  limit?: number
): Promise<PublicGalleryItem[]> {
  const items = await prisma.businessGallery.findMany({
    where: {
      isActive: true,
      business: { isActive: true },
    },
    select: {
      id: true,
      objectKey: true,
      caption: true,
      altText: true,
      displayOrder: true,
      createdAt: true,
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    ...(limit && limit > 0 ? { take: limit } : {}),
  });

  return items;
}
