import { Redis } from '@upstash/redis'

/**
 * Rate limiter for Next.js API routes.
 * Supports both Upstash Redis (if UPSTASH_REDIS_REST_URL is configured)
 * and an in-memory fallback for local development.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, RateLimitEntry>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.resetAt < now) memoryStore.delete(key)
    }
  }, 5 * 60 * 1000)
}

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? Redis.fromEnv()
  : null

export interface RateLimitOptions {
  limit: number
  windowSecs: number
  prefix?: string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { limit, windowSecs, prefix = 'rl' } = options
  const key = `${prefix}:${identifier}`
  const now = Date.now()
  const windowMs = windowSecs * 1000

  if (redis) {
    try {
      const pipeline = redis.pipeline()
      pipeline.incr(key)
      pipeline.pttl(key)
      const [countResult, ttlResult] = await pipeline.exec() as [number, number]
      
      let count = countResult
      let ttl = ttlResult
      let resetAt = now + ttl

      if (count === 1 || ttl < 0) {
        await redis.pexpire(key, windowMs)
        resetAt = now + windowMs
      }

      if (count > limit) {
        return { success: false, remaining: 0, resetAt }
      }

      return { success: true, remaining: limit - count, resetAt }

    } catch (error) {
      console.error("[RateLimit] Redis failed, falling back to memory:", error)
    }
  }

  const entry = memoryStore.get(key)
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs
    memoryStore.set(key, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  entry.count += 1
  if (entry.count > limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
