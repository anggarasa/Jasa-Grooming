import type { PublicGalleryItem } from "@backend/modules/public/public-gallery.service";

/**
 * Data tampilan Galeri.
 *
 * Tabel `business_galleries` TIDAK punya kolom kategori, dan keterangan/alt foto
 * stok bawaan seed tidak cocok dengan isi gambar (mis. "Ruangan salon bersih…"
 * untuk foto bulldog berkaus kuning). Skema dan data database tidak diubah;
 * kategori, alt, dan rasio gambar ditentukan di sini, di sisi tampilan:
 *
 *  1. Foto dari database tetap tampil dan tetap dikelola dari dashboard. Untuk
 *     empat foto stok bawaan seed (dikenali dari `objectKey`), kategori + alt
 *     yang benar menggantikan teks seed hanya di tampilan. Foto unggahan admin
 *     (kunci lain) memakai alt/keterangannya sendiri dan kategori "Momen Anabul".
 *  2. Foto pelengkap dari paket aset yang disetujui (lisensi Unsplash, sudah
 *     disalin ke public/images/photos) ditambahkan setelahnya. Setiap alt hanya
 *     menjelaskan isi gambar, tanpa klaim fasilitas/sertifikasi.
 *
 * Tidak ada foto suasana tempat atau fasilitas pada aset yang tersedia, jadi
 * tidak ada kategori untuk itu.
 */

export type GalleryCategoryId = "hasil" | "proses" | "momen";

export const GALLERY_CATEGORIES: { id: GalleryCategoryId; label: string }[] = [
  { id: "hasil", label: "Hasil Grooming" },
  { id: "proses", label: "Proses Perawatan" },
  { id: "momen", label: "Momen Anabul" },
];

export const GALLERY_CATEGORY_LABEL: Record<GalleryCategoryId, string> = {
  hasil: "Hasil Grooming",
  proses: "Proses Perawatan",
  momen: "Momen Anabul",
};

/** Bentuk yang dipahami lightbox (`src` menggantikan jalur /api/media bila ada). */
export interface GalleryDisplayItem extends PublicGalleryItem {
  src: string;
  /** Teks alternatif yang dipakai tampilan (sama dengan `altText`, tidak null). */
  alt: string;
  width: number;
  height: number;
  category: GalleryCategoryId;
}

/** Rasio bawaan untuk foto unggahan admin yang dimensinya tidak diketahui. */
const DEFAULT_DIMENSIONS = { width: 4, height: 3 };

const NOW = new Date(0);

interface Override {
  category: GalleryCategoryId;
  alt: string;
  caption: string | null;
  width: number;
  height: number;
}

/** Empat foto stok bawaan seed (dimensi diukur dari berkas di public/media). */
const SEEDED_DB_OVERRIDES: Record<string, Override> = {
  "gallery/images/salon-facility.webp": {
    category: "momen",
    alt: "Anjing bulldog Prancis berkaus kuning duduk di depan latar biru",
    caption: null,
    width: 800,
    height: 534,
  },
  "gallery/images/cat-persian-groom.webp": {
    category: "momen",
    alt: "Kucing bergaris duduk santai di atas sofa",
    caption: null,
    width: 800,
    height: 533,
  },
  "gallery/images/dog-poodle-groom.webp": {
    category: "momen",
    alt: "Anak anjing corgi duduk di depan latar oranye",
    caption: null,
    width: 800,
    height: 1207,
  },
  "gallery/images/dog-bath-fun.webp": {
    category: "momen",
    alt: "Anjing berkacamata berbaring di atas majalah terbuka",
    caption: null,
    width: 800,
    height: 600,
  },
};

interface StaticPhoto {
  file: string;
  width: number;
  height: number;
  category: GalleryCategoryId;
  alt: string;
  caption: string;
}

/** Foto pelengkap dari paket aset (urutan = urutan tampil setelah foto database). */
export const STATIC_GALLERY_PHOTOS: StaticPhoto[] = [
  { file: "p-1625279138876.jpg", width: 900, height: 600, category: "proses", alt: "Kucing berbulu putih-oranye digunting bulunya di dalam kotak kaca grooming", caption: "Grooming kucing" },
  { file: "p-1652342516868.jpg", width: 1400, height: 2100, category: "hasil", alt: "Potret anjing berbulu keriting krem dengan potongan bulu bulat yang rapi", caption: "Potongan bulat" },
  { file: "p-1597603413826.jpg", width: 900, height: 600, category: "proses", alt: "Anjing berbulu basah dengan tali ungu berdiri di bak mandi", caption: "Sesi mandi" },
  { file: "p-1678153188688.jpg", width: 900, height: 600, category: "hasil", alt: "Anjing berbulu krem berbandana hijau di depan latar hijau", caption: "Berbandana hijau" },
  { file: "p-1611173622933.jpg", width: 1400, height: 934, category: "proses", alt: "Anjing berbulu oranye berhanduk ungu di kepala sedang disisir", caption: "Disisir setelah mandi" },
  { file: "p-1583511655826.jpg", width: 900, height: 1347, category: "hasil", alt: "Anjing kecil berpiyama biru bergambar pisang di depan latar kuning", caption: "Berpiyama pisang" },
  { file: "p-1719464454959.jpg", width: 1400, height: 934, category: "proses", alt: "Anjing putih kecil digunting bulunya dengan gunting grooming", caption: "Menggunting bulu" },
  { file: "p-1574226215087.jpg", width: 900, height: 600, category: "momen", alt: "Kucing abu-abu bergaris rebahan santai di atas kasur putih", caption: "Kucing bersantai" },
  { file: "p-1597595735781.jpg", width: 900, height: 1350, category: "proses", alt: "Bulldog tampak senang di dalam bak berbusa saat dimandikan", caption: "Mandi busa" },
  { file: "p-1709771818873.jpg", width: 900, height: 1350, category: "hasil", alt: "Anjing berbandana bunga di depan latar merah muda", caption: "Berbandana bunga" },
  { file: "p-1625321150203.jpg", width: 900, height: 600, category: "proses", alt: "Anjing berbulu cokelat dikeringkan dengan hair dryer dan disisir sikat kayu", caption: "Mengeringkan bulu" },
  { file: "p-1616032776175.jpg", width: 900, height: 1125, category: "hasil", alt: "Potret anjing kecil berbulu cokelat keemasan di depan latar gelap", caption: "Potret anjing kecil" },
  { file: "p-1528846104175.jpg", width: 1400, height: 932, category: "proses", alt: "Seorang pria menyisir anjing putih kecil di atas meja grooming", caption: "Menyisir bulu" },
  { file: "p-1588269845464.jpg", width: 900, height: 1350, category: "hasil", alt: "Anjing berbulu panjang abu-cokelat duduk di depan latar kuning", caption: "Berbulu panjang" },
  { file: "p-1675430426271.jpg", width: 900, height: 600, category: "proses", alt: "Anjing kecil berbulu putih berselimut kotak-kotak sedang disisir dengan sikat merah muda", caption: "Menyikat bulu" },
  { file: "p-1625277743460.jpg", width: 900, height: 1286, category: "proses", alt: "Anjing berbulu keriting abu-abu berdiri di meja grooming sambil ditata bulunya", caption: "Di meja grooming" },
  { file: "p-1625321171045.jpg", width: 900, height: 600, category: "proses", alt: "Anjing berbulu cokelat dikeringkan dengan hair dryer di pangkuan perawatnya", caption: "Mengeringkan bulu" },
  { file: "p-1581887936036.jpg", width: 1400, height: 1760, category: "proses", alt: "Anjing cokelat di bilik mandi sambil dibantu dengan sarung tangan handuk", caption: "Di bilik mandi" },
];

/**
 * Menyusun daftar tampilan: foto database dulu (dikelola admin), lalu foto
 * pelengkap. Murni (tanpa efek samping) sehingga mudah diuji.
 */
export function buildGalleryItems(dbItems: PublicGalleryItem[]): GalleryDisplayItem[] {
  const fromDb: GalleryDisplayItem[] = dbItems.map((item, index) => {
    const override = SEEDED_DB_OVERRIDES[item.objectKey];
    if (override) {
      return {
        ...item,
        src: `/api/media/${item.objectKey}`,
        alt: override.alt,
        altText: override.alt,
        caption: override.caption,
        width: override.width,
        height: override.height,
        category: override.category,
      };
    }
    const alt = item.altText || item.caption || `Foto galeri PawCare ${index + 1}`;
    return {
      ...item,
      src: `/api/media/${item.objectKey}`,
      alt,
      width: DEFAULT_DIMENSIONS.width,
      height: DEFAULT_DIMENSIONS.height,
      category: "momen",
    };
  });

  const baseOrder = dbItems.reduce((max, i) => Math.max(max, i.displayOrder), 0);
  const extras: GalleryDisplayItem[] = STATIC_GALLERY_PHOTOS.map((photo, index) => ({
    id: `static-${photo.file}`,
    objectKey: "",
    caption: photo.caption,
    altText: photo.alt,
    displayOrder: baseOrder + index + 1,
    createdAt: NOW,
    src: `/images/photos/${photo.file}`,
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
    category: photo.category,
  }));

  return [...fromDb, ...extras];
}

/** Kategori yang benar-benar punya foto (urutan tetap), lengkap dengan jumlahnya. */
export function availableCategories(items: GalleryDisplayItem[]) {
  return GALLERY_CATEGORIES.map((cat) => ({
    ...cat,
    count: items.filter((i) => i.category === cat.id).length,
  })).filter((cat) => cat.count > 0);
}

/**
 * Memilih cuplikan foto untuk halaman lain (mis. Tentang Kami): hanya foto
 * LANDSCAPE (agar kartu 4:3 tidak memotong wajah), bergiliran antar kategori
 * supaya bervariasi, dengan urutan asli dipertahankan di tiap kategori.
 */
export function pickShowcase(items: GalleryDisplayItem[], count: number): GalleryDisplayItem[] {
  const landscape = items.filter((i) => i.width >= i.height * 1.2);
  const queues = GALLERY_CATEGORIES.map((cat) =>
    landscape.filter((i) => i.category === cat.id)
  );
  const picked: GalleryDisplayItem[] = [];
  let round = 0;
  while (picked.length < count && queues.some((q) => q.length > round)) {
    for (const q of queues) {
      if (q[round] && picked.length < count) picked.push(q[round]);
    }
    round++;
  }
  return picked;
}
