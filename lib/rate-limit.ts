/**
 * Simple in-memory sliding-window rate limiter for Next.js API routes.
 * For production at scale, replace the store with an Upstash Redis client.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Module-level store — persists across requests within one server process
const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes to prevent unbounded growth
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  /** Maximum requests allowed within the window */
  limit: number
  /** Window duration in seconds */
  windowSecs: number
  /** Key prefix to namespace different rules */
  prefix?: string
}

export interface RateLimitResult {
  success: boolean
  /** Remaining requests in current window */
  remaining: number
  /** Epoch ms when the window resets */
  resetAt: number
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowSecs, prefix = 'rl' } = options
  const key = `${prefix}:${identifier}`
  const now = Date.now()
  const windowMs = windowSecs * 1000

  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  entry.count += 1

  if (entry.count > limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Extract the best available client IP from a Next.js Request.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
