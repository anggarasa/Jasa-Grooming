// @vitest-environment jsdom
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { Step6ReviewConfirm } from "@/components/booking/Step6ReviewConfirm";
import { BookingWizard } from "@/components/booking/BookingWizard";
import type { PublicServiceItem } from "@backend/modules/public/public-services.service";

const mockPush = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  mockPush.mockClear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-23T05:00:00Z"));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const service = {
  id: "svc-1", name: "Basic Cat Grooming", slug: "basic-cat-grooming", description: "Mandi bersih.", shortDescription: "Mandi bersih.",
  fullDescription: null, durationMinutes: 60, bufferMinutes: 15, price: 85000, formattedPrice: "Rp 85.000", imageObjectKey: null, displayOrder: 1,
  category: { id: "c1", name: "Grooming Kucing", slug: "grooming-kucing" }, createdAt: new Date(0), updatedAt: new Date(0),
} as PublicServiceItem;

type Props = React.ComponentProps<typeof Step6ReviewConfirm>;
function renderStep6(over: Partial<Props> = {}) {
  const props: Props = {
    service,
    date: "2026-10-24",
    time: "09:00",
    customer: { name: "Sarah Wijaya", phone: "081234567890", email: "sarah@gmail.com" },
    pet: { name: "Milo", type: "Anjing", breed: "Poodle", age: 2, notes: "Takut hair dryer" },
    customerNotes: "",
    onChangeCustomerNotes: vi.fn(),
    onEditStep: vi.fn(),
    isSubmitting: false,
    errorMessage: null,
    onSubmit: vi.fn(),
    onSlotConflictRetry: vi.fn(),
    ...over,
  };
  render(<Step6ReviewConfirm {...props} />);
  return props;
}

describe("Tahap 6 — ringkasan data aktual", () => {
  it("menampilkan paket, total, jadwal, anabul, pemilik, dan pembayaran dari data", () => {
    renderStep6();
    expect(screen.getByText("Basic Cat Grooming")).toBeDefined();
    expect(screen.getByText(/85\.000/)).toBeDefined();
    expect(screen.getByText("Sabtu, 24 Oktober 2026")).toBeDefined();
    expect(screen.getByText("Pukul 09:00 WIB")).toBeDefined();
    expect(screen.getByText("Estimasi Durasi 60 Menit")).toBeDefined();
    expect(screen.getByText(/Milo/).textContent).toContain("(Anjing)");
    expect(screen.getByText("Poodle")).toBeDefined();
    expect(screen.getByText("2 Tahun")).toBeDefined();
    expect(screen.getByText(/Takut hair dryer/)).toBeDefined();
    expect(screen.getByText("Sarah Wijaya")).toBeDefined();
    expect(screen.getByText("081234567890")).toBeDefined();
    expect(screen.getByText("sarah@gmail.com")).toBeDefined();
    expect(screen.getByText("Pay at Location")).toBeDefined();
  });

  it("bagian opsional tidak tampil bila kosong; usia 0 tampil, usia kosong tidak", () => {
    const { unmount } = render(<div />);
    unmount();
    renderStep6({ customer: { name: "Budi", phone: "0812" }, pet: { name: "Luna", type: "Kucing" } });
    expect(screen.queryByText(/Ras:/)).toBeNull();
    expect(screen.queryByText(/Usia:/)).toBeNull();
    expect(screen.queryByText(/sarah@/)).toBeNull();
    cleanup();
    renderStep6({ pet: { name: "Mochi", type: "Kucing", age: 0 } });
    expect(screen.getByText(/Usia:/).textContent).toContain("0 Tahun");
  });

  it("empat tombol 'Ubah' bernama berbeda dan menuju langkah yang benar (jadwal 2, anabul 5, pemilik 4, paket 1)", () => {
    const props = renderStep6();
    const edit = (name: RegExp) => screen.getByRole("button", { name });
    expect(screen.getAllByText("Ubah")).toHaveLength(4);
    fireEvent.click(edit(/Ubah jadwal grooming/i));
    fireEvent.click(edit(/Ubah data anabul/i));
    fireEvent.click(edit(/Ubah data pemilik/i));
    fireEvent.click(edit(/Ubah paket layanan/i));
    expect(vi.mocked(props.onEditStep).mock.calls.map((c) => c[0])).toEqual([2, 5, 4, 1]);
  });
});

describe("Tahap 6 — tombol kirim: normal, loading, disabled", () => {
  it("normal: aktif dan memanggil onSubmit satu kali per klik", () => {
    const props = renderStep6();
    const btn = screen.getByRole("button", { name: /Konfirmasi & Buat Reservasi/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.getAttribute("aria-busy")).toBe("false");
    fireEvent.click(btn);
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("memproses: tombol nonaktif, teks 'Memproses Reservasi...', diumumkan ke pembaca layar, klik tidak mengirim", () => {
    const props = renderStep6({ isSubmitting: true });
    const btn = screen.getByRole("button", { name: /Memproses Reservasi/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("status").textContent).toMatch(/Memproses reservasi/i);
    fireEvent.click(btn);
    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByText("Konfirmasi & Buat Reservasi")).toBeNull();
  });
});

describe("Tahap 6 — galat pengiriman", () => {
  it("bentrok slot: peringatan role=alert + tombol 'Pilih Jam Lain' memanggil pemulihan", () => {
    const props = renderStep6({ errorMessage: "Slot waktu yang dipilih sudah terisi." });
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("Reservasi Tidak Dapat Diproses")).toBeDefined();
    expect(within(alert).getByText("Slot waktu yang dipilih sudah terisi.")).toBeDefined();
    fireEvent.click(within(alert).getByRole("button", { name: /Pilih Jam Lain/i }));
    expect(props.onSlotConflictRetry).toHaveBeenCalledTimes(1);
  });

  it.each(["Slot waktu yang Anda pilih baru saja dipesan.", "Jadwal sudah terisi", "Slot bertabrakan dengan jadwal sibuk"])(
    "pesan bentrok '%s' menampilkan Pilih Jam Lain", (msg) => {
      renderStep6({ errorMessage: msg });
      expect(screen.getByRole("button", { name: /Pilih Jam Lain/i })).toBeDefined();
    });

  it("galat umum: peringatan tampil tanpa tombol Pilih Jam Lain, tombol kirim tetap aktif untuk mencoba lagi", () => {
    renderStep6({ errorMessage: "Gagal membuat reservasi." });
    expect(screen.getByRole("alert").textContent).toContain("Gagal membuat reservasi.");
    expect(screen.queryByRole("button", { name: /Pilih Jam Lain/i })).toBeNull();
    expect((screen.getByRole("button", { name: /Konfirmasi & Buat Reservasi/i }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("tanpa galat: tidak ada peringatan", () => {
    renderStep6();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("Tahap 6 — catatan tambahan", () => {
  it("id dan label dipertahankan; perubahan diteruskan; penghitung mengikuti isi", () => {
    const props = renderStep6({ customerNotes: "halo" });
    const ta = screen.getByLabelText(/Catatan Tambahan untuk Petugas Grooming/i) as HTMLTextAreaElement;
    expect(ta.id).toBe("booking-customer-notes");
    expect(ta.value).toBe("halo");
    expect(screen.getByText("4/500")).toBeDefined();
    fireEvent.change(ta, { target: { value: "halo dunia" } });
    expect(props.onChangeCustomerNotes).toHaveBeenCalledWith("halo dunia");
  });

  it("melebihi 500: penghitung memperingatkan, tidak memblokir tombol kirim (server tetap penentu)", () => {
    const props = renderStep6({ customerNotes: "x".repeat(501) });
    const counter = screen.getByText(/501\/500/);
    expect(counter.textContent).toMatch(/melebihi batas/i);
    expect(counter.className).toContain("text-destructive");
    expect((screen.getByLabelText(/Catatan Tambahan/i) as HTMLTextAreaElement).getAttribute("aria-invalid")).toBe("true");
    const btn = screen.getByRole("button", { name: /Konfirmasi & Buat Reservasi/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    fireEvent.click(btn);
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });
});

/* -------------------- Alur wizard: pengiriman nyata (fetch palsu) -------------------- */

const btn = (re: RegExp) => screen.getByRole("button", { name: re }) as HTMLButtonElement;
const chips = () => within(screen.getByRole("radiogroup", { name: /Pilihan Cepat/i })).getAllByRole("radio");
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

type BookingResponder = (init: RequestInit, n: number) => Promise<unknown> | unknown;

async function toStep6(onBooking: BookingResponder) {
  let bookingCalls = 0;
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (String(url).startsWith("/api/bookings")) {
      bookingCalls++;
      return onBooking(init ?? {}, bookingCalls);
    }
    return { ok: true, json: async () => ({ success: true, slots: [{ time: "09:00", available: true }], data: { isOpen: true } }) };
  });
  vi.stubGlobal("fetch", fetchMock);
  render(<BookingWizard services={[service]} />);
  fireEvent.click(screen.getByText("Basic Cat Grooming"));
  fireEvent.click(btn(/Lanjut ke Tanggal/i));
  fireEvent.click(chips()[1]);
  fireEvent.click(btn(/Lanjut ke Jam/i));
  await waitFor(() => expect(screen.getByRole("radio", { name: "09:00" })).toBeDefined());
  fireEvent.click(screen.getByRole("radio", { name: "09:00" }));
  fireEvent.click(btn(/Lanjut ke Data Pemilik/i));
  type(screen.getByLabelText(/Nama Lengkap Pelanggan/i), "Sarah Wijaya");
  type(screen.getByLabelText(/Nomor WhatsApp Aktif/i), "081234567890");
  fireEvent.click(btn(/Lanjut ke Data Anabul/i));
  await waitFor(() => expect(screen.getByText("Profil Anabul Kesayangan")).toBeDefined());
  type(screen.getByLabelText(/Nama Panggilan Anabul/i), "Milo");
  fireEvent.click(btn(/Lanjut ke Konfirmasi/i));
  await waitFor(() => expect(screen.getByText(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());
  return { fetchMock, bookingCalls: () => bookingCalls };
}
const bookingPosts = (f: ReturnType<typeof vi.fn>) => f.mock.calls.filter((c) => String(c[0]).startsWith("/api/bookings"));

describe("Tahap 6 — pengiriman di wizard", () => {
  it("sukses: satu POST dengan payload & Idempotency-Key yang benar, lalu menuju halaman konfirmasi", async () => {
    const { fetchMock } = await toStep6(() => ({ ok: true, json: async () => ({ success: true, bookingCode: "GRM-1", manageToken: "tok en" }) }));
    fireEvent.click(btn(/Konfirmasi & Buat Reservasi/i));
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(mockPush).toHaveBeenCalledWith("/booking/confirmation?code=GRM-1&token=tok%20en");

    const posts = bookingPosts(fetchMock);
    expect(posts).toHaveLength(1);
    const [, init] = posts[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBeTruthy();
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      serviceId: "svc-1",
      date: "2026-10-24",
      time: "09:00",
      customer: { name: "Sarah Wijaya", phone: "081234567890" },
      pet: { name: "Milo", type: "Anjing" }, // usia/ras/catatan kosong TIDAK dikirim
      notes: undefined,
      customerNotes: undefined,
    });
    expect(Object.keys(body.pet)).not.toContain("age");
  });

  it("sedang memproses: tombol nonaktif dan klik ganda hanya mengirim satu POST", async () => {
    let release: (v: unknown) => void = () => {};
    const pending = new Promise((res) => { release = res; });
    const { fetchMock } = await toStep6(() => pending);
    const confirm = btn(/Konfirmasi & Buat Reservasi/i);
    fireEvent.click(confirm);
    fireEvent.click(confirm); // klik ganda cepat
    await waitFor(() => expect(btn(/Memproses Reservasi/i).disabled).toBe(true));
    fireEvent.click(btn(/Memproses Reservasi/i));
    expect(bookingPosts(fetchMock)).toHaveLength(1);
    expect(mockPush).not.toHaveBeenCalled();
    release({ ok: true, json: async () => ({ success: true, bookingCode: "GRM-2", manageToken: "t" }) });
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
  });

  it("bentrok slot (409): peringatan + 'Pilih Jam Lain' kembali ke pilihan jam tanpa jam lama", async () => {
    const { fetchMock } = await toStep6(() => ({
      ok: false, status: 409,
      json: async () => ({ success: false, error: { code: "SLOT_UNAVAILABLE", message: "Slot waktu yang Anda pilih baru saja dipesan oleh pelanggan lain. Silakan pilih jam lain." } }),
    }));
    fireEvent.click(btn(/Konfirmasi & Buat Reservasi/i));
    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
    expect(screen.getByRole("alert").textContent).toContain("baru saja dipesan oleh pelanggan lain");
    expect((btn(/Konfirmasi & Buat Reservasi/i)).disabled).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.click(btn(/Pilih Jam Lain/i));
    await waitFor(() => expect(screen.getByText("Pilih Waktu Kedatangan")).toBeDefined());
    await waitFor(() => expect(screen.getByRole("radio", { name: "09:00" })).toBeDefined());
    expect(screen.getByRole("radio", { name: "09:00" }).getAttribute("aria-checked")).toBe("false");
    // setelah bentrok, tombol lanjut kini langsung kembali ke Konfirmasi (data lain sudah lengkap)
    expect(btn(/Simpan & Kembali ke Konfirmasi/i).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: /Lanjut ke Data Pemilik/i })).toBeNull();
    expect(bookingPosts(fetchMock)).toHaveLength(1);
  });

  it("galat umum: pesan tampil, tombol aktif lagi, percobaan ulang memakai Idempotency-Key baru", async () => {
    const { fetchMock } = await toStep6((_i, n) =>
      n === 1
        ? { ok: false, status: 500, json: async () => ({ success: false, message: "Gagal membuat reservasi." }) }
        : { ok: true, json: async () => ({ success: true, bookingCode: "GRM-3", manageToken: "t" }) }
    );
    fireEvent.click(btn(/Konfirmasi & Buat Reservasi/i));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Gagal membuat reservasi."));
    expect(screen.queryByRole("button", { name: /Pilih Jam Lain/i })).toBeNull();

    fireEvent.click(btn(/Konfirmasi & Buat Reservasi/i));
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    const keys = bookingPosts(fetchMock).map((c) => ((c[1] as RequestInit).headers as Record<string, string>)["Idempotency-Key"]);
    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(keys[1]);
  });

  it("jaringan putus: pesan ramah tampil dan pengguna bisa mencoba lagi", async () => {
    await toStep6(() => { throw new Error("Failed to fetch"); });
    fireEvent.click(btn(/Konfirmasi & Buat Reservasi/i));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Failed to fetch"));
    expect(btn(/Konfirmasi & Buat Reservasi/i).disabled).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("'Ubah' membawa ke langkah yang benar dan data tetap ada; kembali ke Konfirmasi tanpa kehilangan data", async () => {
    await toStep6(() => ({ ok: true, json: async () => ({ success: true }) }));
    fireEvent.click(screen.getByRole("button", { name: /Ubah data pemilik/i }));
    await waitFor(() => expect(screen.getByText("Data Pemilik & Kontak")).toBeDefined());
    expect((screen.getByLabelText(/Nama Lengkap Pelanggan/i) as HTMLInputElement).value).toBe("Sarah Wijaya");

    fireEvent.click(screen.getAllByRole("button", { name: /Langkah 6: Konfirmasi/i })[0]);
    await waitFor(() => expect(screen.getByText(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());
    expect(screen.getByText("Sarah Wijaya")).toBeDefined();
    expect(screen.getByText("Basic Cat Grooming")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /Ubah jadwal grooming/i }));
    await waitFor(() => expect(screen.getByText("Pilih Tanggal Reservasi")).toBeDefined());
  });
});
