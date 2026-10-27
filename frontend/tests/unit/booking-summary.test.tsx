// @vitest-environment jsdom
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { BookingWizard } from "@/components/booking/BookingWizard";
import type { PublicServiceItem } from "@backend/modules/public/public-services.service";

const mockPush = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-23T05:00:00Z")); // Jumat 23 Okt 2026 (WIB)
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const mk = (id: string, name: string, price: number, minutes: number): PublicServiceItem =>
  ({
    id, name, slug: id, description: `Deskripsi ${name}`, shortDescription: `Singkat ${name}`, fullDescription: null,
    durationMinutes: minutes, bufferMinutes: 15, price, formattedPrice: `Rp ${price}`, imageObjectKey: null, displayOrder: 1,
    category: { id: "c1", name: "Grooming Kucing", slug: "grooming-kucing" }, createdAt: new Date(0), updatedAt: new Date(0),
  }) as PublicServiceItem;
const SERVICES = [mk("svc-1", "Basic Cat Grooming", 85000, 60), mk("svc-2", "Complete Cat Spa", 135000, 90)];

const btn = (re: RegExp) => screen.getByRole("button", { name: re }) as HTMLButtonElement;
const chips = () => within(screen.getByRole("radiogroup", { name: /Pilihan Cepat/i })).getAllByRole("radio");
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
// formatIDR memakai spasi tak-terputus (NBSP) setelah "Rp"; samakan agar mudah dicocokkan.
const text = () => (document.body.textContent ?? "").replace(/\u00a0/g, " ");
const heading = (re: RegExp) => screen.getByRole("heading", { level: 2, name: re });

type BookingResponder = (init: RequestInit, n: number) => unknown;
function stubFetch(onBooking: BookingResponder = () => ({ ok: true, json: async () => ({ success: true, bookingCode: "GRM-1", manageToken: "t" }) })) {
  let n = 0;
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    if (String(url).startsWith("/api/bookings")) return onBooking(init ?? {}, ++n);
    return {
      ok: true,
      json: async () => ({ success: true, slots: [{ time: "09:00", available: true }, { time: "09:30", available: true }], data: { isOpen: true } }),
    };
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}
const posts = (f: ReturnType<typeof vi.fn>) => f.mock.calls.filter((c) => String(c[0]).startsWith("/api/bookings"));

/** Mengisi seluruh alur sampai halaman Konfirmasi dengan data yang berbeda-beda. */
async function toSummary() {
  render(<BookingWizard services={SERVICES} />);
  fireEvent.click(screen.getByText("Basic Cat Grooming"));
  fireEvent.click(btn(/Lanjut ke Tanggal/i));
  fireEvent.click(chips()[1]); // Sabtu 24 Okt
  fireEvent.click(btn(/Lanjut ke Jam/i));
  await waitFor(() => expect(screen.getByRole("radio", { name: "09:00" })).toBeDefined());
  fireEvent.click(screen.getByRole("radio", { name: "09:00" }));
  fireEvent.click(btn(/Lanjut ke Data Pemilik/i));
  type(screen.getByLabelText(/Nama Lengkap Pelanggan/i), "Sarah Wijaya");
  type(screen.getByLabelText(/Nomor WhatsApp Aktif/i), "081234567890");
  type(screen.getByLabelText(/Alamat Email/i), "sarah@gmail.com");
  fireEvent.click(btn(/Lanjut ke Data Anabul/i));
  await waitFor(() => expect(screen.getByText("Profil Anabul Kesayangan")).toBeDefined());
  type(screen.getByLabelText(/Nama Panggilan Anabul/i), "Milo");
  fireEvent.click(within(screen.getByRole("radiogroup", { name: /Jenis Anabul/i })).getByRole("radio", { name: "Kucing" }));
  type(screen.getByLabelText(/Ras \/ Trah/i), "Persia");
  type(screen.getByLabelText(/Usia \(Tahun\)/i), "3");
  type(screen.getByLabelText(/Catatan Khusus/i), "Pemalu");
  fireEvent.click(btn(/Lanjut ke Konfirmasi/i));
  await waitFor(() => expect(heading(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());
}

describe("Ringkasan — kesesuaian dengan tahap sebelumnya", () => {
  it("setiap nilai berasal dari isian pengguna dan data layanan (bukan teks statis)", async () => {
    stubFetch();
    await toSummary();
    const t = text();
    expect(screen.getByText("Basic Cat Grooming")).toBeDefined();
    expect(t).toContain("Rp 85.000");
    expect(screen.getByText("Estimasi Durasi 60 Menit")).toBeDefined();
    expect(screen.getByText("Sabtu, 24 Oktober 2026")).toBeDefined();
    expect(screen.getByText("Pukul 09:00 WIB")).toBeDefined();
    expect(screen.getByText("Sarah Wijaya")).toBeDefined();
    expect(screen.getByText("081234567890")).toBeDefined();
    expect(screen.getByText("sarah@gmail.com")).toBeDefined();
    expect(screen.getByText(/Milo/).textContent).toContain("(Kucing)");
    expect(screen.getByText("Persia")).toBeDefined();
    expect(screen.getByText("3 Tahun")).toBeDefined();
    expect(screen.getByText(/Pemalu/)).toBeDefined();
  });

  it("penjelasan sebelum konfirmasi tersedia, tanpa menjanjikan status tertentu", async () => {
    stubFetch();
    await toSummary();
    const info = screen.getByRole("region", { name: /Setelah Anda menekan konfirmasi/i });
    expect(info.textContent).toMatch(/kode booking/i);
    expect(info.textContent).toMatch(/tautan/i);
    expect(info.textContent).toMatch(/bayar di lokasi/i);
    // status akhir ditentukan pengaturan salon: jangan menjanjikan "pasti terkonfirmasi" / "menunggu"
    expect(info.textContent).not.toMatch(/pasti|otomatis terkonfirmasi|menunggu konfirmasi/i);
  });
});

describe("Ringkasan — kembali, mengubah data, dan tidak ada data lama", () => {
  it("Ubah data pemilik: kembali langsung ke Konfirmasi dengan data baru, data lama hilang", async () => {
    stubFetch();
    await toSummary();
    fireEvent.click(screen.getByRole("button", { name: /Ubah data pemilik/i }));
    await waitFor(() => expect(heading(/Data Pemilik & Kontak/i)).toBeDefined());
    expect(screen.getByText(/sedang mengubah data/i)).toBeDefined();

    type(screen.getByLabelText(/Nama Lengkap Pelanggan/i), "Budi Santoso");
    type(screen.getByLabelText(/Nomor WhatsApp Aktif/i), "085511223344");
    fireEvent.click(btn(/Simpan & Kembali ke Konfirmasi/i));

    await waitFor(() => expect(heading(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());
    expect(screen.getByText("Budi Santoso")).toBeDefined();
    expect(screen.getByText("085511223344")).toBeDefined();
    expect(text()).not.toContain("Sarah Wijaya");
    expect(text()).not.toContain("081234567890");
    // data lain tidak hilang dan tidak perlu diisi ulang
    expect(screen.getByText(/Milo/)).toBeDefined();
    expect(screen.getByText("Pukul 09:00 WIB")).toBeDefined();
  });

  it("Ubah data anabul: data baru tampil, data lama (nama, usia, ras) hilang", async () => {
    stubFetch();
    await toSummary();
    fireEvent.click(screen.getByRole("button", { name: /Ubah data anabul/i }));
    await waitFor(() => expect(heading(/Profil Anabul Kesayangan/i)).toBeDefined());
    type(screen.getByLabelText(/Nama Panggilan Anabul/i), "Luna");
    type(screen.getByLabelText(/Ras \/ Trah/i), "");
    type(screen.getByLabelText(/Usia \(Tahun\)/i), "");
    fireEvent.click(btn(/Lanjut ke Konfirmasi/i));

    await waitFor(() => expect(heading(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());
    expect(screen.getByText(/Luna/)).toBeDefined();
    expect(text()).not.toContain("Milo");
    expect(text()).not.toContain("Persia");
    expect(text()).not.toMatch(/Usia:/);
  });

  it("Ubah jadwal: tanggal baru → jam baru → kembali langsung ke Konfirmasi; tanggal dan jam lama hilang", async () => {
    stubFetch();
    await toSummary();
    fireEvent.click(screen.getByRole("button", { name: /Ubah jadwal grooming/i }));
    await waitFor(() => expect(heading(/Pilih Tanggal Reservasi/i)).toBeDefined());
    fireEvent.click(chips()[3]); // Senin 26 Okt
    fireEvent.click(btn(/Lanjut ke Jam/i)); // jam lama sudah dihapus → harus memilih jam lagi
    await waitFor(() => expect(screen.getByRole("radio", { name: "09:30" })).toBeDefined());
    expect(screen.getByRole("radio", { name: "09:00" }).getAttribute("aria-checked")).toBe("false");
    fireEvent.click(screen.getByRole("radio", { name: "09:30" }));
    fireEvent.click(btn(/Simpan & Kembali ke Konfirmasi/i));

    await waitFor(() => expect(heading(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());
    expect(screen.getByText("Senin, 26 Oktober 2026")).toBeDefined();
    expect(screen.getByText("Pukul 09:30 WIB")).toBeDefined();
    expect(text()).not.toContain("Sabtu, 24 Oktober 2026");
    expect(text()).not.toContain("09:00 WIB");
    expect(screen.getByText("Sarah Wijaya")).toBeDefined();
  });

  it("Ubah paket layanan (baru): paket, harga, dan durasi baru tampil; jam dipilih ulang; yang lama hilang", async () => {
    stubFetch();
    await toSummary();
    fireEvent.click(screen.getByRole("button", { name: /Ubah paket layanan/i }));
    await waitFor(() => expect(heading(/Pilih Paket Layanan Grooming/i)).toBeDefined());
    fireEvent.click(screen.getByText("Complete Cat Spa"));
    fireEvent.click(btn(/Lanjut ke Tanggal/i));
    expect(chips()[1].getAttribute("aria-checked")).toBe("true"); // tanggal tetap
    fireEvent.click(btn(/Lanjut ke Jam/i));
    await waitFor(() => expect(screen.getByRole("radio", { name: "09:00" })).toBeDefined());
    expect(screen.getByRole("radio", { name: "09:00" }).getAttribute("aria-checked")).toBe("false"); // jam lama tidak terbawa
    fireEvent.click(screen.getByRole("radio", { name: "09:00" }));
    fireEvent.click(btn(/Simpan & Kembali ke Konfirmasi/i));

    await waitFor(() => expect(heading(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());
    expect(screen.getByText("Complete Cat Spa")).toBeDefined();
    expect(text()).toContain("Rp 135.000");
    expect(screen.getByText("Estimasi Durasi 90 Menit")).toBeDefined();
    expect(text()).not.toContain("Basic Cat Grooming");
    expect(text()).not.toContain("Estimasi Durasi 60 Menit");
  });

  it("jadwal belum lengkap (lompat lewat progres setelah ganti tanggal): tampil 'belum dipilih', tombol kirim nonaktif, tidak ada jam kosong", async () => {
    const fetchMock = stubFetch();
    await toSummary();
    fireEvent.click(screen.getByRole("button", { name: /Ubah jadwal grooming/i }));
    await waitFor(() => expect(heading(/Pilih Tanggal Reservasi/i)).toBeDefined());
    fireEvent.click(chips()[3]); // jam lama dihapus
    fireEvent.click(screen.getAllByRole("button", { name: /Langkah 6: Konfirmasi/i })[0]);
    await waitFor(() => expect(heading(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());

    expect(screen.getByText(/Jam belum dipilih/i)).toBeDefined();
    expect(text()).not.toMatch(/Pukul\s+WIB/);
    const submit = btn(/Konfirmasi & Buat Reservasi/i);
    expect(submit.disabled).toBe(true);
    expect(submit.getAttribute("aria-describedby")).toBeTruthy();
    expect(document.getElementById(submit.getAttribute("aria-describedby")!)!.textContent).toMatch(/lengkapi jadwal/i);
    fireEvent.click(submit);
    expect(posts(fetchMock)).toHaveLength(0);
  });

  it("jadwal lengkap: tombol kirim aktif dan tidak ada pesan 'belum dipilih'", async () => {
    stubFetch();
    await toSummary();
    expect(btn(/Konfirmasi & Buat Reservasi/i).disabled).toBe(false);
    expect(screen.queryByText(/belum dipilih/i)).toBeNull();
  });

  it("Kembali saat mengubah membatalkan mode ubah: label tombol kembali normal", async () => {
    stubFetch();
    await toSummary();
    fireEvent.click(screen.getByRole("button", { name: /Ubah data pemilik/i }));
    await waitFor(() => expect(heading(/Data Pemilik & Kontak/i)).toBeDefined());
    fireEvent.click(btn(/^Kembali/));
    await waitFor(() => expect(heading(/Pilih Waktu Kedatangan/i)).toBeDefined());
    expect(screen.queryByText(/sedang mengubah data/i)).toBeNull();
    await waitFor(() => expect(screen.getByRole("radio", { name: /^09:00/ }).getAttribute("aria-checked")).toBe("true"));
    expect(btn(/Lanjut ke Data Pemilik/i)).toBeDefined(); // label normal, bukan "Simpan & Kembali"
  });

  it("alur biasa (tanpa mengubah dari ringkasan) tidak berubah: label dan urutan tahap tetap", async () => {
    stubFetch();
    render(<BookingWizard services={SERVICES} />);
    expect(screen.queryByText(/sedang mengubah data/i)).toBeNull();
    fireEvent.click(screen.getByText("Basic Cat Grooming"));
    fireEvent.click(btn(/Lanjut ke Tanggal/i));
    fireEvent.click(chips()[1]);
    fireEvent.click(btn(/Lanjut ke Jam/i));
    await waitFor(() => expect(screen.getByRole("radio", { name: "09:00" })).toBeDefined());
    fireEvent.click(screen.getByRole("radio", { name: "09:00" }));
    expect(btn(/Lanjut ke Data Pemilik/i)).toBeDefined();
    expect(screen.queryByRole("button", { name: /Simpan & Kembali ke Konfirmasi/i })).toBeNull();
  });
});

describe("Ringkasan — pengiriman memakai data terbaru", () => {
  it("setelah mengubah pemilik dan jadwal, payload POST berisi data baru saja", async () => {
    const fetchMock = stubFetch();
    await toSummary();

    fireEvent.click(screen.getByRole("button", { name: /Ubah data pemilik/i }));
    await waitFor(() => expect(heading(/Data Pemilik & Kontak/i)).toBeDefined());
    type(screen.getByLabelText(/Nama Lengkap Pelanggan/i), "Budi Santoso");
    fireEvent.click(btn(/Simpan & Kembali ke Konfirmasi/i));
    await waitFor(() => expect(heading(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: /Ubah jadwal grooming/i }));
    await waitFor(() => expect(heading(/Pilih Tanggal Reservasi/i)).toBeDefined());
    fireEvent.click(chips()[3]);
    fireEvent.click(btn(/Lanjut ke Jam/i));
    await waitFor(() => expect(screen.getByRole("radio", { name: "09:30" })).toBeDefined());
    fireEvent.click(screen.getByRole("radio", { name: "09:30" }));
    fireEvent.click(btn(/Simpan & Kembali ke Konfirmasi/i));
    await waitFor(() => expect(heading(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());

    fireEvent.click(btn(/Konfirmasi & Buat Reservasi/i));
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    const body = JSON.parse((posts(fetchMock)[0][1] as RequestInit).body as string);
    expect(body.serviceId).toBe("svc-1");
    expect(body.date).toBe("2026-10-26");
    expect(body.time).toBe("09:30");
    expect(body.customer.name).toBe("Budi Santoso");
    expect(body.customer.phone).toBe("081234567890");
    expect(body.pet).toEqual({ name: "Milo", type: "Kucing", breed: "Persia", age: 3, notes: "Pemalu" });
    expect(JSON.stringify(body)).not.toContain("Sarah");
    expect(JSON.stringify(body)).not.toContain("2026-10-24");
  });

  it("bentrok slot: 'Pilih Jam Lain' → jam baru → langsung kembali ke Konfirmasi tanpa mengulang tahap lain", async () => {
    const fetchMock = stubFetch((_i, n) =>
      n === 1
        ? { ok: false, status: 409, json: async () => ({ success: false, error: { code: "SLOT_UNAVAILABLE", message: "Slot sudah terisi." } }) }
        : { ok: true, json: async () => ({ success: true, bookingCode: "GRM-9", manageToken: "t" }) }
    );
    await toSummary();
    fireEvent.click(btn(/Konfirmasi & Buat Reservasi/i));
    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
    fireEvent.click(btn(/Pilih Jam Lain/i));
    await waitFor(() => expect(heading(/Pilih Waktu Kedatangan/i)).toBeDefined());
    await waitFor(() => expect(screen.getByRole("radio", { name: "09:30" })).toBeDefined());
    fireEvent.click(screen.getByRole("radio", { name: "09:30" }));
    fireEvent.click(btn(/Simpan & Kembali ke Konfirmasi/i));
    await waitFor(() => expect(heading(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());
    expect(screen.getByText("Pukul 09:30 WIB")).toBeDefined();
    expect(screen.getByText("Sarah Wijaya")).toBeDefined();

    fireEvent.click(btn(/Konfirmasi & Buat Reservasi/i));
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(JSON.parse((posts(fetchMock)[1][1] as RequestInit).body as string).time).toBe("09:30");
  });
});
