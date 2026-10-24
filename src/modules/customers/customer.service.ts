import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { CustomerListQuery } from "@/modules/bookings/admin-schemas";

export async function listCustomers(businessId: string, query: CustomerListQuery) {
  const { page = 1, limit = 10, search } = query;

  const where: Prisma.CustomerWhereInput = {
    businessId,
  };

  if (search && search.trim().length > 0) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        pets: {
          select: {
            id: true,
            name: true,
            type: true,
            breed: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            pets: true,
          },
        },
        bookings: {
          take: 1,
          orderBy: { startAt: "desc" },
          select: {
            startAt: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const items = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    pets: c.pets,
    totalBookings: c._count.bookings,
    totalPets: c._count.pets,
    lastBooking: c.bookings[0] || null,
  }));

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function getCustomerDetail(businessId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      businessId,
    },
    include: {
      pets: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      },
      bookings: {
        orderBy: { startAt: "desc" },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              durationMinutes: true,
            },
          },
          pet: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          resource: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    throw new Error("Pelanggan tidak ditemukan.");
  }

  return customer;
}
