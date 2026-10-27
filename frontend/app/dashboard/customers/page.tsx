import * as React from "react";
import { Users } from "lucide-react";
import { CustomersTable } from "@/components/dashboard/customers/CustomersTable";

export const instant = false;

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Direktori Pelanggan
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data kontak pelanggan, riwayat kunjungan anabul, dan informasi preferensi perawatan.
          </p>
        </div>
      </div>

      <CustomersTable />
    </div>
  );
}
