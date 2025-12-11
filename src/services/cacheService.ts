/**
 * Intelligent Caching Service
 * Dramatically reduces API calls and prevents rate limiting
 */

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

export class CacheService {
    private cache = new Map<string, CacheEntry<any>>();
    private defaultTTL = 10 * 60 * 1000; // 10 minutes

    /**
     * Get cached data if valid
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set cache with optional custom TTL
     */
    set<T>(key: string, data: T, ttl?: number): void {
        const actualTTL = ttl || this.defaultTTL;
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + actualTTL
        };

        this.cache.set(key, entry);
    }

    /**
     * Check if key exists and is valid
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Clear specific key
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const entries = Array.from(this.cache.entries());
        const now = Date.now();

        return {
            totalEntries: this.cache.size,
            validEntries: entries.filter(([_, e]) => e.expiresAt > now).length,
            expiredEntries: entries.filter(([_, e]) => e.expiresAt <= now).length,
            oldestEntry: entries.length > 0
                ? Math.min(...entries.map(([_, e]) => e.timestamp))
                : null,
            newestEntry: entries.length > 0
                ? Math.max(...entries.map(([_, e]) => e.timestamp))
                : null
        };
    }

    /**
     * Clean up expired entries
     */
    cleanup(): number {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt <= now) {
                this.cache.delete(key);
                removed++;
            }
        }

        return removed;
    }
}

// Singleton instance
export const cacheService = new CacheService();

// Auto cleanup every 5 minutes
setInterval(() => {
    const removed = cacheService.cleanup();
    if (removed > 0) {
        console.log(`🧹 Cache cleanup: removed ${removed} expired entries`);
    }
}, 5 * 60 * 1000);
