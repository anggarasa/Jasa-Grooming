"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save, FileText } from "lucide-react";
import { toast } from "sonner";

interface InternalNotesFormProps {
  bookingId: string;
  initialNotes: string | null;
  onNotesSaved?: (newNotes: string) => void;
}

export function InternalNotesForm({
  bookingId,
  initialNotes,
  onNotesSaved,
}: InternalNotesFormProps) {
  const [notes, setNotes] = React.useState<string>(initialNotes || "");
  const [prevInitialNotes, setPrevInitialNotes] = React.useState<string | null>(initialNotes);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [hasChanged, setHasChanged] = React.useState<boolean>(false);

  if (prevInitialNotes !== initialNotes) {
    setPrevInitialNotes(initialNotes);
    setNotes(initialNotes || "");
    setHasChanged(false);
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    setHasChanged(val !== (initialNotes || ""));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes: notes.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Gagal menyimpan catatan internal.");
      }

      toast.success("Catatan internal berhasil disimpan.");
      setHasChanged(false);
      if (onNotesSaved) {
        onNotesSaved(notes.trim());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="internal-notes-input"
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
        >
          <FileText className="h-3.5 w-3.5 text-accent" />
          Catatan Internal Staf
        </label>
        {hasChanged && (
          <span className="text-xs text-amber-600 font-medium animate-pulse">
            Ada perubahan belum disimpan
          </span>
        )}
      </div>

      <Textarea
        id="internal-notes-input"
        placeholder="Catatan khusus operasional tim (tidak terlihat oleh pelanggan), misal: 'Anabul sensitif di bagian telinga', 'Sudah bayar via transfer', dsb."
        value={notes}
        onChange={handleChange}
        rows={4}
        className="text-sm resize-none bg-background"
      />

      <div className="flex justify-end">
        <Button
          type="submit"
          size="sm"
          disabled={isSaving || !hasChanged}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Simpan Catatan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
