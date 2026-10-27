// @vitest-environment jsdom
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { Step5PetForm } from "@/components/booking/Step5PetForm";
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

const nameInput = () => screen.getByLabelText(/Nama Panggilan Anabul/i) as HTMLInputElement;
const breedInput = () => screen.getByLabelText(/Ras \/ Trah/i) as HTMLInputElement;
const ageInput = () => screen.getByLabelText(/Usia \(Tahun\)/i) as HTMLInputElement;
const notesInput = () => screen.getByLabelText(/Catatan Khusus/i) as HTMLTextAreaElement;
const customInput = () => screen.getByLabelText(/Tuliskan jenis hewan/i) as HTMLInputElement;
const form = () => screen.getByRole("form", { name: "Form Data Anabul" }) as HTMLFormElement;
const typeGroup = () => screen.getByRole("radiogroup", { name: /Jenis Anabul/i });
const typeRadio = (name: string) => within(typeGroup()).getByRole("radio", { name }) as HTMLButtonElement;
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const submit = () => fireEvent.submit(form());

function renderForm(props: Partial<React.ComponentProps<typeof Step5PetForm>> = {}) {
  const onSubmitStep = vi.fn();
  const utils = render(
    <Step5PetForm initialData={{ name: "", type: "Anjing" }} onSubmitStep={onSubmitStep} formId="booking-pet-form" {...props} />
  );
  return { onSubmitStep, ...utils };
}
const submitted = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls[fn.mock.calls.length - 1][0];

describe("Tahap 5 — field aktual dan penanda wajib", () => {
  it("field dan id/name dipertahankan; jenis berupa 4 pilihan", () => {
    renderForm();
    const inputs = Array.from(form().querySelectorAll("input, textarea")) as HTMLInputElement[];
    expect(inputs.map((i) => [i.id, i.name])).toEqual([
      ["pet-name", "name"],
      ["pet-breed", "breed"],
      ["pet-age", "age"],
      ["pet-notes", "notes"],
    ]);
    expect(ageInput().type).toBe("number");
    expect(within(typeGroup()).getAllByRole("radio").map((r) => r.textContent)).toEqual(["Anjing", "Kucing", "Kelinci", "Lainnya"]);
  });

  it("wajib: nama + jenis; opsional: ras, usia, catatan — dengan teks dan aria-required", () => {
    renderForm();
    expect(screen.getAllByText("Wajib")).toHaveLength(2);
    expect(screen.getAllByText("Opsional")).toHaveLength(3);
    expect(nameInput().getAttribute("aria-required")).toBe("true");
    expect(breedInput().getAttribute("aria-required")).toBeNull();
    [nameInput(), breedInput(), ageInput(), notesInput()].forEach((el) =>
      expect(document.querySelector(`label[for="${el.id}"]`)).not.toBeNull()
    );
    expect(nameInput().placeholder).toMatch(/^Contoh: /);
    expect(ageInput().getAttribute("inputmode")).toBe("numeric");
  });
});

describe("Tahap 5 — BUG usia: kosong tidak boleh menjadi 0", () => {
  it("usia dikosongkan → age tidak dikirim (undefined), bukan 0", async () => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), "Milo");
    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(1));
    expect(submitted(onSubmitStep).age).toBeUndefined();
  });

  it("usia diketik lalu dihapus → kembali kosong (undefined)", async () => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), "Milo");
    type(ageInput(), "4");
    type(ageInput(), "");
    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(1));
    expect(submitted(onSubmitStep).age).toBeUndefined();
  });

  it.each([["0", 0], ["3", 3], ["35", 35]])("usia sah %s dikirim sebagai angka %i (0 tetap sah)", async (raw, expected) => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), "Milo");
    type(ageInput(), raw);
    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(1));
    expect(submitted(onSubmitStep).age).toBe(expected);
  });

  it.each([
    ["-1", "Usia anabul minimal 0 tahun"],
    ["36", "Usia anabul maksimal 35 tahun"],
    ["2.5", "Usia anabul harus berupa bilangan bulat"],
  ])("usia tidak valid %s → pesan berbahasa Indonesia + panduan", async (raw, message) => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), "Milo");
    type(ageInput(), raw);
    submit();
    await waitFor(() => expect(document.getElementById("pet-age-error")).not.toBeNull());
    const err = document.getElementById("pet-age-error")!;
    expect(err.textContent).toContain(message);
    expect(err.textContent).not.toMatch(/Invalid input|expected int/i);
    expect(err.textContent).toContain("bilangan bulat 0–35");
    expect(ageInput().getAttribute("aria-describedby")).toBe("pet-age-error");
    expect(onSubmitStep).not.toHaveBeenCalled();
  });

  it("nilai awal: usia 0 ditampilkan '0', usia tidak ada ditampilkan kosong", () => {
    const { unmount } = renderForm({ initialData: { name: "Milo", type: "Anjing", age: 0 } });
    expect(ageInput().value).toBe("0");
    unmount();
    renderForm({ initialData: { name: "Milo", type: "Anjing" } });
    expect(ageInput().value).toBe("");
  });
});

describe("Tahap 5 — BUG 'Lainnya': kolom jenis tidak hilang saat mengetik", () => {
  it("memilih Lainnya menampilkan kolom berlabel; tetap ada setelah setiap ketikan; jenis kustom terkirim", async () => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), "Gigi");
    expect(screen.queryByLabelText(/Tuliskan jenis hewan/i)).toBeNull();

    fireEvent.click(typeRadio("Lainnya"));
    expect(typeRadio("Lainnya").getAttribute("aria-checked")).toBe("true");

    // ketik huruf demi huruf: kolom HARUS tetap ada dan menampung teks utuh
    const text = "Sugar Glider";
    for (let i = 1; i <= text.length; i++) {
      type(customInput(), text.slice(0, i));
      expect(screen.queryByLabelText(/Tuliskan jenis hewan/i)).not.toBeNull();
      expect(customInput().value).toBe(text.slice(0, i));
      expect(typeRadio("Lainnya").getAttribute("aria-checked")).toBe("true");
    }

    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(1));
    expect(submitted(onSubmitStep).type).toBe("Sugar Glider");
  });

  it("Lainnya tanpa teks → 'Lainnya' (perilaku lama); teks dihapus kembali → 'Lainnya'", async () => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), "Gigi");
    fireEvent.click(typeRadio("Lainnya"));
    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(1));
    expect(submitted(onSubmitStep).type).toBe("Lainnya");

    type(customInput(), "Hamster");
    type(customInput(), "");
    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(2));
    expect(submitted(onSubmitStep).type).toBe("Lainnya");
  });

  it("ganti ke jenis lain menyembunyikan kolom; kembali ke Lainnya mengembalikan teks tadi", async () => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), "Gigi");
    fireEvent.click(typeRadio("Lainnya"));
    type(customInput(), "Hamster");

    fireEvent.click(typeRadio("Kucing"));
    expect(screen.queryByLabelText(/Tuliskan jenis hewan/i)).toBeNull();
    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(1));
    expect(submitted(onSubmitStep).type).toBe("Kucing");

    fireEvent.click(typeRadio("Lainnya"));
    expect(customInput().value).toBe("Hamster");
    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(2));
    expect(submitted(onSubmitStep).type).toBe("Hamster");
  });

  it("nilai awal jenis kustom (saat kembali): Lainnya terpilih dan kolom terisi; jenis baku tetap benar", async () => {
    const { onSubmitStep, unmount } = renderForm({ initialData: { name: "Gigi", type: "Sugar Glider" } });
    expect(typeRadio("Lainnya").getAttribute("aria-checked")).toBe("true");
    expect(customInput().value).toBe("Sugar Glider");
    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(1));
    expect(submitted(onSubmitStep).type).toBe("Sugar Glider");
    unmount();

    renderForm({ initialData: { name: "Milo", type: "Kelinci" } });
    expect(typeRadio("Kelinci").getAttribute("aria-checked")).toBe("true");
    expect(screen.queryByLabelText(/Tuliskan jenis hewan/i)).toBeNull();
  });

  it("jenis kustom lebih dari 30 karakter ditolak dengan pesan skema + panduan", async () => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), "Gigi");
    fireEvent.click(typeRadio("Lainnya"));
    type(customInput(), "x".repeat(31));
    submit();
    await waitFor(() => expect(document.getElementById("pet-type-error")).not.toBeNull());
    expect(document.getElementById("pet-type-error")!.textContent).toContain("Jenis anabul maksimal 30 karakter");
    expect(customInput().getAttribute("aria-invalid")).toBe("true");
    expect(onSubmitStep).not.toHaveBeenCalled();
  });

  it("pilihan jenis bisa dioperasikan dengan keyboard (panah/Home/End, tabindex bergulir)", () => {
    renderForm();
    const radios = within(typeGroup()).getAllByRole("radio") as HTMLButtonElement[];
    expect(radios.filter((r) => r.tabIndex === 0)).toEqual([radios[0]]); // Anjing (bawaan)
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: "ArrowRight" });
    expect(radios[1].getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(radios[1]);
    expect(radios.filter((r) => r.tabIndex === 0)).toEqual([radios[1]]);
    fireEvent.keyDown(radios[1], { key: "End" });
    expect(radios[3].getAttribute("aria-checked")).toBe("true");
    fireEvent.keyDown(radios[3], { key: "Home" });
    expect(radios[0].getAttribute("aria-checked")).toBe("true");
    fireEvent.keyDown(radios[0], { key: "ArrowLeft" }); // batas awal
    expect(document.activeElement).toBe(radios[0]);
  });
});

describe("Tahap 5 — validasi, pesan galat, dan input valid", () => {
  it("nama kosong: pesan skema + panduan, fokus ke nama, tidak mengirim", async () => {
    const { onSubmitStep } = renderForm();
    submit();
    await waitFor(() => expect(document.getElementById("pet-name-error")).not.toBeNull());
    expect(screen.getByText("Nama anabul wajib diisi")).toBeDefined();
    expect(document.getElementById("pet-name-error")!.textContent).toContain("Contoh: Milo");
    expect(nameInput().getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(nameInput());
    expect(onSubmitStep).not.toHaveBeenCalled();
  });

  it.each([
    ["nama 51 karakter", () => type(nameInput(), "A".repeat(51)), "pet-name-error", "Nama anabul maksimal 50 karakter"],
    ["ras 51 karakter", () => { type(nameInput(), "Milo"); type(breedInput(), "R".repeat(51)); }, "pet-breed-error", "Ras anabul maksimal 50 karakter"],
    ["catatan 501 karakter", () => { type(nameInput(), "Milo"); type(notesInput(), "c".repeat(501)); }, "pet-notes-error", "Catatan anabul maksimal 500 karakter"],
  ])("%s ditolak dengan pesan skema + panduan", async (_l, fill, errId, message) => {
    const { onSubmitStep } = renderForm();
    fill();
    submit();
    await waitFor(() => expect(document.getElementById(errId)).not.toBeNull());
    const err = document.getElementById(errId)!;
    expect(err.textContent).toContain(message);
    expect(err.querySelectorAll("p")).toHaveLength(2);
    expect(onSubmitStep).not.toHaveBeenCalled();
  });

  it("penghitung catatan mengikuti ketikan dan menandai kelebihan", () => {
    renderForm();
    expect(screen.getByText("0/500")).toBeDefined();
    type(notesInput(), "halo");
    expect(screen.getByText("4/500")).toBeDefined();
    type(notesInput(), "c".repeat(501));
    expect(screen.getByText("501/500").className).toContain("text-destructive");
  });

  it("input valid lengkap: field dirapikan (trim), tidak ada field tambahan", async () => {
    const { onSubmitStep } = renderForm();
    type(nameInput(), "  Luna ");
    fireEvent.click(typeRadio("Kucing"));
    type(breedInput(), " Persia ");
    type(ageInput(), "2");
    type(notesInput(), "  Takut hair dryer ");
    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(1));
    expect(onSubmitStep).toHaveBeenCalledWith({ name: "Luna", type: "Kucing", breed: "Persia", age: 2, notes: "Takut hair dryer" });
    expect(Object.keys(submitted(onSubmitStep)).sort()).toEqual(["age", "breed", "name", "notes", "type"]);
  });

  it("galat hilang setelah diperbaiki dan form dapat dikirim", async () => {
    const { onSubmitStep } = renderForm();
    submit();
    await waitFor(() => expect(document.getElementById("pet-name-error")).not.toBeNull());
    type(nameInput(), "Milo");
    await waitFor(() => expect(document.getElementById("pet-name-error")).toBeNull());
    submit();
    await waitFor(() => expect(onSubmitStep).toHaveBeenCalledTimes(1));
  });
});

describe("Tahap 5 — menjaga isian saat ditinggalkan", () => {
  it("mengirim isian terakhir ke onDraftChange saat dilepas (usia angka, jenis kustom)", () => {
    const onDraftChange = vi.fn();
    const { unmount } = renderForm({ onDraftChange });
    type(nameInput(), " Gigi ");
    fireEvent.click(typeRadio("Lainnya"));
    type(customInput(), "Sugar Glider");
    type(ageInput(), "0");
    type(notesInput(), " halo ");
    expect(onDraftChange).not.toHaveBeenCalled();
    unmount();
    expect(onDraftChange).toHaveBeenLastCalledWith({ name: "Gigi", type: "Sugar Glider", breed: "", age: 0, notes: "halo" });
  });

  it("usia kosong → draft age undefined (bukan 0)", () => {
    const onDraftChange = vi.fn();
    const { unmount } = renderForm({ onDraftChange });
    type(nameInput(), "Gigi");
    unmount();
    expect(onDraftChange.mock.calls[onDraftChange.mock.calls.length - 1][0].age).toBeUndefined();
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

async function toStep5() {
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
  type(screen.getByLabelText(/Nama Lengkap Pelanggan/i), "Sarah Wijaya");
  type(screen.getByLabelText(/Nomor WhatsApp Aktif/i), "081234567890");
  fireEvent.click(btn(/Lanjut ke Data Anabul/i));
  await waitFor(() => expect(screen.getByText("Profil Anabul Kesayangan")).toBeDefined());
  return fetchMock;
}

describe("Tahap 5 — navigasi dan retensi data di wizard", () => {
  it("Lanjut dengan nama kosong tidak pindah tahap; Kembali ke Data Pemilik mempertahankan isiannya", async () => {
    await toStep5();
    fireEvent.click(btn(/Lanjut ke Konfirmasi/i));
    await waitFor(() => expect(screen.getByText("Nama anabul wajib diisi")).toBeDefined());
    expect(screen.getByText("Profil Anabul Kesayangan")).toBeDefined();

    fireEvent.click(btn(/^Kembali/));
    await waitFor(() => expect(screen.getByText("Data Pemilik & Kontak")).toBeDefined());
    expect((screen.getByLabelText(/Nama Lengkap Pelanggan/i) as HTMLInputElement).value).toBe("Sarah Wijaya");
  });

  it("isian setengah jadi (termasuk jenis kustom) tetap ada saat Kembali lalu maju lagi", async () => {
    await toStep5();
    type(nameInput(), "Gigi");
    fireEvent.click(typeRadio("Lainnya"));
    type(customInput(), "Sugar Glider");
    type(ageInput(), "1");
    type(notesInput(), "Pemalu");

    fireEvent.click(btn(/^Kembali/));
    await waitFor(() => expect(screen.getByText("Data Pemilik & Kontak")).toBeDefined());
    fireEvent.click(btn(/Lanjut ke Data Anabul/i));
    await waitFor(() => expect(screen.getByText("Profil Anabul Kesayangan")).toBeDefined());

    expect(nameInput().value).toBe("Gigi");
    expect(typeRadio("Lainnya").getAttribute("aria-checked")).toBe("true");
    expect(customInput().value).toBe("Sugar Glider");
    expect(ageInput().value).toBe("1");
    expect(notesInput().value).toBe("Pemalu");
  });

  it("ringkasan konfirmasi: usia kosong TIDAK tampil sebagai 'Usia: 0'; jenis kustom tampil benar", async () => {
    await toStep5();
    type(nameInput(), "Gigi");
    fireEvent.click(typeRadio("Lainnya"));
    type(customInput(), "Sugar Glider");
    fireEvent.click(btn(/Lanjut ke Konfirmasi/i));
    await waitFor(() => expect(screen.getByText(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());
    expect(screen.getByText(/Gigi/).textContent).toContain("Sugar Glider");
    expect(screen.queryByText(/Usia:/)).toBeNull();
    expect(document.body.textContent).not.toMatch(/Usia:\s*0/);
  });

  it("usia 0 yang sengaja diisi tampil sebagai 'Usia: 0 Tahun'", async () => {
    await toStep5();
    type(nameInput(), "Mochi");
    type(ageInput(), "0");
    fireEvent.click(btn(/Lanjut ke Konfirmasi/i));
    await waitFor(() => expect(screen.getByText(/Usia:/)).toBeDefined());
    expect(screen.getByText(/Usia:/).textContent).toContain("0 Tahun");
  });

  it("isian anabul yang belum tervalidasi tidak bocor ke ringkasan", async () => {
    await toStep5();
    type(nameInput(), "Milo");
    fireEvent.click(btn(/Lanjut ke Konfirmasi/i));
    await waitFor(() => expect(screen.getByText(/Konfirmasi & Ringkasan Reservasi/i)).toBeDefined());

    fireEvent.click(screen.getAllByRole("button", { name: /Langkah 5: Data Anabul/i })[0]);
    await waitFor(() => expect(screen.getByText("Profil Anabul Kesayangan")).toBeDefined());
    type(nameInput(), "Nama Belum Disimpan");
    fireEvent.click(screen.getAllByRole("button", { name: /Langkah 6: Konfirmasi/i })[0]);
    await waitFor(() => expect(screen.getByText(/Milo/)).toBeDefined());
    expect(screen.queryByText(/Nama Belum Disimpan/)).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: /Langkah 5: Data Anabul/i })[0]);
    await waitFor(() => expect(nameInput().value).toBe("Nama Belum Disimpan"));
  });
});

describe("Tahap 5 — field dikelompokkan dalam section yang jelas", () => {
  const region = (name: string) => screen.getByRole("region", { name }) as HTMLElement;

  it("tiga section berjudul (h3) dalam urutan: Identitas Anabul, Detail Tambahan, Catatan untuk Groomer", () => {
    renderForm();
    const headings = within(form()).getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(["Identitas Anabul", "Detail Tambahan", "Catatan untuk Groomer"]);
    expect(within(form()).getAllByRole("region")).toHaveLength(3);
  });

  it("setiap field berada di section yang tepat; tidak ada field baru", () => {
    renderForm();
    const identity = region("Identitas Anabul");
    const detail = region("Detail Tambahan");
    const notes = region("Catatan untuk Groomer");

    expect(within(identity).getByLabelText(/Nama Panggilan Anabul/i)).toBe(nameInput());
    expect(within(identity).getByRole("radiogroup", { name: /Jenis Anabul/i })).toBe(typeGroup());
    expect(within(detail).getByLabelText(/Ras \/ Trah/i)).toBe(breedInput());
    expect(within(detail).getByLabelText(/Usia \(Tahun\)/i)).toBe(ageInput());
    expect(within(notes).getByLabelText(/Catatan Khusus/i)).toBe(notesInput());

    // tidak tercampur
    expect(within(detail).queryByLabelText(/Nama Panggilan Anabul/i)).toBeNull();
    expect(within(notes).queryByLabelText(/Ras \/ Trah/i)).toBeNull();
    // jumlah isian aktual tetap: nama, ras, usia, catatan (+ 4 pilihan jenis)
    expect(form().querySelectorAll("input, textarea")).toHaveLength(4);
    expect(within(typeGroup()).getAllByRole("radio")).toHaveLength(4);
  });

  it("kolom jenis kustom muncul di section Identitas; galat tampil di section field yang bermasalah", async () => {
    renderForm();
    type(nameInput(), "Gigi");
    fireEvent.click(typeRadio("Lainnya"));
    expect(within(region("Identitas Anabul")).getByLabelText(/Tuliskan jenis hewan/i)).toBe(customInput());

    type(ageInput(), "99");
    type(breedInput(), "R".repeat(51));
    submit();
    await waitFor(() => expect(document.getElementById("pet-age-error")).not.toBeNull());
    expect(region("Detail Tambahan").contains(document.getElementById("pet-age-error"))).toBe(true);
    expect(region("Detail Tambahan").contains(document.getElementById("pet-breed-error"))).toBe(true);
    expect(region("Identitas Anabul").contains(document.getElementById("pet-age-error"))).toBe(false);
  });
});
