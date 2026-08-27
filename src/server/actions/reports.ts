"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { reportSchema } from "@/lib/validation";
import type { ActionResult } from "./auth";

export async function submitReportAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid report." };

  await prisma.report.create({
    data: {
      reporterId: user.id,
      type: parsed.data.type,
      description: parsed.data.description,
      listingId: parsed.data.listingId || null,
      reportedUserId: parsed.data.reportedUserId || null,
    },
  });

  // Suspicion of a stolen bicycle is routed into the serial-number review workflow rather than any
  // automatic public accusation — an admin reviews it (see /admin/reports and /admin/serial-numbers).
  if (parsed.data.type === "STOLEN_SUSPECTED" && parsed.data.listingId) {
    await prisma.serialNumberReview.upsert({
      where: { listingId: parsed.data.listingId },
      update: { status: "REVIEW_REQUIRED" },
      create: { listingId: parsed.data.listingId, status: "REVIEW_REQUIRED" },
    });
    await prisma.bikeListing.update({ where: { id: parsed.data.listingId }, data: { serialStatus: "REVIEW_REQUIRED" } });
  }

  return { ok: true };
}
