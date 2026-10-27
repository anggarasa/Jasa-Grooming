"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { navSections, type NavItem } from "./nav-config";

interface DashboardCommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Entry extends NavItem {
  section: string;
}

const ALL_ENTRIES: Entry[] = navSections.flatMap((section) =>
  section.items
    .filter((item) => !item.disabled)
    .map((item) => ({ ...item, section: section.title }))
);

/**
 * Kotak pencarian menu (⌘K / Ctrl+K). Mencari di antara SEMUA menu backoffice dan
 * langsung membuka halamannya. Ini pencarian menu — bukan pencarian data; data
 * (reservasi, pelanggan, layanan) tetap dicari lewat kolom cari di halamannya.
 */
export function DashboardCommandMenu({ open, onOpenChange }: DashboardCommandMenuProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[16%] max-h-[70vh] max-w-xl -translate-y-0 gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl [&>button]:hidden"
        aria-label="Pencarian menu"
      >
        <DialogTitle className="sr-only">Cari menu</DialogTitle>
        <DialogDescription className="sr-only">
          Ketik nama menu lalu tekan Enter untuk membukanya. Gunakan panah atas dan bawah untuk memilih.
        </DialogDescription>
        {/* DialogContent dilepas saat tertutup, jadi CommandPanel (dan state-nya) selalu mulai bersih. */}
        <CommandPanel onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function CommandPanel({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement | null>(null);

  const results = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return ALL_ENTRIES;
    return ALL_ENTRIES.filter(
      (entry) =>
        entry.title.toLowerCase().includes(term) ||
        entry.section.toLowerCase().includes(term)
    );
  }, [query]);

  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (results.length === 0 ? 0 : (i - 1 + results.length) % results.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex];
      if (target) go(target.href);
    }
  };

  return (
    <>
    <div className="flex items-center gap-3 border-b border-border px-4">
      <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        autoFocus
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0); // hasil berubah -> pilihan kembali ke atas
        }}
        onKeyDown={onKeyDown}
        placeholder="Cari menu atau halaman…"
        aria-label="Cari menu atau halaman"
        role="combobox"
        aria-expanded="true"
        aria-controls="dashboard-command-list"
        aria-activedescendant={results[activeIndex] ? `cmd-${activeIndex}` : undefined}
        className="admin-bare h-14 flex-1 border-0 bg-transparent px-0 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground"
      />
      <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline">
        Esc
      </kbd>
    </div>

    <ul
      id="dashboard-command-list"
      ref={listRef}
      role="listbox"
      aria-label="Hasil pencarian menu"
      className="admin-scroll max-h-[44vh] overflow-y-auto p-2"
    >
      {results.length === 0 ? (
        <li className="px-3 py-10 text-center text-sm text-muted-foreground">
          Tidak ada menu yang cocok dengan &ldquo;{query}&rdquo;.
        </li>
      ) : (
        results.map((entry, index) => {
          const Icon = entry.icon;
          const active = index === activeIndex;
          return (
            <li
              key={entry.href}
              id={`cmd-${index}`}
              data-index={index}
              role="option"
              aria-selected={active}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => go(entry.href)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                active ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card",
                  active && "border-primary/25 text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">{entry.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{entry.section}</span>
              </span>
              {active && (
                <CornerDownLeft aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </li>
          );
        })
      )}
    </ul>
    </>
  );
}
