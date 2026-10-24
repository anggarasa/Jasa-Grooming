export interface ServicePreviewItem {
  id: string;
  name: string;
  category: "Anjing & Kucing" | "Anjing" | "Kucing";
  slug: string;
  durationMinutes: number;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export const siteConfig = {
  name: "PawCare Grooming",
  legalName: "PT PawCare Solusi Mandiri",
  tagline: "Perawatan Terbaik untuk Sahabat Berbulu Anda",
  description:
    "Layanan pet grooming profesional, higienis, dan terpercaya dengan groomer tersertifikasi untuk anjing dan kucing kesayangan Anda di Jakarta.",
  phone: "+62 812-3456-7890",
  email: "halo@pawcare.id",
  address: "Jl. Senopati Raya No. 42, Kebayoran Baru, Jakarta Selatan 12190",
  operationalHours: "Senin – Minggu: 09:00 – 19:00 WIB",
  navItems: [
    { label: "Beranda", href: "#" },
    { label: "Layanan", href: "#layanan" },
    { label: "Keunggulan", href: "#keunggulan" },
    { label: "Status Sistem", href: "#status" },
    { label: "Kontak", href: "#kontak" },
  ],
  services: [
    {
      id: "basic-bath",
      name: "Basic Bath",
      category: "Anjing & Kucing",
      slug: "basic-bath",
      durationMinutes: 45,
      price: 65000,
      description:
        "Mandi bersih dengan sampo antiseptik lembut, pembersihan telinga, dan gunting kuku standar.",
      features: [
        "Mandi sampo hypoallergenic",
        "Pembersihan telinga & lipatan",
        "Potong & kikir kuku standar",
        "Pengeringan berkecepatan rendah (bebas cemas)",
      ],
      popular: false,
    },
    {
      id: "full-grooming",
      name: "Full Grooming",
      category: "Anjing & Kucing",
      slug: "full-grooming",
      durationMinutes: 90,
      price: 120000,
      description:
        "Paket komplit untuk penampilan segar, pembersihan mendalam, potong bulu rapi, dan aroma tahan lama.",
      features: [
        "Semua fitur Basic Bath",
        "Cukur bulu higienis & trimming telapak",
        "Styling bulu wajah & tubuh sesuai ras",
        "Sikat gigi & semprotan pewangi aromaterapi",
      ],
      popular: true,
    },
    {
      id: "premium-spa",
      name: "Premium Spa",
      category: "Anjing & Kucing",
      slug: "premium-spa",
      durationMinutes: 120,
      price: 185000,
      description:
        "Perawatan mewah relaksasi total dengan ozone microbubble bath dan masker bulu kaya nutrisi.",
      features: [
        "Semua manfaat Full Grooming",
        "Microbubble Ozone Bath detox kulit",
        "Deep conditioning hair mask alami",
        "Pijat relaksasi otot & perawatan cakar paw balm",
      ],
      popular: false,
    },
  ] satisfies ServicePreviewItem[],
  features: [
    {
      title: "Fasilitas Higienis & Steril",
      description:
        "Alat grooming disterilkan dengan sinar UV medis setiap pergantian pasien. Ruangan ber-AC terpisah tanpa risiko kontaminasi.",
      icon: "ShieldCheck",
    },
    {
      title: "Groomer Tersertifikasi",
      description:
        "Tim groomer profesional yang terlatih menangani berbagai temperamen hewan dengan pendekatan santai penuh kesabaran.",
      icon: "Award",
    },
    {
      title: "Produk Aman & Ramah Alergi",
      description:
        "Hanya menggunakan sampo organik, bebas paraben, dan pH seimbang yang aman bahkan untuk anabul berkulit sensitif.",
      icon: "Sparkles",
    },
    {
      title: "Konfirmasi & Antrean Instan",
      description:
        "Sistem penjadwalan modular terintegrasi real-time. Slot waktu teratur tanpa membuat Anda dan peliharaan menunggu lama.",
      icon: "Clock",
    },
  ],
};
