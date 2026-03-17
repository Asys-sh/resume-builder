/**
 * Simple in-memory rate limiter using a sliding-window counter.
 *
 *  Map for an Upstash Redis counter (@upstash/ratelimit) if multiple servers.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically prune expired entries to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 60_000);

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param identifier  Unique key, e.g. `ip:${ip}` or `user:${userId}`
 * @param limit       Max requests allowed in the window
 * @param windowMs    Window size in milliseconds
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Convenience: returns a 429 Response when the limit is exceeded, or null if OK. */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): Response | null {
  const result = rateLimit(identifier, limit, windowMs);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(
            Math.ceil((result.resetAt - Date.now()) / 1000),
          ),
        },
      },
    );
  }
  return null;
}
