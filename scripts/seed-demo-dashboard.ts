/**
 * Seeder DATA CONTOH untuk dashboard backoffice.
 *
 * Tujuan: mengisi dashboard dengan reservasi contoh supaya kartu KPI, tabel
 * "Jadwal Janji Temu Hari Ini", Kalender, dan Pelanggan tidak kosong.
 *
 * ATURAN KESELAMATAN (penting):
 *  - Skrip ini HANYA MENAMBAH baris. Tidak pernah menghapus/mengubah data yang
 *    sudah ada, tidak melakukan reset, dan tidak menyentuh tabel pengguna/sesi.
 *  - Semua baris buatannya diberi penanda agar mudah dikenali & dicabut kembali:
 *      · kode booking berawalan `BK-DEMO-`
 *      · email pelanggan berakhiran `@demo.pawcare.id`
 *  - `--undo` menghapus HANYA baris bertanda tersebut, bukan yang lain.
 *
 * Pemakaian:
 *   npx tsx scripts/seed-demo-dashboard.ts --dry    (lihat rencana, tanpa menulis)
 *   npx tsx scripts/seed-demo-dashboard.ts          (tulis data contoh)
 *   npx tsx scripts/seed-demo-dashboard.ts --undo   (cabut kembali data contoh)
 */
import { readFileSync } from "node:fs";
import { PrismaClient, type BookingStatus } from "@prisma/client";

/** Muat variabel lingkungan dari .env.local / .env tanpa dependensi tambahan. */
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      /* berkas tidak ada — abaikan */
    }
  }
}

const DEMO_CODE_PREFIX = "BK-DEMO-";
const DEMO_EMAIL_SUFFIX = "@demo.pawcare.id";

/** Jadwal contoh: jam WIB, status, dan berapa hari dari hari ini. */
const PLAN: {
  dayOffset: number;
  hourWib: number;
  minute: number;
  status: BookingStatus;
  source: string;
  customer: string;
  phone: string;
  pet: string;
  petType: string;
  breed: string;
  age: number;
  notes?: string;
}[] = [
  { dayOffset: 0, hourWib: 9, minute: 0, status: "COMPLETED", source: "WALK_IN", customer: "Sarah Wijaya", phone: "081234110001", pet: "Mochi", petType: "Kucing", breed: "Persia", age: 3 },
  { dayOffset: 0, hourWib: 10, minute: 0, status: "COMPLETED", source: "PUBLIC_GUEST", customer: "Dimas Prasetyo", phone: "081234110002", pet: "Bruno", petType: "Anjing", breed: "Golden Retriever", age: 4 },
  { dayOffset: 0, hourWib: 11, minute: 30, status: "IN_PROGRESS", source: "PUBLIC_GUEST", customer: "Ratna Kusuma", phone: "081234110003", pet: "Luna", petType: "Kucing", breed: "Anggora", age: 2, notes: "Kulit sensitif, hindari sampo beraroma kuat." },
  { dayOffset: 0, hourWib: 13, minute: 0, status: "CHECKED_IN", source: "WALK_IN", customer: "Bagus Santoso", phone: "081234110004", pet: "Coco", petType: "Anjing", breed: "Shih Tzu", age: 5 },
  { dayOffset: 0, hourWib: 14, minute: 30, status: "CONFIRMED", source: "PUBLIC_GUEST", customer: "Intan Permata", phone: "081234110005", pet: "Miko", petType: "Kucing", breed: "Maine Coon", age: 1 },
  { dayOffset: 0, hourWib: 16, minute: 0, status: "CONFIRMED", source: "PUBLIC_GUEST", customer: "Fajar Nugroho", phone: "081234110006", pet: "Simba", petType: "Kucing", breed: "Domestik", age: 2 },
  { dayOffset: 0, hourWib: 17, minute: 0, status: "PENDING", source: "PUBLIC_GUEST", customer: "Yuni Astuti", phone: "081234110007", pet: "Kiko", petType: "Anjing", breed: "Pomeranian", age: 3 },
  { dayOffset: 1, hourWib: 9, minute: 30, status: "CONFIRMED", source: "PUBLIC_GUEST", customer: "Andi Saputra", phone: "081234110008", pet: "Rocky", petType: "Anjing", breed: "Beagle", age: 6 },
  { dayOffset: 1, hourWib: 11, minute: 0, status: "CONFIRMED", source: "PUBLIC_GUEST", customer: "Nadia Rahma", phone: "081234110009", pet: "Snowy", petType: "Kucing", breed: "Ragdoll", age: 2 },
  { dayOffset: 2, hourWib: 10, minute: 0, status: "PENDING", source: "PUBLIC_GUEST", customer: "Hendra Gunawan", phone: "081234110010", pet: "Bella", petType: "Anjing", breed: "Corgi", age: 1 },
  { dayOffset: 3, hourWib: 15, minute: 0, status: "CONFIRMED", source: "PUBLIC_GUEST", customer: "Melati Sari", phone: "081234110011", pet: "Oreo", petType: "Kucing", breed: "British Shorthair", age: 4 },
  { dayOffset: -1, hourWib: 10, minute: 0, status: "COMPLETED", source: "PUBLIC_GUEST", customer: "Rizky Maulana", phone: "081234110012", pet: "Chiko", petType: "Anjing", breed: "Mini Pom", age: 2 },
  { dayOffset: -1, hourWib: 13, minute: 30, status: "NO_SHOW", source: "PUBLIC_GUEST", customer: "Putri Amelia", phone: "081234110013", pet: "Momo", petType: "Kucing", breed: "Domestik", age: 3 },
  { dayOffset: -2, hourWib: 11, minute: 0, status: "CANCELLED", source: "PUBLIC_GUEST", customer: "Galih Pratama", phone: "081234110014", pet: "Tama", petType: "Anjing", breed: "Husky", age: 5 },
  // --- Riwayat & jadwal tambahan agar grafik 14 hari terisi ---
  { dayOffset: -6, hourWib: 9, minute: 30, status: "COMPLETED", source: "PUBLIC_GUEST", customer: "Wulan Sari", phone: "081234110015", pet: "Mimi", petType: "Kucing", breed: "Persia", age: 2 },
  { dayOffset: -6, hourWib: 13, minute: 0, status: "COMPLETED", source: "WALK_IN", customer: "Doni Hermawan", phone: "081234110016", pet: "Bolt", petType: "Anjing", breed: "Labrador", age: 3 },
  { dayOffset: -5, hourWib: 10, minute: 0, status: "COMPLETED", source: "PUBLIC_GUEST", customer: "Citra Lestari", phone: "081234110017", pet: "Nala", petType: "Kucing", breed: "Domestik", age: 4 },
  { dayOffset: -5, hourWib: 11, minute: 30, status: "COMPLETED", source: "PUBLIC_GUEST", customer: "Eko Prasetya", phone: "081234110018", pet: "Max", petType: "Anjing", breed: "Poodle", age: 6 },
  { dayOffset: -5, hourWib: 15, minute: 0, status: "COMPLETED", source: "PUBLIC_GUEST", customer: "Farah Diba", phone: "081234110019", pet: "Cleo", petType: "Kucing", breed: "Anggora", age: 1 },
  { dayOffset: -4, hourWib: 9, minute: 0, status: "COMPLETED", source: "PUBLIC_GUEST", customer: "Gilang Ramadhan", phone: "081234110020", pet: "Rex", petType: "Anjing", breed: "Bulldog", age: 4 },
  { dayOffset: -4, hourWib: 14, minute: 0, status: "NO_SHOW", source: "PUBLIC_GUEST", customer: "Hana Pertiwi", phone: "081234110021", pet: "Pipi", petType: "Kucing", breed: "Domestik", age: 2 },
  { dayOffset: -3, hourWib: 10, minute: 30, status: "COMPLETED", source: "WALK_IN", customer: "Indra Kusuma", phone: "081234110022", pet: "Boni", petType: "Anjing", breed: "Shih Tzu", age: 5 },
  { dayOffset: -3, hourWib: 13, minute: 30, status: "COMPLETED", source: "PUBLIC_GUEST", customer: "Jihan Aulia", phone: "081234110023", pet: "Lily", petType: "Kucing", breed: "Ragdoll", age: 3 },
  { dayOffset: -3, hourWib: 16, minute: 0, status: "COMPLETED", source: "PUBLIC_GUEST", customer: "Krisna Adi", phone: "081234110024", pet: "Choco", petType: "Anjing", breed: "Pomeranian", age: 2 },
  { dayOffset: -2, hourWib: 9, minute: 30, status: "COMPLETED", source: "PUBLIC_GUEST", customer: "Laras Wati", phone: "081234110025", pet: "Gigi", petType: "Kucing", breed: "British Shorthair", age: 3 },
  { dayOffset: -1, hourWib: 15, minute: 30, status: "COMPLETED", source: "PUBLIC_GUEST", customer: "Mario Teguh", phone: "081234110026", pet: "Duke", petType: "Anjing", breed: "Beagle", age: 7 },
  { dayOffset: 2, hourWib: 13, minute: 0, status: "CONFIRMED", source: "PUBLIC_GUEST", customer: "Nina Marlina", phone: "081234110027", pet: "Kitty", petType: "Kucing", breed: "Domestik", age: 2 },
  { dayOffset: 3, hourWib: 9, minute: 0, status: "CONFIRMED", source: "PUBLIC_GUEST", customer: "Oscar Wijaya", phone: "081234110028", pet: "Leo", petType: "Anjing", breed: "Golden Retriever", age: 2 },
  { dayOffset: 3, hourWib: 11, minute: 0, status: "PENDING", source: "PUBLIC_GUEST", customer: "Pita Anggraini", phone: "081234110029", pet: "Mocha", petType: "Kucing", breed: "Maine Coon", age: 4 },
  { dayOffset: 4, hourWib: 10, minute: 30, status: "CONFIRMED", source: "PUBLIC_GUEST", customer: "Qori Fadhil", phone: "081234110030", pet: "Zeus", petType: "Anjing", breed: "Husky", age: 3 },
  { dayOffset: 4, hourWib: 14, minute: 0, status: "CONFIRMED", source: "PUBLIC_GUEST", customer: "Rani Octavia", phone: "081234110031", pet: "Susu", petType: "Kucing", breed: "Persia", age: 5 },
  { dayOffset: 5, hourWib: 9, minute: 30, status: "PENDING", source: "PUBLIC_GUEST", customer: "Surya Dharma", phone: "081234110032", pet: "Ciko", petType: "Anjing", breed: "Corgi", age: 2 },
  { dayOffset: 6, hourWib: 11, minute: 30, status: "CONFIRMED", source: "PUBLIC_GUEST", customer: "Tia Handayani", phone: "081234110033", pet: "Nemo", petType: "Kucing", breed: "Domestik", age: 1 },
  { dayOffset: 6, hourWib: 15, minute: 0, status: "CONFIRMED", source: "PUBLIC_GUEST", customer: "Umar Faruq", phone: "081234110034", pet: "Bear", petType: "Anjing", breed: "Samoyed", age: 4 },
  { dayOffset: 7, hourWib: 10, minute: 0, status: "CONFIRMED", source: "PUBLIC_GUEST", customer: "Vina Melati", phone: "081234110035", pet: "Mia", petType: "Kucing", breed: "Anggora", age: 2 },
];

/**
 * Ubah "jam dinding WIB" menjadi instan UTC yang benar.
 * WIB = UTC+7 sepanjang tahun (tanpa DST), jadi cukup dikurangi 7 jam.
 */
function wibToUtc(dayOffset: number, hourWib: number, minute: number): Date {
  const now = new Date();
  const wibNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const y = wibNow.getUTCFullYear();
  const m = wibNow.getUTCMonth();
  const d = wibNow.getUTCDate() + dayOffset;
  return new Date(Date.UTC(y, m, d, hourWib - 7, minute, 0, 0));
}

async function main() {
  loadEnv();
  const mode = process.argv.includes("--undo")
    ? "undo"
    : process.argv.includes("--dry")
      ? "dry"
      : "write";
  const prisma = new PrismaClient();

  try {
    const business = await prisma.business.findFirst({
      select: { id: true, name: true, timezone: true },
    });
    if (!business) throw new Error("Tidak ada data bisnis. Jalankan seed utama dulu.");

    if (mode === "undo") {
      const bookings = await prisma.booking.findMany({
        where: { bookingCode: { startsWith: DEMO_CODE_PREFIX } },
        select: { id: true },
      });
      const customers = await prisma.customer.findMany({
        where: { businessId: business.id, email: { endsWith: DEMO_EMAIL_SUFFIX } },
        select: { id: true },
      });
      const bookingIds = bookings.map((b) => b.id);
      const customerIds = customers.map((c) => c.id);

      // Urutan: riwayat anak dulu, lalu booking, lalu pet, lalu pelanggan.
      await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
      await prisma.pet.deleteMany({ where: { customerId: { in: customerIds } } });
      await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
      console.log(
        `Dicabut: ${bookingIds.length} reservasi contoh, ${customerIds.length} pelanggan contoh (beserta anabulnya).`,
      );
      return;
    }

    const resource = await prisma.bookingResource.findFirst({
      where: { businessId: business.id, isActive: true },
      select: { id: true, name: true },
    });
    if (!resource) throw new Error("Tidak ada resource booking aktif.");

    const services = await prisma.service.findMany({
      where: { businessId: business.id, isActive: true },
      select: { id: true, name: true, durationMinutes: true, bufferMinutes: true, price: true },
      orderBy: { displayOrder: "asc" },
    });
    if (services.length === 0) throw new Error("Tidak ada layanan aktif.");

    const existingDemo = await prisma.booking.count({
      where: { bookingCode: { startsWith: DEMO_CODE_PREFIX } },
    });

    console.log(`Bisnis      : ${business.name} (${business.timezone})`);
    console.log(`Resource    : ${resource.name}`);
    console.log(`Layanan     : ${services.length} aktif`);
    console.log(`Data contoh : ${existingDemo} reservasi sudah ada sebelumnya`);
    console.log(`Rencana     : ${PLAN.length} reservasi baru\n`);

    if (existingDemo > 0) {
      console.log("Data contoh sudah ada. Jalankan dengan --undo dulu bila ingin membuat ulang.");
      return;
    }

    let index = 0;
    for (const item of PLAN) {
      index += 1;
      const service = services[index % services.length];
      const startAt = wibToUtc(item.dayOffset, item.hourWib, item.minute);
      const serviceEndAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);
      const occupancyEndAt = new Date(
        serviceEndAt.getTime() + (service.bufferMinutes ?? 0) * 60_000,
      );
      const code = `${DEMO_CODE_PREFIX}${String(index).padStart(4, "0")}`;
      const waktuWib = startAt.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

      if (mode === "dry") {
        console.log(
          `[rencana] ${code} ${item.status.padEnd(12)} ${waktuWib} — ${item.customer} / ${item.pet} — ${service.name}`,
        );
        continue;
      }

      await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.create({
          data: {
            businessId: business.id,
            name: item.customer,
            phone: item.phone,
            email: `${item.customer.toLowerCase().replace(/[^a-z]+/g, ".")}${DEMO_EMAIL_SUFFIX}`,
          },
        });
        const pet = await tx.pet.create({
          data: {
            customerId: customer.id,
            name: item.pet,
            type: item.petType,
            breed: item.breed,
            age: item.age,
            notes: item.notes ?? null,
          },
        });
        const booking = await tx.booking.create({
          data: {
            businessId: business.id,
            resourceId: resource.id,
            customerId: customer.id,
            petId: pet.id,
            serviceId: service.id,
            bookingCode: code,
            startAt,
            endAt: occupancyEndAt,
            serviceEndAt,
            occupancyEndAt,
            serviceNameSnapshot: service.name,
            serviceDurationSnapshot: service.durationMinutes,
            servicePriceSnapshot: service.price,
            totalPrice: service.price,
            source: item.source,
            status: item.status,
            customerNotes: item.notes ?? null,
            cancelledAt: item.status === "CANCELLED" ? new Date() : null,
            cancellationReason:
              item.status === "CANCELLED" ? "Dibatalkan pelanggan (data contoh)." : null,
          },
        });
        await tx.bookingStatusHistory.create({
          data: { bookingId: booking.id, fromStatus: null, toStatus: item.status, reason: "Data contoh dashboard." },
        });
      });

      console.log(`[dibuat]  ${code} ${item.status.padEnd(12)} ${waktuWib} — ${item.customer} / ${item.pet}`);
    }

    if (mode === "dry") console.log("\nMode uji-coba: tidak ada data yang ditulis.");
    else console.log(`\nSelesai: ${PLAN.length} reservasi contoh ditambahkan.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Gagal:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
