import { getPrimaryBusiness } from "@backend/modules/business/business.service";
import {
  findCategories,
  findCategoryById,
  findCategoryBySlug,
  createCategory as repoCreateCategory,
  updateCategory as repoUpdateCategory,
  deleteCategory as repoDeleteCategory,
} from "./categories.repository";
import {
  CreateServiceCategoryInput,
  UpdateServiceCategoryInput,
} from "./schemas";

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export async function listCategories(filters?: { isActive?: boolean }) {
  const business = await getPrimaryBusiness();
  return findCategories(business.id, filters);
}

export async function getCategoryById(id: string) {
  const business = await getPrimaryBusiness();
  const category = await findCategoryById(id, business.id);
  if (!category) {
    throw new Error("Kategori layanan tidak ditemukan.");
  }
  return category;
}

export async function createCategory(input: CreateServiceCategoryInput) {
  const business = await getPrimaryBusiness();

  let slug = input.slug ? slugify(input.slug) : slugify(input.name);
  if (!slug) {
    slug = `kategori-${Date.now()}`;
  }

  // Cek duplikasi slug di dalam bisnis yang sama
  const existing = await findCategoryBySlug(business.id, slug);
  if (existing) {
    throw new Error(`Slug kategori '${slug}' sudah digunakan.`);
  }

  return repoCreateCategory({
    businessId: business.id,
    name: input.name,
    slug,
    description: input.description || null,
    displayOrder: input.displayOrder ?? 0,
    isActive: input.isActive ?? true,
  });
}

export async function updateCategory(
  id: string,
  input: UpdateServiceCategoryInput
) {
  const business = await getPrimaryBusiness();
  const existing = await findCategoryById(id, business.id);
  if (!existing) {
    throw new Error("Kategori layanan tidak ditemukan.");
  }

  let finalSlug: string | undefined = undefined;
  if (input.slug !== undefined) {
    finalSlug = slugify(input.slug);
    if (finalSlug !== existing.slug) {
      const slugDuplicate = await findCategoryBySlug(business.id, finalSlug);
      if (slugDuplicate && slugDuplicate.id !== id) {
        throw new Error(`Slug kategori '${finalSlug}' sudah digunakan.`);
      }
    }
  }

  return repoUpdateCategory(id, {
    ...(input.name !== undefined && { name: input.name }),
    ...(finalSlug !== undefined && { slug: finalSlug }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
  });
}

export async function deleteCategory(id: string, force = false) {
  const business = await getPrimaryBusiness();
  const existing = await findCategoryById(id, business.id);
  if (!existing) {
    throw new Error("Kategori layanan tidak ditemukan.");
  }

  const servicesCount = existing._count.services;

  // Jika masih memiliki relasi layanan
  if (servicesCount > 0 && !force) {
    // Safe deactivation
    const updated = await repoUpdateCategory(id, { isActive: false });
    return {
      success: true,
      deactivated: true,
      message: `Kategori '${existing.name}' dinonaktifkan (bukan dihapus) karena masih memiliki ${servicesCount} layanan terkait.`,
      category: updated,
    };
  }

  // Jika tidak memiliki layanan atau force=true
  await repoDeleteCategory(id);
  return {
    success: true,
    deactivated: false,
    message: `Kategori '${existing.name}' berhasil dihapus.`,
  };
}
