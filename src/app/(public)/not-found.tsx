import * as React from "react";
import Link from "next/link";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-primary text-3xl mb-4 shadow-xs">
        🐾
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
        Halaman Tidak Ditemukan
      </h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
        Maaf, halaman atau layanan yang Anda cari tidak tersedia, sedang dinonaktifkan, atau tautan telah berpindah alamat.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Button asChild variant="accent" size="default" className="font-semibold">
          <Link href="/">
            <Home className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Kembali ke Beranda
          </Link>
        </Button>
        <Button asChild variant="outline" size="default">
          <Link href="/services">
            <Search className="h-4 w-4 mr-1.5" aria-hidden="true" />
            Lihat Katalog Layanan
          </Link>
        </Button>
      </div>
    </div>
  );
}
