import "server-only";

/**
 * Fixed-window rate limiter held in process memory.
 *
 * This is deliberately simple and has a known limitation: on a horizontally
 * scaled deployment each instance keeps its own counter, so the effective
 * limit is per-instance. For a single-venue site that is an acceptable first
 * line of defence against credential-stuffing and booking-spam, and the
 * interface matches Upstash/Redis closely enough that swapping the store later
 * touches only this file.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Bound the map so a flood of unique keys cannot grow it without limit.
const MAX_KEYS = 10_000;

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_KEYS) sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return {
      success: true,
      remaining: limit - 1,
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;

  return {
    success: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/** Tuned per endpoint class rather than one global number. */
export const RATE_LIMITS = {
  /** Sign-in requests: generous enough for a typo, tight enough to matter. */
  auth: { limit: 5, windowMs: 10 * 60 * 1000 },
  /** Creating a booking hold — the expensive, capacity-consuming operation. */
  booking: { limit: 10, windowMs: 10 * 60 * 1000 },
  /** Availability lookups, which are read-only but hit the database. */
  availability: { limit: 120, windowMs: 60 * 1000 },
  /** Contact form and other public writes. */
  contact: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const;

/**
 * Best-effort client identifier. Behind a proxy the socket address is the
 * proxy's, so the forwarded headers are preferred; both are spoofable by a
 * determined caller, which is why limits are a speed bump rather than a
 * security control.
 */
export function clientKey(headers: Headers, scope: string): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown";

  return `${scope}:${ip}`;
}
