import { NextRequest } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/server";
import { validateCsrfOrigin } from "@/modules/auth/csrf.service";
import { resolveCalendarConflict } from "@/modules/integrations/google/google-conflict.service";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

const resolveConflictSchema = z
  .object({
    resolution: z.enum(["KEEP_LOCAL", "OVERWRITE_LOCAL", "IGNORE"]).optional(),
    action: z.enum(["RESTORE_LOCAL_TO_GOOGLE", "MARK_RESOLVED", "KEEP_LOCAL", "OVERWRITE_LOCAL", "IGNORE"]).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => data.resolution || data.action, {
    message: "Resolusi konflik wajib disertakan.",
  });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return apiError("Validasi CSRF gagal.", "CSRF_FORBIDDEN", 403);
  }

  try {
    const user = await requireRole([Role.OWNER, Role.ADMIN]);
    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Format JSON permintaan tidak valid.", "BAD_REQUEST", 400);
    }

    const parsed = resolveConflictSchema.parse(body);
    let resolution: "KEEP_LOCAL" | "OVERWRITE_LOCAL" | "IGNORE" = "KEEP_LOCAL";
    if (parsed.resolution) {
      resolution = parsed.resolution;
    } else if (parsed.action === "RESTORE_LOCAL_TO_GOOGLE" || parsed.action === "KEEP_LOCAL") {
      resolution = "KEEP_LOCAL";
    } else if (parsed.action === "MARK_RESOLVED" || parsed.action === "OVERWRITE_LOCAL") {
      resolution = "OVERWRITE_LOCAL";
    } else if (parsed.action === "IGNORE") {
      resolution = "IGNORE";
    }

    const updated = await resolveCalendarConflict({
      conflictId: id,
      resolution,
      userId: user.id,
      notes: parsed.notes,
    });

    return apiSuccess(updated, "Konflik kalender berhasil diselesaikan.");
  } catch (error) {
    return handleApiError(error, "Gagal menyelesaikan konflik kalender.");
  }
}
