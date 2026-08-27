"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validation";
import { sendMail } from "@/lib/mailer";
import { geocode } from "@/lib/geo";
import { BRAND_NAME } from "@/lib/constants";
import { requireUser } from "@/lib/session";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

export async function signUpAction(input: unknown): Promise<ActionResult<{ email: string }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password, city, state } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const point = await geocode(city, state);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, city, state, lat: point.lat, lng: point.lng },
  });

  const token = randomBytes(24).toString("hex");
  await prisma.emailVerificationToken.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/verify-email?token=${token}`;
  await sendMail({
    to: email,
    subject: `Verify your ${BRAND_NAME} email`,
    text: `Welcome to ${BRAND_NAME}! Verify your email by visiting: ${verifyUrl}`,
  });

  return { ok: true, data: { email } };
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return { ok: false, error: "This verification link is invalid or has expired." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.verification.create({ data: { userId: record.userId, type: "EMAIL", status: "VERIFIED", verifiedAt: new Date(), provider: "stub" } }),
    prisma.emailVerificationToken.delete({ where: { id: record.id } }),
  ]);
  await recalculateVerificationLevel(record.userId);
  return { ok: true };
}

/**
 * DEMO-ONLY phone verification: no SMS provider (e.g. Twilio) is configured in this MVP, so this
 * skips sending a real one-time code. It's clearly labeled "(Demo)" in the UI — see
 * VerifyPhoneButton — so BikeFair never implies a real carrier-verified phone check happened.
 * Wire up a real OTP provider here before relying on this for anything beyond a demo.
 */
export async function verifyPhoneDemoAction(phone: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!phone.trim()) return { ok: false, error: "Enter a phone number." };
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { phone, phoneVerified: true } }),
    prisma.verification.create({ data: { userId: user.id, type: "PHONE", status: "VERIFIED", verifiedAt: new Date(), provider: "stub-demo" } }),
  ]);
  await recalculateVerificationLevel(user.id);
  return { ok: true };
}

/**
 * Recomputes a user's verification level from completed verifications + trusted-seller signals.
 * BASIC: default. VERIFIED: email + phone verified. TRUSTED: verified + a track record of
 * completed transactions, good ratings, account age, and no unresolved reports.
 */
export async function recalculateVerificationLevel(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      verifications: true,
      transactionsAsSeller: { where: { status: "COMPLETED" } },
      reviewsReceived: true,
      reportsAgainst: { where: { status: { in: ["OPEN", "IN_REVIEW"] } } },
    },
  });
  if (!user) return;

  const emailVerified = user.verifications.some((v) => v.type === "EMAIL" && v.status === "VERIFIED");
  const phoneVerified = user.verifications.some((v) => v.type === "PHONE" && v.status === "VERIFIED");
  const identityVerified = user.verifications.some((v) => v.type === "IDENTITY" && v.status === "VERIFIED");

  let level: "BASIC" | "VERIFIED" | "TRUSTED" = "BASIC";
  if (emailVerified && phoneVerified) level = "VERIFIED";
  if (identityVerified) level = "VERIFIED";

  const accountAgeDays = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const avgRating = user.reviewsReceived.length
    ? user.reviewsReceived.reduce((s, r) => s + r.overallRating, 0) / user.reviewsReceived.length
    : 0;
  const isTrustedSeller =
    level === "VERIFIED" &&
    user.transactionsAsSeller.length >= 3 &&
    avgRating >= 4.5 &&
    accountAgeDays >= 30 &&
    user.reportsAgainst.length === 0;

  if (isTrustedSeller) level = "TRUSTED";

  await prisma.user.update({ where: { id: userId }, data: { verificationLevel: level, isTrustedSeller } });
}
