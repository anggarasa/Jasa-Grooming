// @vitest-environment jsdom
import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const getServices = vi.hoisted(() => vi.fn());
const getHours = vi.hoisted(() => vi.fn());
const getBusiness = vi.hoisted(() => vi.fn());

vi.mock("@backend/modules/public/public-services.service", () => ({ getPublicServices: getServices }));
vi.mock("@backend/modules/public/public-hours.service", () => ({ getPublicOperatingHours: getHours }));
vi.mock("@backend/modules/public/public-business.service", () => ({ getPublicBusinessProfile: getBusiness }));
vi.mock("@/components/booking/BookingWizard", () => ({
  BookingWizard: (p: { closedDaysOfWeek?: number[]; initialServiceId?: string }) => (
    <div data-testid="wizard" data-closed={JSON.stringify(p.closedDaysOfWeek)} data-service={p.initialServiceId ?? ""} />
  ),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import BookingPage from "@/app/(public)/booking/page";

const day = (dayOfWeek: number, isOpen: boolean) => ({ dayOfWeek, isOpen });
const week = (closed: number[]) => [0, 1, 2, 3, 4, 5, 6].map((d) => day(d, !closed.includes(d)));

async function renderPage(search: { service?: string } = {}) {
  render(await BookingPage({ searchParams: Promise.resolve(search) }));
  return screen.getByTestId("wizard");
}

beforeEach(() => {
  vi.clearAllMocks();
  getServices.mockResolvedValue([]);
  getBusiness.mockResolvedValue({ name: "PawCare Grooming" });
});

describe("Halaman /booking — hari libur dari jam operasional", () => {
  it("meneruskan hari libur dari data jam operasional ke wizard", async () => {
    getHours.mockResolvedValue({ schedule: week([0]) });
    const el = await renderPage();
    expect(el.getAttribute("data-closed")).toBe("[0]");
  });

  it("jam operasional gagal dibaca: halaman tetap tampil dan tidak ada hari yang ditandai", async () => {
    getHours.mockRejectedValue(new Error("DB putus"));
    const el = await renderPage();
    expect(el.getAttribute("data-closed")).toBe("[]");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Reservasi Jadwal Grooming");
  });

  it("semua hari terbaca tutup (data tidak tepercaya): tidak ada yang diblokir", async () => {
    getHours.mockResolvedValue({ schedule: week([0, 1, 2, 3, 4, 5, 6]) });
    expect((await renderPage()).getAttribute("data-closed")).toBe("[]");
  });

  it("deep link ?service= tetap diteruskan", async () => {
    getHours.mockResolvedValue({ schedule: week([0]) });
    expect((await renderPage({ service: " svc-9 " })).getAttribute("data-service")).toBe("svc-9");
  });
});
