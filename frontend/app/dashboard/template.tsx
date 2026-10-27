import * as React from "react";

/**
 * Template dashboard: Next.js memasang ulang berkas ini setiap kali pengguna
 * berpindah menu, sehingga animasi masuk ikut berjalan di SETIAP halaman tanpa
 * perlu menambahkan apa pun di masing-masing halaman.
 *
 * Kerangka (sidebar + topbar) berada di `layout.tsx` sehingga TIDAK ikut
 * dianimasikan — hanya isi halamannya, persis seperti perpindahan tab yang halus.
 * Animasinya memakai `backwards`, jadi saat "kurangi gerakan" aktif konten tetap
 * tampil utuh tanpa gerak.
 */
export default function DashboardTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="motion-admin-page">{children}</div>;
}
