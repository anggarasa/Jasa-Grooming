// @vitest-environment jsdom
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { getClosedDaysOfWeek } from "@/components/booking/closed-days";
import { Step2DateSelect } from "@/components/booking/Step2DateSelect";
import { BookingWizard } from "@/components/booking/BookingWizard";
import type { PublicServiceItem } from "@backend/modules/public/public-services.service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// "Hari ini" = Jumat, 23 Okt 2026 (WIB). Chip: [0]=Jum 23, [1]=Sab 24, [2]=Min 25, [3]=Sen 26 … [9]=Min 1 Nov.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-23T05:00:00Z"));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("getClosedDaysOfWeek (pengaman data jam operasional)", () => {
  const day = (dayOfWeek: number, isOpen: boolean) => ({ dayOfWeek, isOpen });
  const week = (closed: number[]) => [0, 1, 2, 3, 4, 5, 6].map((d) => day(d, !closed.includes(d)));

  it("mengembalikan hari yang libur, terurut", () => {
    expect(getClosedDaysOfWeek(week([5, 0]))).toEqual([0, 5]);
    expect(getClosedDaysOfWeek(week([]))).toEqual([]);
  });

  it("data kosong/tidak ada: tidak menandai apa pun", () => {
    expect(getClosedDaysOfWeek(undefined)).toEqual([]);
    expect(getClosedDaysOfWeek(null)).toEqual([]);
    expect(getClosedDaysOfWeek([])).toEqual([]);
  });

  it("semua hari tutup dianggap data tidak tepercaya (mis. database gagal) → tidak memblokir pelanggan", () => {
    expect(getClosedDaysOfWeek(week([0, 1, 2, 3, 4, 5, 6]))).toEqual([]);
  });

  it("mengabaikan nomor hari tidak valid dan duplikat", () => {
    expect(getClosedDaysOfWeek([day(9, false), day(-1, false), day(0, false), day(0, false), day(1, true)])).toEqual([0]);
  });
});

function DateHarness({ closed, onSelect }: { closed?: number[]; onSelect?: (d: string) => void }) {
  const [date, setDate] = React.useState("");
  return (
    <Step2DateSelect
      selectedDate={date}
      closedDaysOfWeek={closed}
      onSelectDate={(d) => {
        onSelect?.(d);
        setDate(d);
      }}
    />
  );
}
const chips = () => within(screen.getByRole("radiogroup", { name: /Pilihan Cepat/i })).getAllByRole("radio") as HTMLButtonElement[];
const dateInput = () => screen.getByLabelText(/Atau Pilih Tanggal Melalui Kalender:/i) as HTMLInputElement;

describe("Tahap 2 — hari libur ditandai", () => {
  it("chip hari libur diberi label 'Libur', dinonaktifkan, dan tidak bisa dipilih", () => {
    const onSelect = vi.fn();
    render(<DateHarness closed={[0]} onSelect={onSelect} />);
    expect(chips()[2].disabled).toBe(true); // Minggu 25 Okt
    expect(chips()[9].disabled).toBe(true); // Minggu 1 Nov
    expect(within(chips()[2]).getByText("Libur")).toBeDefined();
    expect(chips().filter((c) => c.disabled)).toHaveLength(2);
    expect(screen.getByText(/berarti salon tutup dan tidak dapat dipilih/i)).toBeDefined();

    fireEvent.click(chips()[2]);
    expect(onSelect).not.toHaveBeenCalled();
    expect(chips().filter((c) => c.getAttribute("aria-checked") === "true")).toHaveLength(0);
  });

  it("tanpa data hari libur: tidak ada yang ditandai dan tidak ada keterangan", () => {
    render(<DateHarness />);
    expect(chips().filter((c) => c.disabled)).toHaveLength(0);
    expect(screen.queryByText("Libur")).toBeNull();
    expect(screen.queryByText(/berarti salon tutup/i)).toBeNull();
  });

  it("panah keyboard melewati chip libur; Home/End memilih chip terbuka terdekat", () => {
    const onSelect = vi.fn();
    render(<DateHarness closed={[0, 5]} onSelect={onSelect} />); // Minggu & Jumat libur → [0] dan [2] dan [7] libur
    expect(chips()[0].disabled).toBe(true); // Jumat 23 (hari ini) libur
    expect(chips().filter((c) => c.tabIndex === 0)).toEqual([chips()[1]]); // chip pertama yang terbuka bisa difokus

    chips()[1].focus();
    fireEvent.keyDown(chips()[1], { key: "ArrowRight" }); // Sab 24 → (Min 25 libur) → Sen 26
    expect(onSelect).toHaveBeenLastCalledWith("2026-10-26");
    expect(document.activeElement).toBe(chips()[3]);

    fireEvent.keyDown(chips()[3], { key: "ArrowLeft" }); // Sen 26 → (Min libur) → Sab 24
    expect(onSelect).toHaveBeenLastCalledWith("2026-10-24");

    fireEvent.keyDown(chips()[1], { key: "Home" }); // chip 0 libur → chip 1
    expect(onSelect).toHaveBeenLastCalledWith("2026-10-24");
    fireEvent.keyDown(chips()[1], { key: "End" }); // chip terakhir Jumat 6 Nov libur → Kamis 5 Nov
    expect(onSelect).toHaveBeenLastCalledWith("2026-11-05");
  });

  it("tanggal libur yang diketik di kalender ditolak dengan pesan dan pilihan dikosongkan", () => {
    const onSelect = vi.fn();
    render(<DateHarness closed={[0]} onSelect={onSelect} />);
    fireEvent.click(chips()[3]); // Sen 26 Okt dipilih
    expect(screen.getByText("Tanggal Terpilih")).toBeDefined();

    fireEvent.change(dateInput(), { target: { value: "2026-11-08" } }); // Minggu
    expect(onSelect).toHaveBeenLastCalledWith("");
    expect(screen.getByRole("alert").textContent).toContain("Salon tutup pada hari Minggu");
    expect(dateInput().getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByText("Tanggal Terpilih")).toBeNull();

    fireEvent.change(dateInput(), { target: { value: "2026-11-09" } }); // Senin → valid
    expect(onSelect).toHaveBeenLastCalledWith("2026-11-09");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

/* -------- Alur wizard: hari libur + Data Pemilik -------- */

const service = {
  id: "svc-1", name: "Basic Cat Grooming", slug: "basic-cat-grooming", description: "Mandi bersih.", shortDescription: "Mandi bersih.",
  fullDescription: null, durationMinutes: 60, bufferMinutes: 15, price: 85000, formattedPrice: "Rp 85.000", imageObjectKey: null, displayOrder: 1,
  category: { id: "c1", name: "Grooming Kucing", slug: "grooming-kucing" }, createdAt: new Date(0), updatedAt: new Date(0),
} as PublicServiceItem;

function stubSlots() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, slots: [{ time: "09:00", available: true }], data: { isOpen: true } }),
    }))
  );
}
const btn = (re: RegExp) => screen.getByRole("button", { name: re }) as HTMLButtonElement;

describe("Wizard — hari libur dari data jam operasional", () => {
  it("meneruskan hari libur ke pilihan tanggal; hari libur tidak bisa dilanjutkan", () => {
    stubSlots();
    render(<BookingWizard services={[service]} closedDaysOfWeek={[0]} />);
    fireEvent.click(screen.getByText("Basic Cat Grooming"));
    fireEvent.click(btn(/Lanjut ke Tanggal/i));

    expect(chips()[2].disabled).toBe(true);
    fireEvent.click(chips()[2]);
    expect(btn(/Lanjut ke Jam/i).disabled).toBe(true);
    fireEvent.click(chips()[3]);
    expect(btn(/Lanjut ke Jam/i).disabled).toBe(false);
  });
});

describe("Tahap 4 — Data Pemilik dalam alur wizard", () => {
  async function toStep4() {
    stubSlots();
    render(<BookingWizard services={[service]} />);
    fireEvent.click(screen.getByText("Basic Cat Grooming"));
    fireEvent.click(btn(/Lanjut ke Tanggal/i));
    fireEvent.click(chips()[1]);
    fireEvent.click(btn(/Lanjut ke Jam/i));
    await waitFor(() => expect(screen.getByRole("radio", { name: "09:00" })).toBeDefined());
    fireEvent.click(screen.getByRole("radio", { name: "09:00" }));
    fireEvent.click(btn(/Lanjut ke Data Pemilik/i));
    expect(screen.getByText("Data Pemilik & Kontak")).toBeDefined();
  }

  it("form kosong: validasi muncul dan tidak pindah tahap", async () => {
    await toStep4();
    fireEvent.click(btn(/Lanjut ke Data Anabul/i));
    await waitFor(() => expect(screen.getByText(/Nama pelanggan minimal 2 karakter/i)).toBeDefined());
    expect(screen.getByText(/Nomor telepon minimal 8 digit/i)).toBeDefined();
    expect(screen.getByLabelText(/Nama Lengkap Pelanggan/i).getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByText("Profil Anabul Kesayangan")).toBeNull();
  });

  it("form valid lanjut ke Data Anabul dan data pemilik tetap saat kembali", async () => {
    await toStep4();
    fireEvent.change(screen.getByLabelText(/Nama Lengkap Pelanggan/i), { target: { value: "  Sarah Wijaya " } });
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp Aktif/i), { target: { value: "081234567890" } });
    fireEvent.click(btn(/Lanjut ke Data Anabul/i));
    await waitFor(() => expect(screen.getByText("Profil Anabul Kesayangan")).toBeDefined());

    fireEvent.click(btn(/^Kembali/));
    await waitFor(() => expect(screen.getByText("Data Pemilik & Kontak")).toBeDefined());
    expect((screen.getByLabelText(/Nama Lengkap Pelanggan/i) as HTMLInputElement).value).toBe("Sarah Wijaya");
    expect((screen.getByLabelText(/Nomor WhatsApp Aktif/i) as HTMLInputElement).value).toBe("081234567890");
  });

  it("kalimat bantuan tidak lagi menjanjikan pengiriman otomatis; id dan atribut input tetap", async () => {
    await toStep4();
    expect(screen.queryByText(/mengirimkan status jadwal/i)).toBeNull();
    expect(screen.getByText(/salon dapat menghubungi Anda/i)).toBeDefined();
    const name = screen.getByLabelText(/Nama Lengkap Pelanggan/i) as HTMLInputElement;
    const phone = screen.getByLabelText(/Nomor WhatsApp Aktif/i) as HTMLInputElement;
    const email = screen.getByLabelText(/Alamat Email/i) as HTMLInputElement;
    expect([name.id, phone.id, email.id]).toEqual(["customer-name", "customer-phone", "customer-email"]);
    expect([name.name, phone.name, email.name]).toEqual(["name", "phone", "email"]);
    expect(name.autocomplete).toBe("name");
    expect(phone.type).toBe("tel");
    expect(phone.autocomplete).toBe("tel");
    expect(email.autocomplete).toBe("email");
    expect(screen.getByText("Opsional")).toBeDefined();
  });
});
