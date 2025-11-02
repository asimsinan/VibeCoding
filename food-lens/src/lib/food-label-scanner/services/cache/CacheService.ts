/**
 * Cache Service
 * Provides in-memory and persistent caching for improved performance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../../utils/logger';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 3600000; // 1 hour in milliseconds
  private readonly MAX_MEMORY_CACHE_SIZE = 100;
  private hitCount = 0;
  private missCount = 0;

  /**
   * Get data from cache (memory first, then persistent)
   * Tracks hit/miss statistics for performance monitoring
   * 
   * @param key - Cache key
   * @returns Cached data or null if not found/expired
   */
  public async get<T>(key: string): Promise<T | null> {
    // Check memory cache first (fastest)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      this.hitCount++;
      logger.debug(`Cache hit (memory): ${key}`);
      return memoryEntry.data as T;
    }

    // Check persistent cache (slower but persistent)
    try {
      const persistentData = await AsyncStorage.getItem(`cache_${key}`);
      if (persistentData) {
        const entry: CacheEntry<T> = JSON.parse(persistentData);
        if (this.isValid(entry)) {
          this.hitCount++;
          logger.debug(`Cache hit (persistent): ${key}`);
          // Promote to memory cache for faster future access
          this.setMemoryCache(key, entry);
          return entry.data;
        } else {
          // Expired, remove from persistent cache
          await AsyncStorage.removeItem(`cache_${key}`);
          this.missCount++;
        }
      } else {
        this.missCount++;
      }
    } catch (error) {
      this.missCount++;
      logger.warn(`Failed to read from persistent cache: ${key}`, { error });
    }

    logger.debug(`Cache miss: ${key}`);
    return null;
  }

  /**
   * Set data in cache (both memory and persistent)
   */
  public async set<T>(
    key: string,
    data: T,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    // Set in memory cache
    this.setMemoryCache(key, entry);

    // Set in persistent cache
    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      logger.debug(`Cache set: ${key} (TTL: ${ttl}ms)`);
    } catch (error) {
      logger.warn(`Failed to write to persistent cache: ${key}`, { error });
    }
  }

  /**
   * Remove data from cache
   */
  public async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
      logger.debug(`Cache removed: ${key}`);
    } catch (error) {
      logger.warn(`Failed to remove from persistent cache: ${key}`, { error });
    }
  }

  /**
   * Clear all cache
   */
  public async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      logger.info('Cache cleared');
    } catch (error) {
      logger.warn('Failed to clear persistent cache', { error });
    }
  }

  /**
   * Check if cache entry is valid (not expired)
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() < entry.expiresAt;
  }

  /**
   * Set in memory cache with size limit
   */
  private setMemoryCache<T>(key: string, entry: CacheEntry<T>): void {
    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.MAX_MEMORY_CACHE_SIZE) {
      const oldestKey = Array.from(this.memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, entry);
  }

  /**
   * Get cache statistics for performance monitoring
   * 
   * @returns Cache statistics including hit rate
   */
  public getStats(): {
    memorySize: number;
    memoryHitRate: number;
    totalHits: number;
    totalMisses: number;
    persistentKeys: number;
  } {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 
      ? (this.hitCount / totalRequests) * 100 
      : 0;

    return {
      memorySize: this.memoryCache.size,
      memoryHitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
      totalHits: this.hitCount,
      totalMisses: this.missCount,
      persistentKeys: 0, // Would require AsyncStorage query for accurate count
    };
  }

  /**
   * Reset cache statistics (useful for testing)
   */
  public resetStats(): void {
    this.hitCount = 0;
    this.missCount = 0;
  }
}

export const cacheService = new CacheService();

