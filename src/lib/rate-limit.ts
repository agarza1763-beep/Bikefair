/**
 * Lightweight in-memory rate limiter — no external store (e.g. Upstash) required. Keyed per
 * warm serverless instance, so it isn't perfectly consistent across multiple concurrent Vercel
 * instances, but it meaningfully throttles naive scripted abuse (mass sign-ups, credential
 * stuffing, message spam) at this app's current traffic level. Upgrade to a shared store like
 * Upstash Redis if/when traffic grows enough that per-instance limits stop being enough.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Prevent unbounded memory growth on a long-lived warm instance.
const cleanupInterval = setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  },
  5 * 60 * 1000
);
cleanupInterval.unref?.();

export function checkRateLimit(key: string, opts: { limit: number; windowMs: number }): { ok: true } | { ok: false; error: string } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true };
  }

  if (bucket.count >= opts.limit) {
    const secondsLeft = Math.ceil((bucket.resetAt - now) / 1000);
    const waitLabel = secondsLeft >= 60 ? `${Math.ceil(secondsLeft / 60)} minute(s)` : `${secondsLeft}s`;
    return { ok: false, error: `Too many attempts. Please try again in ${waitLabel}.` };
  }

  bucket.count += 1;
  return { ok: true };
}

export function getClientIp(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}
