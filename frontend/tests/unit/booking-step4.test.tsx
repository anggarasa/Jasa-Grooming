// @vitest-environment jsdom
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { Step4CustomerForm } from "@/components/booking/Step4CustomerForm";
import { BookingWizard } from "@/components/booking/BookingWizard";
import type { PublicServiceItem } from "@backend/modules/public/public-services.service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-23T05:00:00Z"));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const nameInput = () => screen.getByLabelText(/Nama Lengkap Pelanggan/i) as HTMLInputElement;
const phoneInput = () => screen.getByLabelText(/Nomor WhatsApp Aktif/i) as HTMLInputElement;
const emailInput = () => screen.getByLabelText(/Alamat Email/i) as HTMLInputElement;
const form = () => screen.getByRole("form", { name: "Form Data Pemilik" }) as HTMLFormElement;
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const submit = () => fireEvent.submit(form());

function renderForm(props: Partial<React.ComponentProps<typeof Step4CustomerForm>> = {}) {
  const onSubmitStep = vi.fn();
  const utils = render(
    <Step4CustomerForm
      initialData={{ name: "", phone: "", email: "" }}
      onSubmitStep={onSubmitStep}
      formId="booking-customer-form"
      {...props}
    />
  );
  return { onSubmitStep, ...utils };
}

describe("Tahap 4 — field aktual dan penanda wajib", () => {
  it("tepat 3 field (name, phone, email) dengan id/name/tipe yang dipertahankan", () => {
    renderForm();
    const inputs = within(form()).getAllByRole("textbox").concat(within(form()).queryAllByDisplayValue("") as HTMLElement[]);
    const all = Array.from(form().querySelectorAll("input, select, textarea")) as HTMLInputElement[];
    expect(all).toHaveLength(3);
    expect(inputs.length).toBeGreaterThan(0);
    expect(all.map((i) => [i.id, i.name, i.type])).toEqual([
      ["customer-name", "name", "text"],
      ["customer-phone", "phone", "tel"],
      ["customer-email", "email", "email"],
    ]);
  });

  it("label selalu ada, placeholder hanya contoh, dan wajib/opsional ditandai jelas", () => {
    renderForm();
    // label terhubung ke input (bukan pengganti placeholder)
    [nameInput(), phoneInput(), emailInput()].forEach((el) => {
      expect(document.querySelector(`label[for="${el.id}"]`)).not.toBeNull();
      expect(el.placeholder).toMatch(/^Contoh: /);
    });
    // wajib: asterisk + teks "Wajib" + aria-required; opsional: teks "Opsional", tanpa aria-required
    expect(screen.getAllByText("Wajib")).toHaveLength(2);
    expect(screen.getAllByText("Opsional")).toHaveLength(1);
    expect(nameInput().getAttribute("aria-required")).toBe("true");
    expect(phoneInput().getAttribute("aria-required")).toBe("true");
    expect(emailInput().getAttribute("aria-required")).toBeNull();
    expect(document.querySelector('label[for="customer-name"]')!.textContent).toContain("*");

    // label tetap ada setelah mengetik
    type(nameInput(), "Sarah");
    expect(document.querySelector('label[for="customer-name"]')!.textContent).toContain("Nama Lengkap Pelanggan");
  });

  it("atribut ramah mobile: autocomplete, keyboard yang sesuai, tanpa koreksi otomatis pada email", () => {
    renderForm();
    expect(nameInput().autocomplete).toBe("name");
    expect(nameInput().getAttribute("autocapitalize")).toBe("words");
    expect(phoneInput().getAttribute("inputmode")).toBe("tel");
    expect(phoneInput().autocomplete).toBe("tel");
    expect(emailInput().getAttribute("inputmode")).toBe("email");
    expect(emailInput().getAttribute("autocapitalize")).toBe("none");
    expect(emailInput().getAttribute("autocorrect")).toBe("off");
    expect(nameInput().getAttribute("enterkeyhint")).toBe("next");
    expect(emailInput().getAttribute("enterkeyhint")).toBe("done");
  });

  it("tidak ada state disabled/loading: input dan tombol kirim form tetap aktif", () => {
    renderForm();
    [nameInput(), phoneInput(), emailInput()].forEach((el) => expect(el.disabled).toBe(false));
    expect(form().getAttribute("novalidate")).not.toBeNull();
  });
});

describe("Tahap 4 — field kosong dan format tidak valid", () => {
  it("form kosong: dua galat wajib + panduan perbaikan, fokus ke field pertama, tidak mengirim", async () => {
    const { onSubmitStep } = renderForm();
    submit();
    await waitFor(() => expect(screen.getByText("Nama pelanggan minimal 2 karakter")).toBeDefined());
    expect(screen.getByText("Nomor telepon minimal 8 digit")).toBeDefined();
    expect(onSubmitStep).not.toHaveBeenCalled();

    // panduan "cara memperbaiki" ada bersama pesan skema
    const nameErr = document.getElementById("customer-name-error")!;
    expect(nameErr.textContent).toContain("Nama pelanggan minimal 2 karakter");
    expect(nameErr.textContent).toContain("Contoh: Sarah Wijaya");
    const phoneErr = document.getElementById("customer-phone-error")!;
    expect(phoneErr.textContent).toContain("Contoh: 081234567890");

    expect(nameInput().getAttribute("aria-invalid")).toBe("true");
    expect(nameInput().getAttribute("aria-describedby")).toBe("customer-name-error");
    expect(phoneInput().getAttribute("aria-describedby")).toBe("customer-phone-error");
    expect(emailInput().getAttribute("aria-invalid")).toBe("false");
    expect(document.activeElement).toBe(nameInput());
    // galat kosong tidak membuat galat email
    expect(document.getElementById("customer-email-error")).toBeNull();
  });

  it.each([
    ["nama 1 karakter", "A", "081234567890", "", "Nama pelanggan minimal 2 karakter", "customer-name-error"],
    ["nama 101 karakter", "A".repeat(101), "081234567890", "", "Nama terlalu panjang", "customer-name-error"],
    ["telepon berisi huruf", "Sarah", "08abc12345", "", "Format nomor telepon tidak valid", "customer-phone-error"],
    ["telepon terlalu pendek", "Sarah", "12345", "", "Nomor telepon minimal 8 digit", "customer-phone-error"],
    ["telepon terlalu panjang", "Sarah", "1".repeat(21), "", "Nomor telepon maksimal 20 digit", "customer-phone-error"],
    ["email tidak valid", "Sarah", "081234567890", "bukan-email", "Format email tidak valid", "customer-email-error"],
  ])("format tidak valid — %s", async (_label, name, phone, email, message, errId) => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), name);
    type(phoneInput(), phone);
    type(emailInput(), email);
    submit();
    await waitFor(() => expect(document.getElementById(errId)).not.toBeNull());
    const err = document.getElementById(errId)!;
    expect(err.textContent).toContain(message);
    expect(err.querySelectorAll("p")).toHaveLength(2); // pesan + cara memperbaiki
    expect(onSubmitStep).not.toHaveBeenCalled();
  });

  it("galat hilang setelah isian diperbaiki dan form bisa dikirim", async () => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), "A");
    type(phoneInput(), "123");
    submit();
    await waitFor(() => expect(document.getElementById("customer-name-error")).not.toBeNull());

    type(nameInput(), "Sarah Wijaya");
    type(phoneInput(), "081234567890");
    await waitFor(() => expect(document.getElementById("customer-name-error")).toBeNull());
    expect(document.getElementById("customer-phone-error")).toBeNull();
    expect(document.getElementById("customer-phone-hint")).not.toBeNull(); // hint kembali

    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(1));
  });
});

describe("Tahap 4 — input valid", () => {
  it("mengirim persis 3 field yang sudah dirapikan (trim), tanpa field tambahan", async () => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), "  Sarah Wijaya  ");
    type(phoneInput(), " 0812-3456 7890 ");
    type(emailInput(), " sarah@gmail.com ");
    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(1));
    expect(onSubmitStep).toHaveBeenCalledWith({
      name: "Sarah Wijaya",
      phone: "0812-3456 7890", // format dikirim apa adanya; server yang menormalkan
      email: "sarah@gmail.com",
    });
    expect(Object.keys(onSubmitStep.mock.calls[0][0]).sort()).toEqual(["email", "name", "phone"]);
  });

  it("email kosong diterima dan dikirim sebagai string kosong", async () => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), "Sarah");
    type(phoneInput(), "+62 812 3456 7890");
    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledWith({ name: "Sarah", phone: "+62 812 3456 7890", email: "" }));
  });
});

describe("Tahap 4 — menjaga isian saat ditinggalkan", () => {
  it("mengirim isian terakhir (trim) ke onDraftChange saat komponen dilepas", () => {
    const onDraftChange = vi.fn();
    const { unmount } = renderForm({ onDraftChange });
    type(nameInput(), "  Sar ");
    type(phoneInput(), "0812");
    expect(onDraftChange).not.toHaveBeenCalled();
    unmount();
    expect(onDraftChange).toHaveBeenLastCalledWith({ name: "Sar", phone: "0812", email: "" });
  });

  it("memakai initialData sebagai nilai awal", () => {
    renderForm({ initialData: { name: "Budi", phone: "081111111111", email: "budi@x.id" } });
    expect([nameInput().value, phoneInput().value, emailInput().value]).toEqual(["Budi", "081111111111", "budi@x.id"]);
  });
});

/* ------------------------- Alur wizard ------------------------- */

const service = {
  id: "svc-1", name: "Basic Cat Grooming", slug: "basic-cat-grooming", description: "Mandi bersih.", shortDescription: "Mandi bersih.",
  fullDescription: null, durationMinutes: 60, bufferMinutes: 15, price: 85000, formattedPrice: "Rp 85.000", imageObjectKey: null, displayOrder: 1,
  category: { id: "c1", name: "Grooming Kucing", slug: "grooming-kucing" }, createdAt: new Date(0), updatedAt: new Date(0),
} as PublicServiceItem;

const btn = (re: RegExp) => screen.getByRole("button", { name: re }) as HTMLButtonElement;
const chips = () => within(screen.getByRole("radiogroup", { name: /Pilihan Cepat/i })).getAllByRole("radio");

async function toStep4() {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({ success: true, slots: [{ time: "09:00", available: true }], data: { isOpen: true } }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  render(<BookingWizard services={[service]} />);
  fireEvent.click(screen.getByText("Basic Cat Grooming"));
  fireEvent.click(btn(/Lanjut ke Tanggal/i));
  fireEvent.click(chips()[1]);
  fireEvent.click(btn(/Lanjut ke Jam/i));
  await waitFor(() => expect(screen.getByRole("radio", { name: "09:00" })).toBeDefined());
  fireEvent.click(screen.getByRole("radio", { name: "09:00" }));
  fireEvent.click(btn(/Lanjut ke Data Pemilik/i));
  expect(screen.getByText("Data Pemilik & Kontak")).toBeDefined();
  return fetchMock;
}

describe("Tahap 4 — navigasi dan retensi data di wizard", () => {
  it("Lanjut dengan form kosong tidak pindah tahap; Kembali ke jam mempertahankan jam", async () => {
    await toStep4();
    fireEvent.click(btn(/Lanjut ke Data Anabul/i));
    await waitFor(() => expect(screen.getByText("Nama pelanggan minimal 2 karakter")).toBeDefined());
    expect(screen.getByText("Data Pemilik & Kontak")).toBeDefined();

    fireEvent.click(btn(/^Kembali/));
    // slot dimuat ulang dari server saat kembali ke langkah jam
    await waitFor(() => expect(screen.getByRole("radio", { name: /^09:00/ }).getAttribute("aria-checked")).toBe("true"));
    expect(btn(/Lanjut ke Data Pemilik/i).disabled).toBe(false);
  });

  it("isian yang belum dikirim (setengah jadi) tetap ada saat Kembali lalu maju lagi", async () => {
    await toStep4();
    type(nameInput(), "Sarah Wijaya");
    type(phoneInput(), "0812"); // belum valid, tidak pernah di-submit

    fireEvent.click(btn(/^Kembali/));
    expect(screen.getByText("Pilih Waktu Kedatangan")).toBeDefined();
    fireEvent.click(btn(/Lanjut ke Data Pemilik/i));

    expect(nameInput().value).toBe("Sarah Wijaya");
    expect(phoneInput().value).toBe("0812");
    expect(document.getElementById("customer-phone-error")).toBeNull(); // belum divalidasi ulang sebelum submit
  });

  it("data yang sudah dikirim tetap ada setelah maju ke Data Anabul lalu kembali", async () => {
    const fetchMock = await toStep4();
    const callsBefore = fetchMock.mock.calls.length;
    type(nameInput(), "  Sarah Wijaya ");
    type(phoneInput(), "081234567890");
    type(emailInput(), "sarah@gmail.com");
    fireEvent.click(btn(/Lanjut ke Data Anabul/i));
    await waitFor(() => expect(screen.getByText("Profil Anabul Kesayangan")).toBeDefined());
    expect(fetchMock.mock.calls.length).toBe(callsBefore); // tahap ini tidak memanggil jaringan

    fireEvent.click(btn(/^Kembali/));
    await waitFor(() => expect(screen.getByText("Data Pemilik & Kontak")).toBeDefined());
    expect([nameInput().value, phoneInput().value, emailInput().value]).toEqual(["Sarah Wijaya", "081234567890", "sarah@gmail.com"]);
  });

  it("klik langkah di indikator progres juga menjaga isian", async () => {
    await toStep4();
    type(nameInput(), "Budi");
    fireEvent.click(screen.getAllByRole("button", { name: /Langkah 3: Pilih Jam/i })[0]);
    await waitFor(() => expect(screen.getByText("Pilih Waktu Kedatangan")).toBeDefined());
    fireEvent.click(btn(/Lanjut ke Data Pemilik/i));
    expect(nameInput().value).toBe("Budi");
  });

  it("isian belum tervalidasi tidak bocor ke ringkasan konfirmasi", async () => {
    await toStep4();
    type(nameInput(), "Sarah Wijaya");
    type(phoneInput(), "081234567890");
    fireEvent.click(btn(/Lanjut ke Data Anabul/i));
    await waitFor(() => expect(screen.getByText("Profil Anabul Kesayangan")).toBeDefined());
    type(document.getElementById("pet-name")!, "Milo");
    fireEvent.click(btn(/Lanjut ke Konfirmasi/i));
    await waitFor(() => expect(screen.getByText("Sarah Wijaya")).toBeDefined());

    // kembali ke tahap 4, ubah nama tetapi TIDAK menekan Lanjut, lalu lompat ke Konfirmasi
    fireEvent.click(screen.getAllByRole("button", { name: /Langkah 4: Data Pemilik/i })[0]);
    await waitFor(() => expect(screen.getByText("Data Pemilik & Kontak")).toBeDefined());
    type(nameInput(), "Nama Belum Disimpan");
    fireEvent.click(screen.getAllByRole("button", { name: /Langkah 6: Konfirmasi/i })[0]);
    await waitFor(() => expect(screen.getByText("Sarah Wijaya")).toBeDefined());
    expect(screen.queryByText("Nama Belum Disimpan")).toBeNull();

    // isian yang belum disimpan itu masih ada saat pengguna kembali mengeditnya
    fireEvent.click(screen.getAllByRole("button", { name: /Langkah 4: Data Pemilik/i })[0]);
    await waitFor(() => expect(nameInput().value).toBe("Nama Belum Disimpan"));
  });
});
