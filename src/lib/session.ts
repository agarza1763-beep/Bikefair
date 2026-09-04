import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Re-checks role/suspension against the DB on every call rather than trusting the JWT's cached
 * values. The JWT only refreshes at sign-in, so without this, suspending a user or changing a
 * role would have no effect on an already-active session until it naturally expires.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("You must be signed in to do that.");

  const fresh = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isSuspended: true, role: true } });
  if (!fresh || fresh.isSuspended) throw new Error("Your account has been suspended.");

  return { ...session.user, role: fresh.role };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Admin access required.");
  return user;
}

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}
