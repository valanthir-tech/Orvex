/**
 * Product Cache Layer
 * 
 * In-memory TTL cache for ERPNext product data. Prevents every storefront
 * page load from hitting ERPNext directly.
 * 
 * Cache is per-tenant, per-key. Default TTL: 5 minutes.
 * In production with multiple serverless instances, swap this for Redis
 * (the redis package is already installed).
 */

interface CacheEntry<T> {
    data: T
    expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL_MS = 5 * 60 * 1000 // 5 minutes

function cacheKey(tenantId: string, key: string): string {
    return `${tenantId}:${key}`
}

export function getCached<T>(tenantId: string, key: string): T | null {
    const k = cacheKey(tenantId, key)
    const entry = cache.get(k) as CacheEntry<T> | undefined
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
        cache.delete(k)
        return null
    }
    return entry.data
}

export function setCached<T>(tenantId: string, key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
    const k = cacheKey(tenantId, key)
    cache.set(k, { data, expiresAt: Date.now() + ttlMs })
}

export function invalidateCache(tenantId: string, key?: string): void {
    if (key) {
        cache.delete(cacheKey(tenantId, key))
    } else {
        // Invalidate all entries for this tenant
        for (const k of cache.keys()) {
            if (k.startsWith(`${tenantId}:`)) {
                cache.delete(k)
            }
        }
    }
}

/**
 * Cache-through helper. Returns cached data or fetches and caches it.
 */
export async function cachedFetch<T>(
    tenantId: string,
    key: string,
    fetcher: () => Promise<T>,
    ttlMs = DEFAULT_TTL_MS
): Promise<T> {
    const cached = getCached<T>(tenantId, key)
    if (cached !== null) return cached

    const data = await fetcher()
    setCached(tenantId, key, data, ttlMs)
    return data
}
