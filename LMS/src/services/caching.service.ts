import { PrismaClient } from '@/generated/prisma';

/**
 * Cache configuration interface
 */
interface CacheConfig {
  defaultTTL: number; // Default time-to-live in seconds
  maxSize: number; // Maximum number of items in cache
  cleanupInterval: number; // Cleanup interval in milliseconds
}

/**
 * Cache item interface
 */
interface CacheItem<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Cache statistics interface
 */
interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
  memoryUsage: number;
}

/**
 * Comprehensive caching service for frequently accessed data
 */
export class CachingService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
  };
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: config.defaultTTL || 300, // 5 minutes
      maxSize: config.maxSize || 1000,
      cleanupInterval: config.cleanupInterval || 60000, // 1 minute
    };

    this.startCleanupTimer();
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();
    this.stats.hits++;

    return item.value;
  }

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time-to-live in seconds (optional)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTTL) * 1000;

    // Check if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
    });
  }

  /**
   * Delete a value from cache
   * @param key - Cache key
   * @returns True if key existed and was deleted
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   * @returns True if key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Get all cache keys
   * @returns Array of cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   * @returns Number of items in cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Evict least recently used item
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * Estimate memory usage
   * @returns Estimated memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;

    for (const [key, item] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16 string
      totalSize += JSON.stringify(item.value).length * 2;
      totalSize += 32; // Overhead for object properties
    }

    return totalSize;
  }

  /**
   * Destroy the cache service
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }
}

/**
 * Cache key generators for different data types
 */
export class CacheKeyGenerator {
  /**
   * Generate cache key for user data
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @returns Cache key
   */
  static user(userId: string, organizationId: string): string {
    return `user:${organizationId}:${userId}`;
  }

  /**
   * Generate cache key for organization data
   * @param organizationId - Organization ID
   * @returns Cache key
   */
  static organization(organizationId: string): string {
    return `org:${organizationId}`;
  }

  /**
   * Generate cache key for course data
   * @param courseId - Course ID
   * @param organizationId - Organization ID
   * @returns Cache key
   */
  static course(courseId: string, organizationId: string): string {
    return `course:${organizationId}:${courseId}`;
  }

  /**
   * Generate cache key for course list
   * @param organizationId - Organization ID
   * @param filters - Optional filters
   * @returns Cache key
   */
  static courseList(organizationId: string, filters?: Record<string, any>): string {
    const filterStr = filters ? `:${JSON.stringify(filters)}` : '';
    return `courses:${organizationId}${filterStr}`;
  }

  /**
   * Generate cache key for module data
   * @param moduleId - Module ID
   * @returns Cache key
   */
  static module(moduleId: string): string {
    return `module:${moduleId}`;
  }

  /**
   * Generate cache key for lesson data
   * @param lessonId - Lesson ID
   * @returns Cache key
   */
  static lesson(lessonId: string): string {
    return `lesson:${lessonId}`;
  }

  /**
   * Generate cache key for quiz data
   * @param quizId - Quiz ID
   * @returns Cache key
   */
  static quiz(quizId: string): string {
    return `quiz:${quizId}`;
  }

  /**
   * Generate cache key for enrollment data
   * @param enrollmentId - Enrollment ID
   * @returns Cache key
   */
  static enrollment(enrollmentId: string): string {
    return `enrollment:${enrollmentId}`;
  }

  /**
   * Generate cache key for user enrollments
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @returns Cache key
   */
  static userEnrollments(userId: string, organizationId: string): string {
    return `enrollments:${organizationId}:${userId}`;
  }

  /**
   * Generate cache key for progress data
   * @param userId - User ID
   * @param lessonId - Lesson ID
   * @returns Cache key
   */
  static progress(userId: string, lessonId: string): string {
    return `progress:${userId}:${lessonId}`;
  }

  /**
   * Generate cache key for user progress in course
   * @param userId - User ID
   * @param courseId - Course ID
   * @returns Cache key
   */
  static courseProgress(userId: string, courseId: string): string {
    return `course-progress:${userId}:${courseId}`;
  }

  /**
   * Generate cache key for quiz attempt
   * @param attemptId - Quiz attempt ID
   * @returns Cache key
   */
  static quizAttempt(attemptId: string): string {
    return `quiz-attempt:${attemptId}`;
  }

  /**
   * Generate cache key for file data
   * @param fileId - File ID
   * @returns Cache key
   */
  static file(fileId: string): string {
    return `file:${fileId}`;
  }

  /**
   * Generate cache key for search results
   * @param query - Search query
   * @param organizationId - Organization ID
   * @param filters - Optional filters
   * @returns Cache key
   */
  static search(query: string, organizationId: string, filters?: Record<string, any>): string {
    const filterStr = filters ? `:${JSON.stringify(filters)}` : '';
    return `search:${organizationId}:${query}${filterStr}`;
  }

  /**
   * Generate cache key for statistics
   * @param type - Statistics type
   * @param organizationId - Organization ID
   * @param params - Optional parameters
   * @returns Cache key
   */
  static statistics(type: string, organizationId: string, params?: Record<string, any>): string {
    const paramStr = params ? `:${JSON.stringify(params)}` : '';
    return `stats:${organizationId}:${type}${paramStr}`;
  }
}

/**
 * Cache decorator for service methods
 */
export function cached(
  keyGenerator: (...args: any[]) => string,
  ttl?: number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const cache = new CachingService();

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator(...args);
      const cachedValue = cache.get(key);

      if (cachedValue !== null) {
        return cachedValue;
      }

      const result = await method.apply(this, args);
      cache.set(key, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 */
export function invalidateCache(
  keyGenerator: (...args: any[]) => string | string[]
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const cache = new CachingService();

    descriptor.value = async function (...args: any[]) {
      const result = await method.apply(this, args);
      
      const keys = keyGenerator(...args);
      const keyArray = Array.isArray(keys) ? keys : [keys];
      
      keyArray.forEach(key => cache.delete(key));

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache service singleton
 */
export const cacheService = new CachingService({
  defaultTTL: 300, // 5 minutes
  maxSize: 1000,
  cleanupInterval: 60000, // 1 minute
});

/**
 * Cache middleware for API routes
 */
export function withCache<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  options: {
    keyGenerator: (...args: T) => string;
    ttl?: number;
    skipCache?: (...args: T) => boolean;
  }
) {
  return async (...args: T): Promise<Response> => {
    // Skip cache if specified
    if (options.skipCache?.(...args)) {
      return handler(...args);
    }

    const key = options.keyGenerator(...args);
    const cachedResponse = cacheService.get<Response>(key);

    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await handler(...args);
    
    // Only cache successful responses
    if (response.status === 200) {
      cacheService.set(key, response, options.ttl);
    }

    return response;
  };
}
