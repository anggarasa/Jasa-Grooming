// @vitest-environment jsdom
import * as React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { Step1ServiceSelect } from "@/components/booking/Step1ServiceSelect";
import { BookingWizard } from "@/components/booking/BookingWizard";
import type { PublicServiceItem } from "@backend/modules/public/public-services.service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const base = {
  fullDescription: null,
  bufferMinutes: 15,
  imageObjectKey: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

const services: PublicServiceItem[] = [
  {
    ...base,
    id: "svc-1",
    name: "Basic Cat Grooming",
    slug: "basic-cat-grooming",
    description: "Mandi bersih dan potong kuku.",
    shortDescription: "Mandi bersih, potong kuku.",
    durationMinutes: 60,
    price: 85000,
    formattedPrice: "Rp 85.000",
    displayOrder: 1,
    category: { id: "c1", name: "Grooming Kucing", slug: "grooming-kucing" },
  },
  {
    ...base,
    id: "svc-2",
    name: "Full Styling & Haircut Dog",
    slug: "full-styling-haircut-dog",
    description: "Mandi lengkap plus styling.",
    shortDescription: null,
    durationMinutes: 90,
    price: 165000,
    formattedPrice: "Rp 165.000",
    displayOrder: 2,
    category: { id: "c2", name: "Grooming Anjing", slug: "grooming-anjing" },
  },
  {
    ...base,
    id: "svc-3",
    name: "Treatment Anti Kutu & Jamur",
    slug: "treatment-anti-kutu",
    description: "Mandi obat medis.",
    shortDescription: "Mandi obat medis.",
    durationMinutes: 75,
    price: 120000,
    formattedPrice: "Rp 120.000",
    displayOrder: 3,
    category: { id: "c3", name: "Perawatan Khusus", slug: "perawatan-khusus" },
  },
] as PublicServiceItem[];

afterEach(cleanup);

/** Pembungkus berstate agar Step1 diuji seperti di wizard (pilihan dikendalikan induk). */
function Harness({
  list = services,
  onSelect,
}: {
  list?: PublicServiceItem[];
  onSelect?: (s: PublicServiceItem) => void;
}) {
  const [id, setId] = React.useState<string | null>(null);
  return (
    <Step1ServiceSelect
      services={list}
      selectedServiceId={id}
      onSelectService={(s) => {
        onSelect?.(s);
        setId(s.id);
      }}
    />
  );
}

const radios = () => screen.getAllByRole("radio");
const radioOf = (name: string) =>
  screen.getByText(name).closest("[role='radio']") as HTMLElement;
const checked = () => radios().filter((r) => r.getAttribute("aria-checked") === "true");

describe("Tahap 1 — tampilan paket layanan (data aktual)", () => {
  it("menampilkan nama, kategori, durasi, harga, dan deskripsi dari data", () => {
    render(<Harness />);
    expect(radios()).toHaveLength(3);

    const card = radioOf("Basic Cat Grooming");
    expect(within(card).getByText("Grooming Kucing")).toBeDefined();
    expect(within(card).getByText("60 mnt")).toBeDefined();
    expect(within(card).getByText(/85\.000/)).toBeDefined();
    expect(within(card).getByText("Mandi bersih, potong kuku.")).toBeDefined();

    // Tanpa shortDescription → memakai description (bukan teks karangan)
    const second = radioOf("Full Styling & Haircut Dog");
    expect(within(second).getByText("Mandi lengkap plus styling.")).toBeDefined();
    expect(within(second).getByText(/165\.000/)).toBeDefined();
    expect(within(second).getByText("90 mnt")).toBeDefined();
  });

  it("grid satu kolom di mobile dan dua kolom mulai tablet/desktop", () => {
    render(<Harness />);
    const group = screen.getByRole("radiogroup", { name: /Daftar layanan grooming/i });
    expect(group.className).toContain("grid-cols-1");
    expect(group.className).toContain("md:grid-cols-2");
  });
});

describe("Tahap 1 — pemilihan paket", () => {
  it("awalnya tidak ada paket terpilih dan status menjelaskan itu", () => {
    render(<Harness />);
    expect(checked()).toHaveLength(0);
    expect(screen.getByRole("status").textContent).toMatch(/Belum ada paket dipilih/);
  });

  it("memilih satu paket: hanya satu radio tercentang, ada penanda 'Terpilih', status memuat paket itu", () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);

    fireEvent.click(radioOf("Basic Cat Grooming"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(services[0]);
    expect(checked()).toHaveLength(1);
    expect(checked()[0]).toBe(radioOf("Basic Cat Grooming"));
    expect(within(checked()[0]).getByText("Terpilih")).toBeDefined();
    expect(screen.getAllByText("Pilih")).toHaveLength(2);
    expect(screen.getByRole("status").textContent).toContain(
      "Paket terpilih: Basic Cat Grooming · 60 mnt ·"
    );
  });

  it("mengganti pilihan: paket lama tidak lagi tercentang, paket baru tercentang", () => {
    render(<Harness />);
    fireEvent.click(radioOf("Basic Cat Grooming"));
    fireEvent.click(radioOf("Treatment Anti Kutu & Jamur"));

    expect(checked()).toHaveLength(1);
    expect(checked()[0]).toBe(radioOf("Treatment Anti Kutu & Jamur"));
    expect(radioOf("Basic Cat Grooming").getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("status").textContent).toContain("Treatment Anti Kutu & Jamur");
  });

  it("dapat dipilih dengan keyboard (Enter dan Spasi) dan semua radio bisa difokus", () => {
    render(<Harness />);
    radios().forEach((r) => expect(r.tabIndex).toBe(0));

    fireEvent.keyDown(radioOf("Basic Cat Grooming"), { key: "Enter" });
    expect(checked()[0]).toBe(radioOf("Basic Cat Grooming"));

    fireEvent.keyDown(radioOf("Full Styling & Haircut Dog"), { key: " " });
    expect(checked()[0]).toBe(radioOf("Full Styling & Haircut Dog"));

    // Tombol lain tidak memilih
    fireEvent.keyDown(radioOf("Treatment Anti Kutu & Jamur"), { key: "a" });
    expect(checked()[0]).toBe(radioOf("Full Styling & Haircut Dog"));
  });
});

describe("Tahap 1 — filter kategori", () => {
  it("menampilkan filter dengan jumlah, menyaring paket, dan kembali ke Semua", () => {
    render(<Harness />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Semua (3)",
      "Grooming Kucing (1)",
      "Grooming Anjing (1)",
      "Perawatan Khusus (1)",
    ]);
    expect(screen.getByRole("tab", { name: "Semua (3)" }).getAttribute("aria-selected")).toBe("true");

    fireEvent.click(screen.getByRole("tab", { name: "Grooming Anjing (1)" }));
    expect(radios()).toHaveLength(1);
    expect(screen.getByText("Full Styling & Haircut Dog")).toBeDefined();
    expect(screen.queryByText("Basic Cat Grooming")).toBeNull();
    expect(screen.getByRole("tab", { name: "Grooming Anjing (1)" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Semua (3)" }).getAttribute("aria-selected")).toBe("false");

    fireEvent.click(screen.getByRole("tab", { name: "Semua (3)" }));
    expect(radios()).toHaveLength(3);
  });

  it("paket yang sudah dipilih tetap tercatat meski tersaring oleh filter lain", () => {
    render(<Harness />);
    fireEvent.click(radioOf("Basic Cat Grooming"));
    fireEvent.click(screen.getByRole("tab", { name: "Grooming Anjing (1)" }));

    expect(screen.queryByText("Basic Cat Grooming", { selector: "h3" })).toBeNull();
    expect(checked()).toHaveLength(0); // kartu terpilih tidak sedang tampil
    expect(screen.getByRole("status").textContent).toContain("Paket terpilih: Basic Cat Grooming");

    fireEvent.click(screen.getByRole("tab", { name: "Semua (3)" }));
    expect(checked()[0]).toBe(radioOf("Basic Cat Grooming"));
  });

  it("tidak menampilkan filter bila hanya ada satu kategori", () => {
    render(<Harness list={[services[0]]} />);
    expect(screen.queryByRole("tab")).toBeNull();
    expect(radios()).toHaveLength(1);
  });

  it("menampilkan keadaan kosong tanpa membuat paket baru", () => {
    render(<Harness list={[]} />);
    expect(screen.getByText("Belum Ada Layanan Tersedia")).toBeDefined();
    expect(screen.queryByRole("radio")).toBeNull();
  });
});

describe("Tahap 1 — tombol lanjut dan data antar tahap (BookingWizard)", () => {
  const next = () => screen.getByRole("button", { name: /Lanjut ke Tanggal/i }) as HTMLButtonElement;

  it("tombol Lanjut nonaktif sampai ada paket; klik saat nonaktif tidak pindah tahap", () => {
    render(<BookingWizard services={services} />);
    expect(next().disabled).toBe(true);

    const hintId = next().getAttribute("aria-describedby");
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId!)?.textContent).toMatch(/Belum ada paket dipilih/);

    fireEvent.click(next());
    expect(screen.getByText("Pilih Paket Layanan Grooming")).toBeDefined();
    expect(screen.queryByText("Pilih Tanggal Reservasi")).toBeNull();

    fireEvent.click(radioOf("Basic Cat Grooming"));
    expect(next().disabled).toBe(false);
    expect(document.getElementById(hintId!)?.textContent).toContain("Paket terpilih: Basic Cat Grooming");
  });

  it("lanjut ke tahap 2, lalu Kembali: pilihan tetap sama dan tombol Lanjut aktif", () => {
    render(<BookingWizard services={services} />);
    fireEvent.click(radioOf("Full Styling & Haircut Dog"));
    fireEvent.click(next());
    expect(screen.getByText("Pilih Tanggal Reservasi")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /^Kembali/ }));
    expect(screen.getByText("Pilih Paket Layanan Grooming")).toBeDefined();
    expect(checked()).toHaveLength(1);
    expect(checked()[0]).toBe(radioOf("Full Styling & Haircut Dog"));
    expect(next().disabled).toBe(false);
  });

  it("mengganti paket setelah kembali dari tahap 2 memakai paket yang baru", () => {
    render(<BookingWizard services={services} />);
    fireEvent.click(radioOf("Full Styling & Haircut Dog"));
    fireEvent.click(next());
    fireEvent.click(screen.getByRole("button", { name: /^Kembali/ }));

    fireEvent.click(radioOf("Treatment Anti Kutu & Jamur"));
    expect(checked()).toHaveLength(1);
    expect(checked()[0]).toBe(radioOf("Treatment Anti Kutu & Jamur"));
    expect(screen.getByRole("status").textContent).toContain("Treatment Anti Kutu & Jamur");
  });

  it("deep link ?service= memilih paket otomatis tetapi tetap di tahap 1", () => {
    render(<BookingWizard services={services} initialServiceId="svc-3" />);
    expect(screen.getByText("Pilih Paket Layanan Grooming")).toBeDefined();
    expect(checked()[0]).toBe(radioOf("Treatment Anti Kutu & Jamur"));
    expect(next().disabled).toBe(false);
  });

  it("initialServiceId yang tidak dikenal tidak memilih apa pun", () => {
    render(<BookingWizard services={services} initialServiceId="tidak-ada" />);
    expect(checked()).toHaveLength(0);
    expect(next().disabled).toBe(true);
  });
});
