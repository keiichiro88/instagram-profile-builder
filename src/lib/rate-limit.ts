/**
 * Simple in-memory rate limiter (per IP, sliding window).
 * Vercel serverless: each cold start resets the map, which is acceptable
 * as a lightweight first layer of protection.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Check if the request should be rate-limited.
 * @returns `true` if allowed, `false` if limit exceeded
 */
export function checkRateLimit(
  ip: string,
  limit: number = 20,
  windowMs: number = 60_000,
): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetTime) {
    store.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count < limit) {
    entry.count++;
    return true;
  }

  return false;
}

/**
 * Extract client IP from request headers (Vercel / Cloudflare / fallback).
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
