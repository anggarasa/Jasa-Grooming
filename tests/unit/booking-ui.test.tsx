// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { Step1ServiceSelect } from "@/components/booking/Step1ServiceSelect";
import { Step2DateSelect } from "@/components/booking/Step2DateSelect";
import { Step3TimeSelect } from "@/components/booking/Step3TimeSelect";
import { Step4CustomerForm } from "@/components/booking/Step4CustomerForm";
import { Step5PetForm } from "@/components/booking/Step5PetForm";
import { Step6ReviewConfirm } from "@/components/booking/Step6ReviewConfirm";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { BookingConfirmationCard } from "@/components/booking/BookingConfirmationCard";
import { BookingManageCard } from "@/components/booking/BookingManageCard";
import { PublicServiceItem } from "@/modules/public/public-services.service";
import { PublicBusinessProfile } from "@/modules/public/public-business.service";
import { ManagedBookingDto } from "@/modules/bookings/token.service";
import { BookingStatus } from "@prisma/client";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockServices: PublicServiceItem[] = [
  {
    id: "svc-1",
    name: "Grooming Lengkap Anjing Kecil",
    slug: "grooming-lengkap-anjing-kecil",
    description: "Mandi, potong kuku, pembersihan telinga, dan potong bulu.",
    shortDescription: "Perawatan komprehensif anjing ras kecil.",
    fullDescription: null,
    durationMinutes: 60,
    bufferMinutes: 15,
    price: 150000,
    formattedPrice: "Rp 150.000",
    imageObjectKey: null,
    displayOrder: 1,
    category: {
      id: "cat-1",
      name: "Anjing",
      slug: "anjing",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "svc-2",
    name: "Mandi Sehat Kucing",
    slug: "mandi-sehat-kucing",
    description: "Mandi antikutu & antijamur.",
    shortDescription: "Mandi segar dengan sampo khusus kucing.",
    fullDescription: null,
    durationMinutes: 45,
    bufferMinutes: 15,
    price: 120000,
    formattedPrice: "Rp 120.000",
    imageObjectKey: null,
    displayOrder: 2,
    category: {
      id: "cat-2",
      name: "Kucing",
      slug: "kucing",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockBusiness: PublicBusinessProfile = {
  id: "biz-1",
  name: "PawCare Grooming",
  slug: "pawcare-grooming",
  description: "Salon anabul profesional.",
  email: "halo@pawcare.id",
  phone: "081234567890",
  whatsapp: "081234567890",
  address: "Jl. Senopati No. 42",
  fullAddress: "Jl. Senopati No. 42, Jakarta Selatan",
  city: "Jakarta",
  province: "DKI Jakarta",
  postalCode: "12190",
  googleMapsUrl: "https://maps.google.com/?q=PawCare",
  timezone: "WIB",
  logoObjectKey: null,
};

const mockManagedBooking: ManagedBookingDto = {
  id: "b-1",
  bookingCode: "GRM-20261023-ABCD",
  status: BookingStatus.CONFIRMED,
  startAt: "2026-10-24T09:00:00.000Z",
  endAt: "2026-10-24T10:00:00.000Z",
  serviceEndAt: "2026-10-24T10:00:00.000Z",
  occupancyEndAt: "2026-10-24T10:15:00.000Z",
  serviceName: "Grooming Lengkap Anjing Kecil",
  durationMinutes: 60,
  totalPrice: 150000,
  customerNotes: "Mohon hati-hati di kaki kiri",
  customer: {
    name: "Sarah Wijaya",
    phone: "081234567890",
    email: "sarah@gmail.com",
  },
  pet: {
    name: "Milo",
    type: "Anjing",
    breed: "Poodle",
    age: 2,
    notes: "Takut suara keras",
  },
  stationName: "Main Grooming Station",
  canCancel: true,
  cancellationWindowHours: 24,
  createdAt: "2026-10-23T04:00:00.000Z",
};

describe("BookingProgress Component", () => {
  it("merender 6 langkah reservasi dan indikator langkah aktif", () => {
    render(<BookingProgress currentStep={3} />);

    expect(screen.getAllByText("Pilih Jam").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Layanan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Konfirmasi").length).toBeGreaterThan(0);

    const step3Buttons = screen.getAllByRole("button", { name: /Langkah 3: Pilih Jam/i });
    expect(step3Buttons.length).toBeGreaterThan(0);
  });

  it("memanggil onStepClick saat langkah sebelumnya yang telah selesai diklik", () => {
    const handleStepClick = vi.fn();
    render(<BookingProgress currentStep={3} maxAccessibleStep={3} onStepClick={handleStepClick} />);

    const step1Buttons = screen.getAllByRole("button", { name: /Langkah 1: Pilih Layanan/i });
    fireEvent.click(step1Buttons[0]);

    expect(handleStepClick).toHaveBeenCalledWith(1);
  });
});

describe("Step1ServiceSelect Component", () => {
  it("merender daftar layanan dan menangani pemilihan layanan", () => {
    const handleSelect = vi.fn();
    render(
      <Step1ServiceSelect
        services={mockServices}
        selectedServiceId={null}
        onSelectService={handleSelect}
      />
    );

    expect(screen.getByText("Grooming Lengkap Anjing Kecil")).toBeDefined();
    expect(screen.getByText("Mandi Sehat Kucing")).toBeDefined();

    const serviceCard = screen.getByText("Grooming Lengkap Anjing Kecil").closest("[role='radio']");
    expect(serviceCard).toBeDefined();

    if (serviceCard) {
      fireEvent.click(serviceCard);
      expect(handleSelect).toHaveBeenCalledWith(mockServices[0]);
    }
  });

  it("merender pesan kosong jika tidak ada layanan aktif", () => {
    render(
      <Step1ServiceSelect
        services={[]}
        selectedServiceId={null}
        onSelectService={vi.fn()}
      />
    );

    expect(screen.getByText("Belum Ada Layanan Tersedia")).toBeDefined();
  });
});

describe("Step2DateSelect Component", () => {
  it("merender opsi tanggal cepat dan input kalender", () => {
    const handleSelect = vi.fn();
    render(<Step2DateSelect selectedDate="2026-10-24" onSelectDate={handleSelect} />);

    expect(screen.getByText("Pilih Tanggal Reservasi")).toBeDefined();
    expect(screen.getByLabelText(/Atau Pilih Tanggal Melalui Kalender:/i)).toBeDefined();

    const dateInput = screen.getByLabelText(/Atau Pilih Tanggal Melalui Kalender:/i);
    fireEvent.change(dateInput, { target: { value: "2026-10-25" } });
    expect(handleSelect).toHaveBeenCalledWith("2026-10-25");
  });
});

describe("Step3TimeSelect Component", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mengambil slot waktu dan merender slot tersedia", async () => {
    const mockSlotsResponse = {
      success: true,
      date: "2026-10-24",
      slots: [
        { time: "09:00", available: true },
        { time: "09:30", available: false, reason: "Sudah terisi" },
        { time: "10:00", available: true },
      ],
      data: { isOpen: true },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSlotsResponse,
    } as unknown as Response);

    const handleSelectTime = vi.fn();

    render(
      <Step3TimeSelect
        serviceId="svc-1"
        date="2026-10-24"
        selectedTime=""
        onSelectTime={handleSelectTime}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("09:00")).toBeDefined();
    });

    expect(screen.getByText("09:30")).toBeDefined();
    expect(screen.getByText("10:00")).toBeDefined();

    const slot0900 = screen.getByRole("radio", { name: "09:00" });
    fireEvent.click(slot0900);
    expect(handleSelectTime).toHaveBeenCalledWith("09:00");
  });

  it("menampilkan pesan salon tutup jika isOpen bernilai false", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        date: "2026-10-25",
        slots: [],
        data: { isOpen: false },
      }),
    } as unknown as Response);

    render(
      <Step3TimeSelect
        serviceId="svc-1"
        date="2026-10-25"
        selectedTime=""
        onSelectTime={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Salon Tutup Pada Tanggal Terpilih")).toBeDefined();
    });
  });
});

describe("Step4CustomerForm Component", () => {
  it("menampilkan validasi error jika nama dan nomor telepon kosong", async () => {
    const handleSubmit = vi.fn();

    render(
      <Step4CustomerForm
        initialData={{ name: "", phone: "", email: "" }}
        onSubmitStep={handleSubmit}
        formId="test-customer-form"
      />
    );

    const form = screen.getByRole("form", { name: "Form Data Pemilik" });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Nama pelanggan minimal 2 karakter/i)).toBeDefined();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("memanggil onSubmitStep jika form valid", async () => {
    const handleSubmit = vi.fn();

    render(
      <Step4CustomerForm
        initialData={{ name: "", phone: "", email: "" }}
        onSubmitStep={handleSubmit}
        formId="test-customer-form"
      />
    );

    fireEvent.change(screen.getByLabelText(/Nama Lengkap Pelanggan/i), {
      target: { value: "Budi Santoso" },
    });
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp Aktif/i), {
      target: { value: "081234567890" },
    });
    fireEvent.change(screen.getByLabelText(/Alamat Email/i), {
      target: { value: "budi@gmail.com" },
    });

    const form = screen.getByRole("form", { name: "Form Data Pemilik" });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: "Budi Santoso",
        phone: "081234567890",
        email: "budi@gmail.com",
      });
    });
  });
});

describe("Step5PetForm Component", () => {
  it("memvalidasi nama hewan peliharaan", async () => {
    const handleSubmit = vi.fn();

    render(
      <Step5PetForm
        initialData={{ name: "", type: "Anjing" }}
        onSubmitStep={handleSubmit}
        formId="test-pet-form"
      />
    );

    const form = screen.getByRole("form", { name: "Form Data Anabul" });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Nama anabul wajib diisi/i)).toBeDefined();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("mengirim data anabul saat nama terisi", async () => {
    const handleSubmit = vi.fn();

    render(
      <Step5PetForm
        initialData={{ name: "", type: "Kucing" }}
        onSubmitStep={handleSubmit}
        formId="test-pet-form"
      />
    );

    fireEvent.change(screen.getByLabelText(/Nama Panggilan Anabul/i), {
      target: { value: "Luna" },
    });
    fireEvent.change(screen.getByLabelText(/Ras \/ Trah/i), {
      target: { value: "Persia" },
    });

    const form = screen.getByRole("form", { name: "Form Data Anabul" });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Luna",
          type: "Kucing",
          breed: "Persia",
        })
      );
    });
  });
});

describe("Step6ReviewConfirm Component", () => {
  it("merender rincian pesanan dan menangani submit", () => {
    const handleSubmit = vi.fn();
    const handleEditStep = vi.fn();

    render(
      <Step6ReviewConfirm
        service={mockServices[0]}
        date="2026-10-24"
        time="09:00"
        customer={{ name: "Budi Santoso", phone: "081234567890" }}
        pet={{ name: "Milo", type: "Anjing", breed: "Poodle" }}
        customerNotes="Jangan dipotong terlalu pendek"
        onChangeCustomerNotes={vi.fn()}
        onEditStep={handleEditStep}
        isSubmitting={false}
        errorMessage={null}
        onSubmit={handleSubmit}
        onSlotConflictRetry={vi.fn()}
      />
    );

    expect(screen.getByText("Grooming Lengkap Anjing Kecil")).toBeDefined();
    expect(screen.getByText("Budi Santoso")).toBeDefined();
    expect(screen.getByText("Pukul 09:00 WIB")).toBeDefined();
    expect(screen.getByText("Pay at Location")).toBeDefined();

    const submitBtn = screen.getByRole("button", { name: /Konfirmasi & Buat Reservasi/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalled();
  });

  it("menampilkan pesan error jika slot bertabrakan", () => {
    render(
      <Step6ReviewConfirm
        service={mockServices[0]}
        date="2026-10-24"
        time="09:00"
        customer={{ name: "Budi", phone: "081234567890" }}
        pet={{ name: "Milo", type: "Anjing" }}
        customerNotes=""
        onChangeCustomerNotes={vi.fn()}
        onEditStep={vi.fn()}
        isSubmitting={false}
        errorMessage="Slot waktu yang dipilih sudah terisi."
        onSubmit={vi.fn()}
        onSlotConflictRetry={vi.fn()}
      />
    );

    expect(screen.getByText("Slot waktu yang dipilih sudah terisi.")).toBeDefined();
    expect(screen.getByRole("button", { name: /Pilih Jam Lain/i })).toBeDefined();
  });
});

describe("BookingConfirmationCard Component", () => {
  it("merender kode booking dan tautan kelola reservasi", () => {
    render(
      <BookingConfirmationCard
        booking={mockManagedBooking}
        bookingCode="GRM-20261023-ABCD"
        token="raw-token-123"
        business={mockBusiness}
      />
    );

    expect(screen.getByText("GRM-20261023-ABCD")).toBeDefined();
    expect(screen.getByText("Reservasi Berhasil Dibuat")).toBeDefined();
    expect(screen.getByText(/Jl. Senopati No. 42/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Salin Link Reservasi/i })).toBeDefined();
  });
});

describe("BookingManageCard Component", () => {
  it("merender status badge dot dan data reservasi tamu", () => {
    render(
      <BookingManageCard
        booking={mockManagedBooking}
        business={mockBusiness}
      />
    );

    expect(screen.getByText("GRM-20261023-ABCD")).toBeDefined();
    expect(screen.getByText("Terkonfirmasi")).toBeDefined();
    expect(screen.getByText("Milo (Anjing)")).toBeDefined();
    expect(screen.getByText(/Bantuan WhatsApp Cepat/i)).toBeDefined();
  });
});

describe("BookingWizard Component", () => {
  it("merender wizard langkah 1 dan mengaktifkan tombol lanjut saat layanan dipilih", () => {
    render(<BookingWizard services={mockServices} />);

    expect(screen.getByText("Pilih Paket Layanan Grooming")).toBeDefined();

    const lanjutBtn = screen.getByRole("button", { name: /Lanjut ke Tanggal/i });
    expect((lanjutBtn as HTMLButtonElement).disabled).toBe(true);

    const serviceCard = screen.getByText("Grooming Lengkap Anjing Kecil").closest("[role='radio']");
    if (serviceCard) {
      fireEvent.click(serviceCard);
      expect((lanjutBtn as HTMLButtonElement).disabled).toBe(false);
    }
  });

  it("auto-select layanan jika initialServiceId diberikan", () => {
    render(
      <BookingWizard
        services={mockServices}
        initialServiceId="svc-2"
      />
    );

    const lanjutBtn = screen.getByRole("button", { name: /Lanjut ke Tanggal/i });
    expect((lanjutBtn as HTMLButtonElement).disabled).toBe(false);
  });
});
