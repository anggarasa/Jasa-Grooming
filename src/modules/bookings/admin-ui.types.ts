import { BookingStatus } from "@prisma/client";

export interface BookingCustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

export interface BookingPetSummary {
  id: string;
  name: string;
  type: string;
  breed: string | null;
  age?: number | null;
  notes?: string | null;
}

export interface BookingServiceSummary {
  id: string;
  name: string;
  durationMinutes: number;
  price?: number | string | null;
}

export interface BookingResourceSummary {
  id: string;
  name: string;
}

export interface BookingListItem {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  source: string;
  startAt: string | Date;
  endAt: string | Date;
  totalPrice: number | string;
  customer: BookingCustomerSummary | null;
  pet: BookingPetSummary | null;
  service: BookingServiceSummary | null;
  resource?: BookingResourceSummary | null;
}

export interface BookingStatusHistoryItem {
  id: string;
  bookingId: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  reason: string | null;
  createdAt: string | Date;
}

export interface BookingRescheduleHistoryItem {
  id: string;
  bookingId: string;
  previousStartAt: string | Date;
  newStartAt: string | Date;
  reason: string;
  createdAt: string | Date;
}

export interface BookingAuditLogItem {
  id: string;
  bookingId?: string | null;
  action: string;
  reason: string | null;
  createdAt: string | Date;
}

export interface AdminBookingDetailItem extends BookingListItem {
  customerId?: string | null;
  petId?: string | null;
  serviceId: string;
  resourceId?: string | null;
  serviceSnapshotName?: string | null;
  serviceSnapshotDuration?: number | null;
  serviceNameSnapshot?: string | null;
  serviceDurationSnapshot?: number | null;
  servicePriceSnapshot?: number | string | null;
  customerNotes?: string | null;
  internalNotes: string | null;
  cancellationReason?: string | null;
  cancelledAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  statusHistories?: BookingStatusHistoryItem[];
  rescheduleHistories?: BookingRescheduleHistoryItem[];
  auditLogs?: BookingAuditLogItem[];
}

export interface CalendarBlockedTimeItem {
  id: string;
  resourceId: string;
  startAt: string | Date;
  endAt: string | Date;
  reason: string;
  cancelledAt?: string | Date | null;
  resource?: BookingResourceSummary | null;
}

export interface CustomerPetSummary {
  id: string;
  name: string;
  type: string;
  breed?: string | null;
  age?: number | null;
  notes?: string | null;
  _count?: {
    bookings: number;
  };
}

export interface CustomerListItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  pets: CustomerPetSummary[];
  totalBookings: number;
  totalPets: number;
  lastBooking: {
    startAt: string | Date;
    status: BookingStatus;
  } | null;
}

export interface CustomerDetailItem extends CustomerListItem {
  pets: CustomerPetSummary[];
  bookings: {
    id: string;
    bookingCode: string;
    startAt: string | Date;
    endAt: string | Date;
    status: BookingStatus;
    totalPrice: number | string;
    serviceSnapshotName?: string | null;
    service?: {
      name: string;
    } | null;
    pet?: {
      name: string;
    } | null;
  }[];
}
