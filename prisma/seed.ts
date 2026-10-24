import { PrismaClient, Role, BookingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding basis data...");

  // 1. Seed Owner Account
  const hashedPassword = await bcrypt.hash("Password123!", 10);
  const owner = await prisma.user.upsert({
    where: { email: "owner@pawcare.id" },
    update: {
      name: "Owner PawCare",
      passwordHash: hashedPassword,
      role: Role.OWNER,
      isActive: true,
    },
    create: {
      name: "Owner PawCare",
      email: "owner@pawcare.id",
      passwordHash: hashedPassword,
      role: Role.OWNER,
      isActive: true,
    },
  });
  console.log(`✓ User Owner berhasil disiapkan: ${owner.email}`);

  // 2. Seed Business
  const business = await prisma.business.upsert({
    where: { slug: "pawcare-grooming" },
    update: {
      name: "PawCare Grooming",
      description:
        "Layanan pet grooming profesional dan penuh kasih sayang untuk anjing dan kucing kesayangan Anda.",
      email: "halo@pawcare.id",
      phone: "081234567890",
      whatsapp: "081234567890",
      address: "Jl. Boulevard Barat Raya No. 88, Jakarta Selatan",
      fullAddress: "Jl. Boulevard Barat Raya No. 88, Kelapa Gading, Jakarta Utara",
      city: "Jakarta Utara",
      province: "DKI Jakarta",
      postalCode: "14240",
      googleMapsUrl: "https://maps.google.com/?q=-6.1553,106.9012",
      timezone: "Asia/Jakarta",
      logoObjectKey: "business/logos/logo.webp",
      status: "ACTIVE",
      isActive: true,
    },
    create: {
      name: "PawCare Grooming",
      slug: "pawcare-grooming",
      description:
        "Layanan pet grooming profesional dan penuh kasih sayang untuk anjing dan kucing kesayangan Anda.",
      email: "halo@pawcare.id",
      phone: "081234567890",
      whatsapp: "081234567890",
      address: "Jl. Boulevard Barat Raya No. 88, Jakarta Selatan",
      fullAddress: "Jl. Boulevard Barat Raya No. 88, Kelapa Gading, Jakarta Utara",
      city: "Jakarta Utara",
      province: "DKI Jakarta",
      postalCode: "14240",
      googleMapsUrl: "https://maps.google.com/?q=-6.1553,106.9012",
      timezone: "Asia/Jakarta",
      logoObjectKey: "business/logos/logo.webp",
      status: "ACTIVE",
      isActive: true,
    },
  });
  console.log(`✓ Business disiapkan: ${business.name}`);

  // 2b. Seed Default Booking Resource
  let defaultResource = await prisma.bookingResource.findFirst({
    where: {
      businessId: business.id,
      name: "Main Grooming Station",
    },
  });

  if (!defaultResource) {
    defaultResource = await prisma.bookingResource.create({
      data: {
        businessId: business.id,
        name: "Main Grooming Station",
        isActive: true,
      },
    });
  }
  console.log(`✓ Booking Resource disiapkan: ${defaultResource.name}`);

  // 3. Seed Business Settings
  await prisma.businessSetting.upsert({
    where: { businessId: business.id },
    update: {
      bookingEnabled: true,
      currency: "IDR",
      bookingIntervalMinutes: 30,
      defaultBufferMinutes: 15,
      minimumAdvanceMinutes: 60,
      maximumAdvanceDays: 30,
      cancellationWindowHours: 24,
      autoConfirmBooking: false,
      allowCustomerReschedule: true,
    },
    create: {
      businessId: business.id,
      bookingEnabled: true,
      currency: "IDR",
      bookingIntervalMinutes: 30,
      defaultBufferMinutes: 15,
      minimumAdvanceMinutes: 60,
      maximumAdvanceDays: 30,
      cancellationWindowHours: 24,
      autoConfirmBooking: false,
      allowCustomerReschedule: true,
    },
  });
  console.log("✓ Pengaturan bisnis berhasil disiapkan");

  // 3b. Seed Business Operating Hours (0=Sun, 1=Mon, ..., 6=Sat)
  for (let day = 0; day <= 6; day++) {
    const isSunday = day === 0;
    const hour = await prisma.businessOperatingHour.upsert({
      where: {
        businessId_dayOfWeek: {
          businessId: business.id,
          dayOfWeek: day,
        },
      },
      update: {
        isOpen: !isSunday,
        openTime: isSunday ? "10:00" : "09:00",
        closeTime: isSunday ? "16:00" : "18:00",
      },
      create: {
        businessId: business.id,
        dayOfWeek: day,
        isOpen: !isSunday,
        openTime: isSunday ? "10:00" : "09:00",
        closeTime: isSunday ? "16:00" : "18:00",
      },
    });

    if (!isSunday) {
      await prisma.businessOperatingBreak.deleteMany({
        where: { operatingHourId: hour.id },
      });
      await prisma.businessOperatingBreak.create({
        data: {
          operatingHourId: hour.id,
          startTime: "12:00",
          endTime: "13:00",
        },
      });
    }
  }
  console.log("✓ Jam operasional & istirahat berhasil disiapkan");

  // 4. Seed Service Categories
  const catCategory = await prisma.serviceCategory.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: "grooming-kucing",
      },
    },
    update: {
      name: "Grooming Kucing",
      description: "Perawatan mandi & styling khusus kucing segala ras.",
      isActive: true,
    },
    create: {
      businessId: business.id,
      name: "Grooming Kucing",
      slug: "grooming-kucing",
      description: "Perawatan mandi & styling khusus kucing segala ras.",
      isActive: true,
    },
  });

  const dogCategory = await prisma.serviceCategory.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: "grooming-anjing",
      },
    },
    update: {
      name: "Grooming Anjing",
      description: "Perawatan mandi, potong bulu & styling anjing.",
      isActive: true,
    },
    create: {
      businessId: business.id,
      name: "Grooming Anjing",
      slug: "grooming-anjing",
      description: "Perawatan mandi, potong bulu & styling anjing.",
      isActive: true,
    },
  });

  const specialCategory = await prisma.serviceCategory.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: "perawatan-khusus",
      },
    },
    update: {
      name: "Perawatan Khusus",
      description: "Treatment medis ringan seperti kutu, jamur, dan relaksasi.",
      isActive: true,
    },
    create: {
      businessId: business.id,
      name: "Perawatan Khusus",
      slug: "perawatan-khusus",
      description: "Treatment medis ringan seperti kutu, jamur, dan relaksasi.",
      isActive: true,
    },
  });
  console.log("✓ Kategori layanan berhasil disiapkan");

  // 5. Seed Services
  const catBasicService = await prisma.service.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: "basic-cat-grooming",
      },
    },
    update: {
      categoryId: catCategory.id,
      name: "Basic Cat Grooming",
      description: "Mandi bersih, potong kuku, bersihkan telinga, dan sisir bulu.",
      durationMinutes: 60,
      price: 85000,
      imageObjectKey: "services/images/cat-basic.webp",
      isActive: true,
    },
    create: {
      businessId: business.id,
      categoryId: catCategory.id,
      name: "Basic Cat Grooming",
      slug: "basic-cat-grooming",
      description: "Mandi bersih, potong kuku, bersihkan telinga, dan sisir bulu.",
      durationMinutes: 60,
      price: 85000,
      imageObjectKey: "services/images/cat-basic.webp",
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: "complete-cat-spa",
      },
    },
    update: {
      categoryId: catCategory.id,
      name: "Complete Cat Spa",
      description: "Basic grooming plus conditioning bulu, blowing halus, dan parfum.",
      durationMinutes: 90,
      price: 135000,
      imageObjectKey: "services/images/cat-spa.webp",
      isActive: true,
    },
    create: {
      businessId: business.id,
      categoryId: catCategory.id,
      name: "Complete Cat Spa",
      slug: "complete-cat-spa",
      description: "Basic grooming plus conditioning bulu, blowing halus, dan parfum.",
      durationMinutes: 90,
      price: 135000,
      imageObjectKey: "services/images/cat-spa.webp",
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: "basic-dog-grooming",
      },
    },
    update: {
      categoryId: dogCategory.id,
      name: "Basic Dog Grooming (Kecil - Sedang)",
      description: "Mandi higienis, potong kuku, bersihkan telinga, perapihan telapak.",
      durationMinutes: 60,
      price: 95000,
      imageObjectKey: "services/images/dog-basic.webp",
      isActive: true,
    },
    create: {
      businessId: business.id,
      categoryId: dogCategory.id,
      name: "Basic Dog Grooming (Kecil - Sedang)",
      slug: "basic-dog-grooming",
      description: "Mandi higienis, potong kuku, bersihkan telinga, perapihan telapak.",
      durationMinutes: 60,
      price: 95000,
      imageObjectKey: "services/images/dog-basic.webp",
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: "full-styling-haircut-dog",
      },
    },
    update: {
      categoryId: dogCategory.id,
      name: "Full Styling & Haircut Dog",
      description: "Mandi lengkap plus haircut styling sesuai standar ras.",
      durationMinutes: 90,
      price: 165000,
      imageObjectKey: "services/images/dog-styling.webp",
      isActive: true,
    },
    create: {
      businessId: business.id,
      categoryId: dogCategory.id,
      name: "Full Styling & Haircut Dog",
      slug: "full-styling-haircut-dog",
      description: "Mandi lengkap plus haircut styling sesuai standar ras.",
      durationMinutes: 90,
      price: 165000,
      imageObjectKey: "services/images/dog-styling.webp",
      isActive: true,
    },
  });

  await prisma.service.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: "treatment-anti-kutu-jamur",
      },
    },
    update: {
      categoryId: specialCategory.id,
      name: "Treatment Anti Kutu & Jamur",
      description: "Mandi obat medis dengan formula khusus mengeliminasi parasit dan jamur kulit.",
      durationMinutes: 75,
      price: 120000,
      imageObjectKey: "services/images/treatment-parasite.webp",
      isActive: true,
    },
    create: {
      businessId: business.id,
      categoryId: specialCategory.id,
      name: "Treatment Anti Kutu & Jamur",
      slug: "treatment-anti-kutu-jamur",
      description: "Mandi obat medis dengan formula khusus mengeliminasi parasit dan jamur kulit.",
      durationMinutes: 75,
      price: 120000,
      imageObjectKey: "services/images/treatment-parasite.webp",
      isActive: true,
    },
  });
  console.log("✓ Daftar layanan berhasil disiapkan");

  // 5b. Seed Business Gallery Items
  const gallerySeedData = [
    {
      objectKey: "gallery/images/salon-facility.webp",
      caption: "Area Grooming Bersih Ber-AC",
      altText: "Ruangan salon bersih dengan meja hidrolik dan sterilisasi UV",
      displayOrder: 1,
    },
    {
      objectKey: "gallery/images/cat-persian-groom.webp",
      caption: "Kucing Persia Selesai Mandi Spa",
      altText: "Kucing persia putih bersih, wangi, dan ceria setelah perawatan spa",
      displayOrder: 2,
    },
    {
      objectKey: "gallery/images/dog-poodle-groom.webp",
      caption: "Poodle Cantik Haircut Rapi",
      altText: "Anjing poodle hasil styling gunting rapi dan harum",
      displayOrder: 3,
    },
    {
      objectKey: "gallery/images/dog-bath-fun.webp",
      caption: "Anabul Ceria saat Mandi Busa",
      altText: "Anjing riang gembira menikmati sesi mandi spa hypoallergenic",
      displayOrder: 4,
    },
  ];

  for (const item of gallerySeedData) {
    const existing = await prisma.businessGallery.findFirst({
      where: {
        businessId: business.id,
        objectKey: item.objectKey,
      },
    });

    if (existing) {
      await prisma.businessGallery.update({
        where: { id: existing.id },
        data: {
          caption: item.caption,
          altText: item.altText,
          displayOrder: item.displayOrder,
          isActive: true,
        },
      });
    } else {
      await prisma.businessGallery.create({
        data: {
          businessId: business.id,
          objectKey: item.objectKey,
          caption: item.caption,
          altText: item.altText,
          displayOrder: item.displayOrder,
          isActive: true,
        },
      });
    }
  }
  console.log("✓ Galeri dokumentasi bisnis berhasil disiapkan");

  // 5c. Seed MediaAssets for tracking
  const mediaAssetsData = [
    { objectKey: "business/logos/logo.webp", originalName: "logo.webp", folder: "business/logos", sizeBytes: 24125 },
    { objectKey: "services/images/cat-basic.webp", originalName: "cat-basic.webp", folder: "services/images", sizeBytes: 28784 },
    { objectKey: "services/images/cat-spa.webp", originalName: "cat-spa.webp", folder: "services/images", sizeBytes: 142031 },
    { objectKey: "services/images/dog-basic.webp", originalName: "dog-basic.webp", folder: "services/images", sizeBytes: 35784 },
    { objectKey: "services/images/dog-styling.webp", originalName: "dog-styling.webp", folder: "services/images", sizeBytes: 33601 },
    { objectKey: "services/images/treatment-parasite.webp", originalName: "treatment-parasite.webp", folder: "services/images", sizeBytes: 44717 },
    { objectKey: "gallery/images/salon-facility.webp", originalName: "salon-facility.webp", folder: "gallery/images", sizeBytes: 37633 },
    { objectKey: "gallery/images/cat-persian-groom.webp", originalName: "cat-persian-groom.webp", folder: "gallery/images", sizeBytes: 81401 },
    { objectKey: "gallery/images/dog-poodle-groom.webp", originalName: "dog-poodle-groom.webp", folder: "gallery/images", sizeBytes: 109486 },
    { objectKey: "gallery/images/dog-bath-fun.webp", originalName: "dog-bath-fun.webp", folder: "gallery/images", sizeBytes: 70309 },
  ];

  for (const asset of mediaAssetsData) {
    await prisma.mediaAsset.upsert({
      where: { objectKey: asset.objectKey },
      update: {
        originalName: asset.originalName,
        folder: asset.folder,
        sizeBytes: asset.sizeBytes,
        mimeType: "image/webp",
      },
      create: {
        businessId: business.id,
        objectKey: asset.objectKey,
        originalName: asset.originalName,
        mimeType: "image/webp",
        sizeBytes: asset.sizeBytes,
        folder: asset.folder,
      },
    });
  }
  console.log("✓ Media assets metadata berhasil disiapkan");

  // 6. Seed Sample Customer, Pet, and Booking
  let sampleCustomer = await prisma.customer.findFirst({
    where: { businessId: business.id, phone: "081298765432" },
  });

  if (!sampleCustomer) {
    sampleCustomer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: "Budi Santoso",
        email: "budi.santoso@example.com",
        phone: "081298765432",
      },
    });
  }

  let samplePet = await prisma.pet.findFirst({
    where: { customerId: sampleCustomer.id, name: "Mimi" },
  });

  if (!samplePet) {
    samplePet = await prisma.pet.create({
      data: {
        customerId: sampleCustomer.id,
        name: "Mimi",
        type: "Kucing",
        breed: "Persia Medium",
        age: 2,
        notes: "Sedikit pemalu dengan air dingin",
      },
    });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 0, 0, 0);

  const tomorrowOccupancyEnd = new Date(tomorrowEnd.getTime() + 15 * 60 * 1000);

  await prisma.booking.upsert({
    where: { bookingCode: "BK-PAW-0001" },
    update: {
      resourceId: defaultResource.id,
      status: BookingStatus.CONFIRMED,
      totalPrice: 85000,
      serviceEndAt: tomorrowEnd,
      occupancyEndAt: tomorrowOccupancyEnd,
      serviceNameSnapshot: catBasicService.name,
      serviceDurationSnapshot: catBasicService.durationMinutes,
      servicePriceSnapshot: catBasicService.price,
      customerNotes: "Mohon penanganan ekstra lembut.",
    },
    create: {
      businessId: business.id,
      resourceId: defaultResource.id,
      customerId: sampleCustomer.id,
      petId: samplePet.id,
      serviceId: catBasicService.id,
      bookingCode: "BK-PAW-0001",
      startAt: tomorrow,
      endAt: tomorrowEnd,
      serviceEndAt: tomorrowEnd,
      occupancyEndAt: tomorrowOccupancyEnd,
      serviceNameSnapshot: catBasicService.name,
      serviceDurationSnapshot: catBasicService.durationMinutes,
      servicePriceSnapshot: catBasicService.price,
      status: BookingStatus.CONFIRMED,
      totalPrice: 85000,
      notes: "Mohon penanganan ekstra lembut.",
      customerNotes: "Mohon penanganan ekstra lembut.",
    },
  });
  console.log("✓ Sample customer, pet, dan booking berhasil disiapkan");

  console.log("✅ Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
