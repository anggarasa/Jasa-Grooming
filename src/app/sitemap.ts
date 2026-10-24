import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Rute publik statis
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/booking`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    // Ambil seluruh slug layanan aktif di bawah kategori & bisnis aktif
    const activeServices = await prisma.service.findMany({
      where: {
        isActive: true,
        category: {
          isActive: true,
        },
        business: {
          isActive: true,
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    const dynamicServiceRoutes: MetadataRoute.Sitemap = activeServices.map(
      (service) => ({
        url: `${baseUrl}/services/${encodeURIComponent(service.slug)}`,
        lastModified: service.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    );

    return [...staticRoutes, ...dynamicServiceRoutes];
  } catch (error) {
    console.error("Gagal menyusun daftar sitemap dinamis:", error);
    return staticRoutes;
  }
}
