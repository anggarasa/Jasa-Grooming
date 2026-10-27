/**
 * Foto pengganti SEMENTARA untuk kartu layanan di Beranda (keputusan A-04,
 * docs/redesign/asset-mapping.md §0.1).
 *
 * Foto yang tampil di referensi tidak tersedia, jadi lima foto dari paket aset
 * dipakai sebagai pengganti. Pengganti HANYA berlaku bila `imageObjectKey`
 * layanan masih sama dengan foto stok bawaan seed. Bila admin sudah mengunggah
 * foto sendiri (kunci berbeda), foto admin tetap dipakai: fitur foto layanan di
 * dashboard tidak dikalahkan, dan data di database tidak diubah.
 *
 * Kunci peta = `imageObjectKey` bawaan seed. Posisi crop = usulan
 * (object-position) dan diverifikasi saat QA visual.
 */
export interface HomeServicePhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Nilai CSS object-position untuk kartu 5:6. */
  objectPosition: string;
  /** Nilai CSS object-position untuk foto lebar 4:3 di halaman detail. */
  detailObjectPosition: string;
}

const SEEDED_STOCK_PHOTOS: Record<string, HomeServicePhoto> = {
  "services/images/cat-basic.webp": {
    src: "/images/photos/p-1625279138876.jpg",
    alt: "Kucing berbulu putih-oranye digunting bulunya di dalam kotak kaca grooming",
    width: 900,
    height: 600,
    objectPosition: "30% 50%",
    detailObjectPosition: "35% 50%",
  },
  "services/images/cat-spa.webp": {
    src: "/images/photos/p-1574226215087.jpg",
    alt: "Kucing abu-abu bergaris rebahan santai di atas kasur putih",
    width: 900,
    height: 600,
    objectPosition: "8% 50%",
    detailObjectPosition: "20% 50%",
  },
  "services/images/dog-basic.webp": {
    src: "/images/photos/p-1675430426271.jpg",
    alt: "Anjing kecil berbulu putih berselimut kotak-kotak sedang disisir dengan sikat merah muda",
    width: 900,
    height: 600,
    objectPosition: "70% 50%",
    detailObjectPosition: "65% 50%",
  },
  "services/images/dog-styling.webp": {
    src: "/images/photos/p-1652342516868.jpg",
    alt: "Potret anjing berbulu keriting krem dengan potongan bulu bulat yang rapi",
    width: 1400,
    height: 2100,
    objectPosition: "50% 40%",
    detailObjectPosition: "50% 42%",
  },
  "services/images/treatment-parasite.webp": {
    src: "/images/photos/p-1581887936036.jpg",
    alt: "Anjing cokelat di bilik mandi sambil dibantu dengan sarung tangan handuk",
    width: 1400,
    height: 1760,
    objectPosition: "50% 35%",
    detailObjectPosition: "50% 28%",
  },
};

export interface ResolvedServicePhoto {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
  objectPosition: string;
  detailObjectPosition: string;
}

/**
 * Menentukan foto kartu layanan. Mengembalikan null bila layanan tidak punya
 * foto sama sekali (kartu memakai latar polos).
 */
export function resolveServicePhoto(
  imageObjectKey: string | null,
  serviceName: string
): ResolvedServicePhoto | null {
  if (!imageObjectKey) return null;

  const replacement = SEEDED_STOCK_PHOTOS[imageObjectKey];
  if (replacement) return { ...replacement };

  return {
    src: `/api/media/${imageObjectKey}`,
    alt: `Foto layanan ${serviceName}`,
    width: null,
    height: null,
    objectPosition: "50% 40%",
    detailObjectPosition: "50% 50%",
  };
}
