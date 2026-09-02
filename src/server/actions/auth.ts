"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/validation";
import { sendMail } from "@/lib/mailer";
import { geocode } from "@/lib/geo";
import { BRAND_NAME } from "@/lib/constants";
import { requireUser } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isDisposableEmail } from "@/lib/disposable-email";
import { verifyTurnstileToken } from "@/lib/turnstile";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

/**
 * `website` is a honeypot: a field hidden from real users via CSS but visible to unsophisticated
 * bots that auto-fill every input. Any value there means it wasn't a human — reject silently with
 * a generic-looking success-shaped error so the bot doesn't learn its trick was caught.
 */
export async function signUpAction(input: unknown, honeypot?: string, turnstileToken?: string): Promise<ActionResult<{ email: string }>> {
  if (honeypot) return { ok: false, error: "Something went wrong. Please try again." };

  const ip = getClientIp(await headers());
  const rateLimit = checkRateLimit(`sign-up:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.ok) return { ok: false, error: rateLimit.error };

  const turnstileOk = await verifyTurnstileToken(turnstileToken);
  if (!turnstileOk) return { ok: false, error: "Verification failed. Please try again." };

  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password, city, state } = parsed.data;

  if (isDisposableEmail(email)) {
    return { ok: false, error: "Please use a permanent email address — temporary/disposable email providers aren't supported." };
  }

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

/** Always returns ok:true regardless of whether the email exists, so a sign-up screen can't be used to enumerate accounts. */
export async function requestPasswordResetAction(email: string): Promise<ActionResult> {
  const ip = getClientIp(await headers());
  const rateLimit = checkRateLimit(`password-reset:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rateLimit.ok) return { ok: false, error: rateLimit.error };

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (user) {
    const token = randomBytes(24).toString("hex");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 1000 * 60 * 60) },
    });
    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/reset-password?token=${token}`;
    await sendMail({
      to: normalizedEmail,
      subject: `Reset your ${BRAND_NAME} password`,
      text: `We received a request to reset your ${BRAND_NAME} password. This link expires in 1 hour and can only be used once:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    });
  }

  return { ok: true };
}

export async function resetPasswordAction(token: string, newPassword: string): Promise<ActionResult> {
  if (newPassword.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true };
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
