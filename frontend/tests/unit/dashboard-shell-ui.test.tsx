// @vitest-environment jsdom
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardCommandMenu } from "@/components/dashboard/DashboardCommandMenu";
import { navSections } from "@/components/dashboard/nav-config";
import { StatCard } from "@/components/dashboard/overview/StatCard";
import { ProgressGauge } from "@/components/dashboard/overview/ProgressGauge";
import { BreakdownCard } from "@/components/dashboard/overview/BreakdownCard";
import { ReportChart } from "@/components/dashboard/overview/ReportChart";
import { buildDailySeries } from "@backend/modules/bookings/dashboard-stats";
import { CalendarDays } from "lucide-react";

const mockPush = vi.fn();
let mockPath = "/dashboard/bookings";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
  usePathname: () => mockPath,
}));

beforeEach(() => {
  mockPush.mockClear();
  mockPath = "/dashboard/bookings";
  window.HTMLElement.prototype.scrollIntoView = () => {};
});
afterEach(cleanup);

describe("DashboardSidebar (redesain terang)", () => {
  it("memuat SEMUA 16 menu dengan urutan & tautan yang sama seperti sebelum redesain", () => {
    render(<DashboardSidebar />);
    const nav = screen.getByRole("navigation", { name: "Menu dashboard" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    const expected = navSections.flatMap((s) => s.items.map((i) => i.href));
    expect(expected).toHaveLength(16);
    expect(hrefs).toEqual(expected);
    expect(expected[0]).toBe("/dashboard");
    expect(expected).toContain("/dashboard/integrations/google-calendar");
  });

  it("logo PawCare resmi dipasang proporsional: rasio 420×128, tinggi dikunci, lebar otomatis, tidak dipepatkan", () => {
    render(<DashboardSidebar />);
    const logo = screen.getByAltText("PawCare Grooming");
    expect(logo.getAttribute("src")).toBe("/images/brand/logo-pawcare-hijau.png");
    expect(logo.getAttribute("width")).toBe("420");
    expect(logo.getAttribute("height")).toBe("128");
    // h-10 mengunci tinggi; w-auto menjaga rasio; max-w-none + shrink-0 mencegah flex memepatkannya.
    for (const cls of ["h-10", "w-auto", "max-w-none", "shrink-0"]) {
      expect(logo.className).toContain(cls);
    }
    expect(logo.className).not.toMatch(/(^|\s)w-\d/); // tidak ada lebar tetap
  });

  it("subjudul 'Admin Portal v1.0' tidak ada", () => {
    render(<DashboardSidebar />);
    expect(screen.queryByText(/Admin Portal/i)).toBeNull();
  });

  it("menandai menu aktif dengan aria-current dan hanya satu", () => {
    render(<DashboardSidebar />);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute("href")).toBe("/dashboard/bookings");
  });

  it("Ringkasan hanya aktif pada /dashboard persis (bukan pada halaman turunan)", () => {
    mockPath = "/dashboard";
    render(<DashboardSidebar />);
    const current = screen.getAllByRole("link").filter((a) => a.getAttribute("aria-current") === "page");
    expect(current.map((a) => a.getAttribute("href"))).toEqual(["/dashboard"]);
  });

  it("lencana jumlah muncul hanya bila > 0 dan terbaca oleh pembaca layar", () => {
    const { rerender } = render(<DashboardSidebar badges={{ "/dashboard/bookings": 3 }} />);
    expect(screen.getByText("3 menunggu konfirmasi")).toBeDefined();
    rerender(<DashboardSidebar badges={{ "/dashboard/bookings": 0 }} />);
    expect(screen.queryByText(/menunggu konfirmasi/)).toBeNull();
    rerender(<DashboardSidebar badges={{ "/dashboard/bookings": 250 }} />);
    expect(screen.getByText("99+")).toBeDefined();
  });

  it("kartu bisnis menuju Profil Bisnis dan memakai nama bisnis dari data", () => {
    render(<DashboardSidebar businessName="Salon Anabul Ceria" />);
    const link = screen.getByRole("link", { name: /Salon Anabul Ceria/ });
    expect(link.getAttribute("href")).toBe("/dashboard/settings/business");
  });

  it("kartu pengguna menampilkan nama + peran dan menuju Profil Saya", () => {
    render(<DashboardSidebar user={{ name: "Budi Pratama", role: "OWNER" }} />);
    expect(screen.getByText("Budi Pratama")).toBeDefined();
    expect(screen.getByText("Pemilik")).toBeDefined();
    const link = screen.getByText("Budi Pratama").closest("a");
    expect(link?.getAttribute("href")).toBe("/dashboard/profile");
  });

  it("tombol ciutkan hanya ada bila handler diberikan, dan memanggilnya", () => {
    const { rerender } = render(<DashboardSidebar />);
    expect(screen.queryByLabelText("Ciutkan sidebar")).toBeNull();
    const onToggle = vi.fn();
    rerender(<DashboardSidebar onToggleCollapsed={onToggle} />);
    fireEvent.click(screen.getByLabelText("Ciutkan sidebar"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("mode ciut: label disembunyikan secara visual tapi tetap ada untuk pembaca layar, tombol berganti 'Lebarkan'", () => {
    render(<DashboardSidebar collapsed onToggleCollapsed={() => {}} user={{ name: "Siti", role: "ADMIN" }} />);
    const label = screen.getByText("Kalender");
    expect(label.className).toContain("sr-only");
    expect(screen.getByLabelText("Lebarkan sidebar").getAttribute("aria-expanded")).toBe("false");
    // ikon menu tetap bisa diklik dan punya nama aksesibel
    expect(screen.getByRole("link", { name: "Kalender" }).getAttribute("href")).toBe("/dashboard/calendar");
  });

  it("mode ciut: logo hanya dipotong (overflow-hidden), bukan diregangkan", () => {
    render(<DashboardSidebar collapsed />);
    const logo = screen.getByAltText("PawCare Grooming");
    expect(logo.className).toContain("w-auto");
    expect(logo.parentElement?.className).toContain("overflow-hidden");
  });
});

describe("DashboardCommandMenu (⌘K)", () => {
  it("menampilkan seluruh menu saat dibuka tanpa kata kunci", () => {
    render(<DashboardCommandMenu open onOpenChange={() => {}} />);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(16);
  });

  it("menyaring berdasarkan judul menu atau nama bagian", () => {
    render(<DashboardCommandMenu open onOpenChange={() => {}} />);
    const input = screen.getByLabelText("Cari menu atau halaman");
    fireEvent.change(input, { target: { value: "kalen" } });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      expect.stringContaining("Kalender"),
    ]);
    fireEvent.change(input, { target: { value: "pengaturan bisnis" } });
    expect(screen.getAllByRole("option")).toHaveLength(4);
  });

  it("Enter membuka halaman terpilih dan menutup kotak; panah mengganti pilihan", () => {
    const onOpenChange = vi.fn();
    render(<DashboardCommandMenu open onOpenChange={onOpenChange} />);
    const input = screen.getByLabelText("Cari menu atau halaman");
    fireEvent.change(input, { target: { value: "sesi" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/dashboard/sessions");
    expect(onOpenChange).toHaveBeenCalledWith(false);

    mockPush.mockClear();
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/dashboard/services"); // item ke-2
  });

  it("memberi pesan jelas bila tidak ada yang cocok, dan Enter tidak menavigasi", () => {
    render(<DashboardCommandMenu open onOpenChange={() => {}} />);
    const input = screen.getByLabelText("Cari menu atau halaman");
    fireEvent.change(input, { target: { value: "zzzzzz" } });
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText(/Tidak ada menu yang cocok/)).toBeDefined();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("klik pada hasil membuka halamannya", () => {
    render(<DashboardCommandMenu open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByText("Pelanggan"));
    expect(mockPush).toHaveBeenCalledWith("/dashboard/customers");
  });
});

describe("StatCard", () => {
  it("menampilkan label, nilai, pembanding, dan batang proporsional terhadap nilai tertinggi", () => {
    render(
      <StatCard
        icon={CalendarDays}
        label="Janji Hari Ini"
        value="7"
        caption="+2 dibanding kemarin"
        tone="up"
        series={[0, 5, 10]}
        highlightIndex={2}
        seriesLabel="Grafik uji"
      />
    );
    expect(screen.getByText("Janji Hari Ini")).toBeDefined();
    expect(screen.getByText("7")).toBeDefined();
    expect(screen.getByText("+2 dibanding kemarin").className).toContain("text-primary");
    const bars = screen.getByRole("img", { name: "Grafik uji" }).children;
    expect(bars).toHaveLength(3);
    expect((bars[2] as HTMLElement).style.height).toBe("100%");
    expect((bars[1] as HTMLElement).style.height).toBe("50%");
    expect((bars[0] as HTMLElement).style.height).toBe("8%"); // nol = batang pendek, bukan hilang
  });

  it("nada turun memakai warna destruktif dan angka rupiah panjang mengecil", () => {
    render(<StatCard icon={CalendarDays} label="Pendapatan" value="Rp 1.250.000" caption="−Rp 5.000" tone="down" />);
    expect(screen.getByText("−Rp 5.000").className).toContain("text-destructive");
    expect(screen.getByText("Rp 1.250.000").className).toContain("text-[21px]");
    expect(screen.queryByRole("img")).toBeNull(); // tanpa series = tanpa batang
  });
});

describe("ProgressGauge", () => {
  const base = {
    title: "Progres Hari Ini",
    centerLabel: "Pendapatan selesai",
    centerValue: "Rp 0",
    legend: [{ label: "Online", value: 2, color: "#000" }],
    footnote: "x",
    href: "/dashboard/bookings",
    linkLabel: "Lihat Semua Reservasi",
  };

  it("jumlah garis menyala sebanding dengan persentase (0%, 50%, 100% dari 56 garis)", () => {
    const lit = (percent: number) => {
      const { container, unmount } = render(<ProgressGauge {...base} percent={percent} />);
      const n = container.querySelectorAll("line.motion-admin-tick").length;
      unmount();
      return n;
    };
    expect(lit(0)).toBe(0);
    expect(lit(50)).toBe(28);
    expect(lit(100)).toBe(56);
  });

  it("membatasi persentase di luar 0–100 dan memberi label aksesibel", () => {
    render(<ProgressGauge {...base} percent={250} />);
    expect(screen.getByRole("img", { name: "100% janji hari ini selesai" })).toBeDefined();
    cleanup();
    render(<ProgressGauge {...base} percent={-20} />);
    expect(screen.getByRole("img", { name: "0% janji hari ini selesai" })).toBeDefined();
  });

  it("tautan 'Lihat Semua Reservasi' menuju daftar reservasi dan legenda menampilkan jumlah", () => {
    render(<ProgressGauge {...base} percent={10} />);
    expect(screen.getByRole("link", { name: /Lihat Semua Reservasi/ }).getAttribute("href")).toBe("/dashboard/bookings");
    expect(screen.getByText("Online")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
  });
});

describe("BreakdownCard", () => {
  it("segmen bilah sebanding dengan nilai, baris bernilai 0 tidak membuat segmen", () => {
    render(
      <BreakdownCard
        icon={CalendarDays}
        title="Status"
        totalLabel="Total"
        totalValue="4"
        emptyText="kosong"
        rows={[
          { label: "A", value: 3, color: "#111" },
          { label: "B", value: 1, color: "#222" },
          { label: "C", value: 0, color: "#333" },
        ]}
      />
    );
    const bar = screen.getByRole("img", { name: "A 3, B 1" });
    expect(bar.children).toHaveLength(2);
    expect((bar.children[0] as HTMLElement).style.width).toBe("75%");
    expect((bar.children[1] as HTMLElement).style.width).toBe("25%");
    // baris bernilai 0 tetap tampil di daftar (supaya semua status terlihat)
    expect(screen.getByText("C")).toBeDefined();
  });

  it("tanpa baris menampilkan teks kosong, bukan bilah/daftar rusak", () => {
    render(
      <BreakdownCard icon={CalendarDays} title="T" totalLabel="L" totalValue="0" emptyText="Belum ada data" rows={[]} />
    );
    expect(screen.getByText("Belum ada data")).toBeDefined();
  });
});

describe("ReportChart", () => {
  const TODAY = "2026-10-27";
  const series = buildDailySeries(
    [
      { startAt: "2026-10-27T03:00:00.000Z", status: "CONFIRMED", source: "PUBLIC_GUEST", price: 100_000, serviceName: "A" },
      { startAt: "2026-10-27T05:00:00.000Z", status: "COMPLETED", source: "PUBLIC_GUEST", price: 50_000, serviceName: "A" },
      { startAt: "2026-10-30T03:00:00.000Z", status: "CONFIRMED", source: "WALK_IN", price: 200_000, serviceName: "B" },
      { startAt: "2026-10-28T03:00:00.000Z", status: "CANCELLED", source: "PUBLIC_GUEST", price: 999_000, serviceName: "B" },
    ],
    TODAY
  );

  it("merender 14 kolom hari dan total reservasi aktif + estimasi pendapatan dari data (batal tidak dihitung)", () => {
    render(<ReportChart series={series} />);
    expect(screen.getAllByRole("button", { name: /reservasi aktif, estimasi pendapatan/ })).toHaveLength(14);
    // 3 aktif (2 hari ini + 1 tgl 30); Rp 350.000; yang dibatalkan Rp 999.000 TIDAK ikut
    const dt = screen.getByText("Total reservasi aktif").closest("div")!;
    expect(within(dt).getByText("3")).toBeDefined();
    expect(screen.getByText(/350\.000/)).toBeDefined();
    expect(screen.queryByText(/999\.000/)).toBeNull();
  });

  it("pilihan 7 hari menyempitkan kolom dan total mengikuti jendela yang tampil", () => {
    render(<ReportChart series={series} />);
    fireEvent.click(screen.getByRole("button", { name: "7 hari" }));
    expect(screen.getAllByRole("button", { name: /reservasi aktif, estimasi pendapatan/ })).toHaveLength(7);
    expect(screen.getByRole("button", { name: "7 hari" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "14 hari" }).getAttribute("aria-pressed")).toBe("false");
    // jendela 7 hari = hari ini ±3 → tgl 30 (hari ini+3) masih masuk
    const dt = screen.getByText("Total reservasi aktif").closest("div")!;
    expect(within(dt).getByText("3")).toBeDefined();
  });

  it("menyorot kolom menampilkan tooltip rinci dan menyembunyikannya saat lepas", () => {
    render(<ReportChart series={series} />);
    const col = screen.getAllByRole("button", { name: /27 Oktober 2026/ })[0];
    fireEvent.mouseEnter(col);
    const tip = screen.getByRole("status");
    expect(within(tip).getByText("Reservasi aktif")).toBeDefined();
    expect(within(tip).getByText(/150\.000/)).toBeDefined();
    fireEvent.mouseLeave(col);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("dengan data pendapatan: garis estimasi digambar putus-putus", () => {
    const { container } = render(<ReportChart series={series} />);
    const path = container.querySelector('svg[viewBox="0 0 100 100"] path');
    expect(path).not.toBeNull();
    expect(path?.getAttribute("stroke-dasharray")).toBeTruthy();
  });

  it("tanpa data: menampilkan keterangan kosong dan tidak menggambar garis pendapatan", () => {
    const { container } = render(<ReportChart series={buildDailySeries([], TODAY)} />);
    expect(screen.getByText("Belum ada reservasi aktif pada periode ini.")).toBeDefined();
    // Hanya SVG grafik (viewBox 0 0 100 100); ikon lucide juga berupa <svg><path>.
    expect(container.querySelector('svg[viewBox="0 0 100 100"] path')).toBeNull();
  });
});
