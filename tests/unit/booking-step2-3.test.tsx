// @vitest-environment jsdom
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, cleanup } from "@testing-library/react";
import { Step2DateSelect } from "@/components/booking/Step2DateSelect";
import { Step3TimeSelect } from "@/components/booking/Step3TimeSelect";
import { BookingWizard } from "@/components/booking/BookingWizard";
import type { PublicServiceItem } from "@backend/modules/public/public-services.service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// "Hari ini" = Jumat, 23 Okt 2026 (WIB). Rentang: 23 Okt – 22 Nov 2026.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-23T05:00:00Z"));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------------------ */
/* Tahap 2 — Pilih Tanggal                                             */
/* ------------------------------------------------------------------ */

function DateHarness({ onSelect }: { onSelect?: (d: string) => void }) {
  const [date, setDate] = React.useState("");
  return (
    <Step2DateSelect
      selectedDate={date}
      onSelectDate={(d) => {
        onSelect?.(d);
        setDate(d);
      }}
    />
  );
}

const chips = () => within(screen.getByRole("radiogroup", { name: /Pilihan Cepat/i })).getAllByRole("radio");
const checkedChips = () => chips().filter((c) => c.getAttribute("aria-checked") === "true");
const dateInput = () => screen.getByLabelText(/Atau Pilih Tanggal Melalui Kalender:/i) as HTMLInputElement;

describe("Tahap 2 — tampilan dan pilihan tanggal", () => {
  it("menampilkan hari ini + 14 hari dengan label Hari Ini/Besok, tanpa scroll horizontal", () => {
    render(<DateHarness />);
    expect(chips()).toHaveLength(15);
    expect(chips()[0].textContent).toContain("Hari Ini");
    expect(chips()[0].textContent).toContain("23 Okt");
    expect(chips()[1].textContent).toContain("Besok");
    expect(chips()[14].textContent).toContain("6 Nov");

    const group = screen.getByRole("radiogroup", { name: /Pilihan Cepat/i });
    expect(group.className).toContain("grid");
    expect(group.className).not.toContain("overflow-x");
  });

  it("memilih tanggal: hanya satu tercentang, ada callout 'Tanggal Terpilih' dengan tanggal lengkap", () => {
    const onSelect = vi.fn();
    render(<DateHarness onSelect={onSelect} />);
    expect(screen.queryByText("Tanggal Terpilih")).toBeNull();

    fireEvent.click(chips()[1]);
    expect(onSelect).toHaveBeenCalledWith("2026-10-24");
    expect(checkedChips()).toEqual([chips()[1]]);
    const callout = screen.getByText("Tanggal Terpilih").closest("[role='status']")!;
    expect(callout.textContent).toContain("Sabtu, 24 Oktober 2026");
    expect(dateInput().value).toBe("2026-10-24"); // kalender ikut sinkron
  });

  it("mengganti tanggal: pilihan lama dilepas dan callout mengikuti tanggal baru", () => {
    render(<DateHarness />);
    fireEvent.click(chips()[1]);
    fireEvent.click(chips()[4]);
    expect(checkedChips()).toEqual([chips()[4]]);
    expect(screen.getByText("Tanggal Terpilih").closest("[role='status']")!.textContent).toContain("27 Oktober 2026");
  });

  it("navigasi keyboard: roving tabindex, panah/Home/End memindahkan fokus dan pilihan", () => {
    const onSelect = vi.fn();
    render(<DateHarness onSelect={onSelect} />);
    expect(chips().filter((c) => c.tabIndex === 0)).toEqual([chips()[0]]);

    chips()[0].focus();
    fireEvent.keyDown(chips()[0], { key: "ArrowRight" });
    expect(onSelect).toHaveBeenLastCalledWith("2026-10-24");
    expect(document.activeElement).toBe(chips()[1]);
    expect(chips().filter((c) => c.tabIndex === 0)).toEqual([chips()[1]]);

    fireEvent.keyDown(chips()[1], { key: "ArrowLeft" });
    expect(document.activeElement).toBe(chips()[0]);
    fireEvent.keyDown(chips()[0], { key: "ArrowLeft" }); // batas awal: tetap
    expect(document.activeElement).toBe(chips()[0]);

    fireEvent.keyDown(chips()[0], { key: "End" });
    expect(onSelect).toHaveBeenLastCalledWith("2026-11-06");
    expect(document.activeElement).toBe(chips()[14]);
    fireEvent.keyDown(chips()[14], { key: "Home" });
    expect(onSelect).toHaveBeenLastCalledWith("2026-10-23");

    // Enter/Spasi pada tombol berperan sebagai klik bawaan browser; tombol lain tidak memilih
    const calls = onSelect.mock.calls.length;
    fireEvent.keyDown(chips()[3], { key: "a" });
    expect(onSelect.mock.calls.length).toBe(calls);
  });
});

describe("Tahap 2 — input kalender dan tanggal di luar rentang", () => {
  it("tanggal valid diteruskan; atribut min/max sesuai rentang 30 hari WIB", () => {
    const onSelect = vi.fn();
    render(<DateHarness onSelect={onSelect} />);
    expect(dateInput().id).toBe("booking-date-input");
    expect(dateInput().min).toBe("2026-10-23");
    expect(dateInput().max).toBe("2026-11-22");

    fireEvent.change(dateInput(), { target: { value: "2026-11-10" } });
    expect(onSelect).toHaveBeenLastCalledWith("2026-11-10");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(checkedChips()).toHaveLength(0); // di luar 15 chip, tidak ada chip yang tercentang
    expect(screen.getByText("Tanggal Terpilih").closest("[role='status']")!.textContent).toContain("10 November 2026");
  });

  it("tanggal lampau atau melewati batas ditolak: pilihan dikosongkan dan muncul pesan", () => {
    const onSelect = vi.fn();
    render(<DateHarness onSelect={onSelect} />);
    fireEvent.click(chips()[2]);
    expect(screen.getByText("Tanggal Terpilih")).toBeDefined();

    fireEvent.change(dateInput(), { target: { value: "2026-10-20" } });
    expect(onSelect).toHaveBeenLastCalledWith("");
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("23 Oktober 2026");
    expect(alert.textContent).toContain("22 November 2026");
    expect(dateInput().getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByText("Tanggal Terpilih")).toBeNull();
    expect(checkedChips()).toHaveLength(0);
    expect(dateInput().value).toBe("2026-10-20"); // ketikan pengguna tidak dihapus paksa

    fireEvent.change(dateInput(), { target: { value: "2026-11-23" } });
    expect(onSelect).toHaveBeenLastCalledWith("");
    expect(screen.getByRole("alert")).toBeDefined();

    fireEvent.change(dateInput(), { target: { value: "2026-11-22" } }); // batas akhir masih valid
    expect(onSelect).toHaveBeenLastCalledWith("2026-11-22");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(dateInput().getAttribute("aria-invalid")).toBeNull();
  });

  it("mengosongkan input mengosongkan pilihan", () => {
    const onSelect = vi.fn();
    render(<DateHarness onSelect={onSelect} />);
    fireEvent.click(chips()[0]);
    fireEvent.change(dateInput(), { target: { value: "" } });
    expect(onSelect).toHaveBeenLastCalledWith("");
    expect(screen.queryByText("Tanggal Terpilih")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Tahap 3 — Pilih Jam                                                 */
/* ------------------------------------------------------------------ */

type ApiSlot = { time: string; available: boolean; reason?: string };

function mockAvailability(slots: ApiSlot[], isOpen = true) {
  const fn = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, date: "2026-10-24", slots, data: { isOpen } }),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const MIX: ApiSlot[] = [
  { time: "09:00", available: true },
  { time: "09:30", available: false, reason: "BOOKED" },
  { time: "10:00", available: false, reason: "BREAK" },
  { time: "10:30", available: true },
  { time: "11:00", available: false, reason: "Sudah terisi" }, // teks bebas/tidak dikenal
];

const slotRadio = (re: RegExp | string) => screen.getByRole("radio", { name: re }) as HTMLButtonElement;

describe("Tahap 3 — slot tersedia, terpilih, penuh, dan tidak tersedia", () => {
  it("membedakan keempat state dan tidak membuat slot sendiri", async () => {
    const fetchMock = mockAvailability(MIX);
    const onSelect = vi.fn();
    render(<Step3TimeSelect serviceId="svc-1" date="2026-10-24" selectedTime="10:30" onSelectTime={onSelect} />);
    await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(5));

    expect(fetchMock).toHaveBeenCalledWith("/api/availability?serviceId=svc-1&date=2026-10-24");
    expect(screen.getAllByRole("radio").map((r) => r.textContent?.slice(0, 5))).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);

    // tersedia
    expect(slotRadio("09:00").disabled).toBe(false);
    expect(slotRadio("09:00").getAttribute("aria-checked")).toBe("false");
    // terpilih
    expect(slotRadio(/^10:30/).getAttribute("aria-checked")).toBe("true");
    expect(within(slotRadio(/^10:30/)).getByText("Dipilih")).toBeDefined();
    // penuh
    expect(slotRadio(/09:30.*Penuh/).disabled).toBe(true);
    expect(within(slotRadio(/09:30.*Penuh/)).getByText("09:30").className).toContain("line-through");
    // tidak tersedia karena aturan / alasan tidak dikenal
    expect(slotRadio(/10:00.*Istirahat/).disabled).toBe(true);
    expect(slotRadio(/11:00.*Tidak tersedia/).disabled).toBe(true);

    // klik slot yang tidak tersedia tidak memilih apa pun
    fireEvent.click(slotRadio(/09:30.*Penuh/));
    fireEvent.click(slotRadio(/10:00.*Istirahat/));
    expect(onSelect).not.toHaveBeenCalled();

    // hitungan dan legenda
    expect(screen.getByText(/dari 5 slot waktu/).textContent).toContain("Tersedia 2 dari 5");
    const legend = screen.getByRole("list", { name: /Keterangan status slot/i });
    expect(within(legend).getByText("Tersedia")).toBeDefined();
    expect(within(legend).getByText("Dipilih")).toBeDefined();
    expect(within(legend).getByText("Penuh")).toBeDefined();
    expect(within(legend).getByText("Tidak tersedia")).toBeDefined();

    // ringkasan jam terpilih
    expect(screen.getByText("Pukul 10:30 WIB").closest("[role='status']")).not.toBeNull();
  });

  it("memilih slot tersedia memanggil onSelectTime; legenda hanya memuat state yang ada", async () => {
    mockAvailability([
      { time: "09:00", available: true },
      { time: "09:30", available: true },
    ]);
    const onSelect = vi.fn();
    render(<Step3TimeSelect serviceId="svc-1" date="2026-10-24" selectedTime="" onSelectTime={onSelect} />);
    await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(2));

    fireEvent.click(slotRadio("09:30"));
    expect(onSelect).toHaveBeenCalledWith("09:30");
    const legend = screen.getByRole("list", { name: /Keterangan status slot/i });
    expect(within(legend).queryByText("Penuh")).toBeNull();
    expect(within(legend).queryByText("Tidak tersedia")).toBeNull();
    expect(screen.queryByText(/Pukul .* WIB/)).toBeNull();
  });

  it("menampilkan tanggal yang sedang dilihat", async () => {
    mockAvailability(MIX);
    render(<Step3TimeSelect serviceId="svc-1" date="2026-10-24" selectedTime="" onSelectTime={vi.fn()} />);
    expect(screen.getByText("Sabtu, 24 Oktober 2026")).toBeDefined();
    await waitFor(() => expect(screen.getAllByRole("radio").length).toBeGreaterThan(0));
  });

  it("hari tutup: menampilkan pesan tutup tanpa daftar slot", async () => {
    mockAvailability([], false);
    render(<Step3TimeSelect serviceId="svc-1" date="2026-10-25" selectedTime="" onSelectTime={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Salon Tutup Pada Tanggal Terpilih")).toBeDefined());
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("semua slot penuh: tetap tampil sebagai Penuh dan tidak ada yang bisa dipilih", async () => {
    mockAvailability([
      { time: "09:00", available: false, reason: "BOOKED" },
      { time: "09:30", available: false, reason: "BOOKED" },
    ]);
    render(<Step3TimeSelect serviceId="svc-1" date="2026-10-24" selectedTime="" onSelectTime={vi.fn()} />);
    await waitFor(() => expect(screen.getAllByRole("radio")).toHaveLength(2));
    screen.getAllByRole("radio").forEach((r) => expect((r as HTMLButtonElement).disabled).toBe(true));
    expect(screen.getByText(/dari 2 slot waktu/).textContent).toContain("Tersedia 0 dari 2");
  });

  it("tidak ada slot sama sekali: menampilkan keadaan kosong", async () => {
    mockAvailability([]);
    render(<Step3TimeSelect serviceId="svc-1" date="2026-10-24" selectedTime="" onSelectTime={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Tidak Ada Slot Tersedia")).toBeDefined());
  });

  it("galat memuat: menampilkan pesan dan Coba Lagi memuat ulang", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ success: false, error: { message: "Server sibuk" } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, slots: [{ time: "09:00", available: true }], data: { isOpen: true } }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<Step3TimeSelect serviceId="svc-1" date="2026-10-24" selectedTime="" onSelectTime={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Gagal Memuat Ketersediaan Slot")).toBeDefined());
    expect(screen.getByText("Server sibuk")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Coba Lagi" }));
    await waitFor(() => expect(slotRadio("09:00")).toBeDefined());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("Tahap 3 — jam lama yang sudah tidak valid tidak dipertahankan", () => {
  it("jam tersimpan yang kini penuh dihapus", async () => {
    mockAvailability(MIX);
    const onSelect = vi.fn();
    render(<Step3TimeSelect serviceId="svc-1" date="2026-10-24" selectedTime="09:30" onSelectTime={onSelect} />);
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(""));
  });

  it("jam tersimpan yang tidak ada lagi dalam daftar dihapus", async () => {
    mockAvailability(MIX);
    const onSelect = vi.fn();
    render(<Step3TimeSelect serviceId="svc-1" date="2026-10-24" selectedTime="15:00" onSelectTime={onSelect} />);
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(""));
  });

  it("jam tersimpan yang masih tersedia dipertahankan", async () => {
    mockAvailability(MIX);
    const onSelect = vi.fn();
    render(<Step3TimeSelect serviceId="svc-1" date="2026-10-24" selectedTime="09:00" onSelectTime={onSelect} />);
    await waitFor(() => expect(slotRadio(/^09:00/).getAttribute("aria-checked")).toBe("true"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("hari tutup atau gagal memuat (tidak bisa diverifikasi) juga menghapus jam tersimpan", async () => {
    mockAvailability([], false);
    const closed = vi.fn();
    const { unmount } = render(<Step3TimeSelect serviceId="svc-1" date="2026-10-25" selectedTime="09:00" onSelectTime={closed} />);
    await waitFor(() => expect(closed).toHaveBeenCalledWith(""));
    unmount();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Jaringan putus")));
    const failed = vi.fn();
    render(<Step3TimeSelect serviceId="svc-1" date="2026-10-24" selectedTime="09:00" onSelectTime={failed} />);
    await waitFor(() => expect(failed).toHaveBeenCalledWith(""));
  });
});

/* ------------------------------------------------------------------ */
/* Alur wizard: tahap 1 → 2 → 3 dan kembali                            */
/* ------------------------------------------------------------------ */

const service = {
  id: "svc-1",
  name: "Basic Cat Grooming",
  slug: "basic-cat-grooming",
  description: "Mandi bersih.",
  shortDescription: "Mandi bersih.",
  fullDescription: null,
  durationMinutes: 60,
  bufferMinutes: 15,
  price: 85000,
  formattedPrice: "Rp 85.000",
  imageObjectKey: null,
  displayOrder: 1,
  category: { id: "c1", name: "Grooming Kucing", slug: "grooming-kucing" },
  createdAt: new Date(0),
  updatedAt: new Date(0),
} as PublicServiceItem;

function stubAvailabilityByDate(table: Record<string, { slots: ApiSlot[]; isOpen?: boolean }>) {
  const fn = vi.fn(async (url: string) => {
    const date = new URL(url, "http://x").searchParams.get("date") ?? "";
    const row = table[date] ?? { slots: [], isOpen: true };
    return { ok: true, json: async () => ({ success: true, date, slots: row.slots, data: { isOpen: row.isOpen ?? true } }) };
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const nextBtn = (name: RegExp) => screen.getByRole("button", { name }) as HTMLButtonElement;
const backBtn = () => screen.getByRole("button", { name: /^Kembali/ });
const dateChip = (label: RegExp) => within(screen.getByRole("radiogroup", { name: /Pilihan Cepat/i })).getByRole("radio", { name: label });

async function goToStep2() {
  fireEvent.click(screen.getByText("Basic Cat Grooming"));
  fireEvent.click(nextBtn(/Lanjut ke Tanggal/i));
  expect(screen.getByText("Pilih Tanggal Reservasi")).toBeDefined();
}

describe("Alur booking: tanggal → jam", () => {
  it("Lanjut ke Jam nonaktif sampai tanggal dipilih; Kembali ke tahap 1 mempertahankan paket", async () => {
    stubAvailabilityByDate({});
    render(<BookingWizard services={[service]} />);
    await goToStep2();

    expect(nextBtn(/Lanjut ke Jam/i).disabled).toBe(true);
    fireEvent.click(nextBtn(/Lanjut ke Jam/i)); // klik saat nonaktif tidak pindah
    expect(screen.getByText("Pilih Tanggal Reservasi")).toBeDefined();

    fireEvent.click(backBtn());
    expect(screen.getByText("Pilih Paket Layanan Grooming")).toBeDefined();
    expect(screen.getByRole("radio", { name: /Basic Cat Grooming/ }).getAttribute("aria-checked")).toBe("true");
  });

  it("memilih tanggal → melihat slot → memilih jam mengaktifkan Lanjut ke Data Pemilik", async () => {
    const fetchMock = stubAvailabilityByDate({
      "2026-10-24": { slots: [{ time: "09:00", available: true }, { time: "09:30", available: false, reason: "BOOKED" }] },
    });
    render(<BookingWizard services={[service]} />);
    await goToStep2();

    fireEvent.click(dateChip(/Besok/));
    expect(nextBtn(/Lanjut ke Jam/i).disabled).toBe(false);
    fireEvent.click(nextBtn(/Lanjut ke Jam/i));

    await waitFor(() => expect(slotRadio("09:00")).toBeDefined());
    expect(fetchMock).toHaveBeenCalledWith("/api/availability?serviceId=svc-1&date=2026-10-24");
    expect(nextBtn(/Lanjut ke Data Pemilik/i).disabled).toBe(true);

    fireEvent.click(slotRadio("09:00"));
    expect(nextBtn(/Lanjut ke Data Pemilik/i).disabled).toBe(false);

    fireEvent.click(nextBtn(/Lanjut ke Data Pemilik/i));
    expect(screen.getByText("Data Pemilik & Kontak")).toBeDefined();
  });

  it("Kembali dari jam ke tanggal mempertahankan tanggal; mengganti tanggal menghapus jam lama", async () => {
    stubAvailabilityByDate({
      "2026-10-24": { slots: [{ time: "09:00", available: true }] },
      "2026-10-26": { slots: [{ time: "09:00", available: true }, { time: "10:00", available: true }] },
    });
    render(<BookingWizard services={[service]} />);
    await goToStep2();

    fireEvent.click(dateChip(/Besok/)); // 24 Okt
    fireEvent.click(nextBtn(/Lanjut ke Jam/i));
    await waitFor(() => expect(slotRadio("09:00")).toBeDefined());
    fireEvent.click(slotRadio("09:00"));
    expect(nextBtn(/Lanjut ke Data Pemilik/i).disabled).toBe(false);

    fireEvent.click(backBtn());
    expect(screen.getByText("Pilih Tanggal Reservasi")).toBeDefined();
    expect(dateChip(/Besok/).getAttribute("aria-checked")).toBe("true");
    expect(nextBtn(/Lanjut ke Jam/i).disabled).toBe(false);

    // ganti ke 26 Okt → jam 09:00 milik 24 Okt TIDAK boleh ikut terbawa
    fireEvent.click(dateChip(/26 Okt/));
    expect(dateChip(/Besok/).getAttribute("aria-checked")).toBe("false");
    fireEvent.click(nextBtn(/Lanjut ke Jam/i));
    await waitFor(() => expect(slotRadio("10:00")).toBeDefined());
    expect(screen.getAllByRole("radio").every((r) => r.getAttribute("aria-checked") === "false")).toBe(true);
    expect(nextBtn(/Lanjut ke Data Pemilik/i).disabled).toBe(true);
  });

  it("tanggal tidak tersedia (salon tutup): pesan tutup dan Lanjut tetap nonaktif", async () => {
    stubAvailabilityByDate({ "2026-10-25": { slots: [], isOpen: false } });
    render(<BookingWizard services={[service]} />);
    await goToStep2();

    fireEvent.click(dateChip(/25 Okt/));
    fireEvent.click(nextBtn(/Lanjut ke Jam/i));
    await waitFor(() => expect(screen.getByText("Salon Tutup Pada Tanggal Terpilih")).toBeDefined());
    expect(nextBtn(/Lanjut ke Data Pemilik/i).disabled).toBe(true);

    fireEvent.click(backBtn()); // kembali memilih tanggal lain
    expect(screen.getByText("Pilih Tanggal Reservasi")).toBeDefined();
  });

  it("kembali lalu maju tanpa mengganti tanggal: jam yang masih tersedia tetap, yang sudah penuh dihapus", async () => {
    const table: Parameters<typeof stubAvailabilityByDate>[0] = {
      "2026-10-24": { slots: [{ time: "09:00", available: true }, { time: "10:00", available: true }] },
    };
    stubAvailabilityByDate(table);
    render(<BookingWizard services={[service]} />);
    await goToStep2();
    fireEvent.click(dateChip(/Besok/));
    fireEvent.click(nextBtn(/Lanjut ke Jam/i));
    await waitFor(() => expect(slotRadio("09:00")).toBeDefined());
    fireEvent.click(slotRadio("09:00"));

    // maju-mundur tanpa mengubah tanggal; slot masih tersedia → tetap terpilih
    fireEvent.click(backBtn());
    fireEvent.click(nextBtn(/Lanjut ke Jam/i));
    await waitFor(() => expect(slotRadio(/^09:00/).getAttribute("aria-checked")).toBe("true"));
    expect(nextBtn(/Lanjut ke Data Pemilik/i).disabled).toBe(false);

    // sementara itu 09:00 diambil orang lain → saat dimuat ulang, pilihan dihapus
    table["2026-10-24"] = { slots: [{ time: "09:00", available: false, reason: "BOOKED" }, { time: "10:00", available: true }] };
    fireEvent.click(backBtn());
    fireEvent.click(nextBtn(/Lanjut ke Jam/i));
    await waitFor(() => expect(slotRadio(/09:00.*Penuh/).disabled).toBe(true));
    await waitFor(() => expect(nextBtn(/Lanjut ke Data Pemilik/i).disabled).toBe(true));
    expect(screen.queryByText(/Pukul 09:00 WIB/)).toBeNull();
  });

  it("tanggal di luar rentang yang diketik membuat Lanjut ke Jam nonaktif", async () => {
    stubAvailabilityByDate({});
    render(<BookingWizard services={[service]} />);
    await goToStep2();

    fireEvent.click(dateChip(/Besok/));
    expect(nextBtn(/Lanjut ke Jam/i).disabled).toBe(false);
    fireEvent.change(screen.getByLabelText(/Atau Pilih Tanggal Melalui Kalender:/i), { target: { value: "2026-12-31" } });
    expect(nextBtn(/Lanjut ke Jam/i).disabled).toBe(true);
    expect(screen.getByRole("alert")).toBeDefined();
  });
});
