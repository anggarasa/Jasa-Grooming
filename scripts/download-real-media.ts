import fs from "fs";
import path from "path";

const IMAGES_TO_DOWNLOAD = [
  {
    dest: "public/images/hero/hero-pet.webp",
    url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80",
    description: "Hero Section Groomed Pet",
  },
  {
    dest: "public/media/business/logos/logo.webp",
    url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&auto=format&fit=crop&q=80",
    description: "Business Logo Image",
  },
  {
    dest: "public/media/services/images/cat-basic.webp",
    url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80",
    description: "Basic Cat Grooming",
  },
  {
    dest: "public/media/services/images/cat-spa.webp",
    url: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&auto=format&fit=crop&q=80",
    description: "Complete Cat Spa",
  },
  {
    dest: "public/media/services/images/dog-basic.webp",
    url: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&auto=format&fit=crop&q=80",
    description: "Basic Dog Grooming",
  },
  {
    dest: "public/media/services/images/dog-styling.webp",
    url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&auto=format&fit=crop&q=80",
    description: "Full Styling & Haircut Dog",
  },
  {
    dest: "public/media/services/images/treatment-parasite.webp",
    url: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&auto=format&fit=crop&q=80",
    description: "Treatment Anti Kutu & Jamur",
  },
  {
    dest: "public/media/gallery/images/salon-facility.webp",
    url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80",
    description: "Area Grooming Bersih Ber-AC",
  },
  {
    dest: "public/media/gallery/images/cat-persian-groom.webp",
    url: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&auto=format&fit=crop&q=80",
    description: "Kucing Persia Selesai Mandi Spa",
  },
  {
    dest: "public/media/gallery/images/dog-poodle-groom.webp",
    url: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=800&auto=format&fit=crop&q=80",
    description: "Poodle Cantik Haircut Rapi",
  },
  {
    dest: "public/media/gallery/images/dog-bath-fun.webp",
    url: "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=800&auto=format&fit=crop&q=80",
    description: "Anabul Ceria saat Mandi Busa",
  },
];

async function main() {
  console.log("📥 Mengunduh aset media asli (real pet images)...");

  for (const item of IMAGES_TO_DOWNLOAD) {
    const fullPath = path.join(process.cwd(), item.dest);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      const response = await fetch(item.url);
      if (!response.ok) {
        console.error(`❌ Gagal mengunduh ${item.dest}: HTTP ${response.status}`);
        continue;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(fullPath, buffer);
      console.log(`✓ [${buffer.length} bytes] ${item.description} -> ${item.dest}`);
    } catch (err) {
      console.error(`❌ Error saat mengambil ${item.url}:`, err);
    }
  }

  console.log("✨ Selesai mengunduh semua media asli.");
}

main().catch(console.error);
