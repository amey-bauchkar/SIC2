/**
 * MandiMitra Backend: In-Memory TTL Response Cache
 * Mitigates upstream API rate limits and provides fallback resilience during downtime.
 * 
 * OWNER: Amay (Team Lead)
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

export class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  public get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const isStale = Date.now() - entry.cachedAt > entry.ttlMs;
    return { data: entry.data, isStale };
  }

  public set<T>(key: string, data: T, ttlMs: number = 3600000): void {
    this.cache.set(key, {
      data,
      cachedAt: Date.now(),
      ttlMs
    });
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new MemoryCache();
