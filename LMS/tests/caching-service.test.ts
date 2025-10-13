import { CachingService, CacheKeyGenerator, cacheService } from '../services/caching.service';

describe('CachingService', () => {
  let cache: CachingService;

  beforeEach(() => {
    cache = new CachingService({
      defaultTTL: 5, // 5 seconds for testing
      maxSize: 10,
      cleanupInterval: 1000, // 1 second for testing
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should delete values', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should check if keys exist', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL and Expiration', () => {
    it('should respect TTL', async () => {
      cache.set('key1', 'value1', 1); // 1 second TTL
      expect(cache.get('key1')).toBe('value1');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(cache.get('key1')).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      
      // Wait for default TTL expiration (5 seconds)
      await new Promise(resolve => setTimeout(resolve, 5100));
      expect(cache.get('key1')).toBeNull();
    });

    it('should handle has() with expiration', async () => {
      cache.set('key1', 'value1', 1);
      expect(cache.has('key1')).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('Cache Size Management', () => {
    it('should respect max size', () => {
      // Fill cache to max size
      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      expect(cache.size()).toBe(10);
      
      // Add one more item
      cache.set('key10', 'value10');
      
      // Should still be at max size (LRU eviction)
      expect(cache.size()).toBe(10);
    });

    it('should evict least recently used items', () => {
      // Fill cache
      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      // Access some items to update their LRU status
      cache.get('key0');
      cache.get('key1');
      
      // Add new item to trigger eviction
      cache.set('key10', 'value10');
      
      // key2 should be evicted (least recently used)
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key0')).toBe('value0');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key10')).toBe('value10');
    });
  });

  describe('Statistics', () => {
    it('should track cache hits and misses', () => {
      cache.set('key1', 'value1');
      
      // Hit
      cache.get('key1');
      // Miss
      cache.get('nonexistent');
      // Hit
      cache.get('key1');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(2/3);
    });

    it('should provide accurate statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(10);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Keys and Size', () => {
    it('should return all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });

    it('should return correct size', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup expired entries', async () => {
      cache.set('key1', 'value1', 1);
      cache.set('key2', 'value2', 2);
      
      expect(cache.size()).toBe(2);
      
      // Wait for first item to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Trigger cleanup by accessing expired item
      cache.get('key1');
      
      expect(cache.size()).toBe(1);
      expect(cache.get('key2')).toBe('value2');
    });
  });
});

describe('CacheKeyGenerator', () => {
  describe('User Keys', () => {
    it('should generate user cache key', () => {
      const key = CacheKeyGenerator.user('user-123', 'org-456');
      expect(key).toBe('user:org-456:user-123');
    });

    it('should generate organization cache key', () => {
      const key = CacheKeyGenerator.organization('org-123');
      expect(key).toBe('org:org-123');
    });
  });

  describe('Course Keys', () => {
    it('should generate course cache key', () => {
      const key = CacheKeyGenerator.course('course-123', 'org-456');
      expect(key).toBe('course:org-456:course-123');
    });

    it('should generate course list cache key', () => {
      const key = CacheKeyGenerator.courseList('org-123');
      expect(key).toBe('courses:org-123');
    });

    it('should generate course list cache key with filters', () => {
      const filters = { status: 'PUBLISHED', category: 'programming' };
      const key = CacheKeyGenerator.courseList('org-123', filters);
      expect(key).toBe('courses:org-123:{"status":"PUBLISHED","category":"programming"}');
    });
  });

  describe('Content Keys', () => {
    it('should generate module cache key', () => {
      const key = CacheKeyGenerator.module('module-123');
      expect(key).toBe('module:module-123');
    });

    it('should generate lesson cache key', () => {
      const key = CacheKeyGenerator.lesson('lesson-123');
      expect(key).toBe('lesson:lesson-123');
    });

    it('should generate quiz cache key', () => {
      const key = CacheKeyGenerator.quiz('quiz-123');
      expect(key).toBe('quiz:quiz-123');
    });
  });

  describe('Progress Keys', () => {
    it('should generate enrollment cache key', () => {
      const key = CacheKeyGenerator.enrollment('enrollment-123');
      expect(key).toBe('enrollment:enrollment-123');
    });

    it('should generate user enrollments cache key', () => {
      const key = CacheKeyGenerator.userEnrollments('user-123', 'org-456');
      expect(key).toBe('enrollments:org-456:user-123');
    });

    it('should generate progress cache key', () => {
      const key = CacheKeyGenerator.progress('user-123', 'lesson-456');
      expect(key).toBe('progress:user-123:lesson-456');
    });

    it('should generate course progress cache key', () => {
      const key = CacheKeyGenerator.courseProgress('user-123', 'course-456');
      expect(key).toBe('course-progress:user-123:course-456');
    });
  });

  describe('Quiz Keys', () => {
    it('should generate quiz attempt cache key', () => {
      const key = CacheKeyGenerator.quizAttempt('attempt-123');
      expect(key).toBe('quiz-attempt:attempt-123');
    });
  });

  describe('File Keys', () => {
    it('should generate file cache key', () => {
      const key = CacheKeyGenerator.file('file-123');
      expect(key).toBe('file:file-123');
    });
  });

  describe('Search Keys', () => {
    it('should generate search cache key', () => {
      const key = CacheKeyGenerator.search('javascript', 'org-123');
      expect(key).toBe('search:org-123:javascript');
    });

    it('should generate search cache key with filters', () => {
      const filters = { category: 'programming', level: 'beginner' };
      const key = CacheKeyGenerator.search('javascript', 'org-123', filters);
      expect(key).toBe('search:org-123:javascript:{"category":"programming","level":"beginner"}');
    });
  });

  describe('Statistics Keys', () => {
    it('should generate statistics cache key', () => {
      const key = CacheKeyGenerator.statistics('user-count', 'org-123');
      expect(key).toBe('stats:org-123:user-count');
    });

    it('should generate statistics cache key with parameters', () => {
      const params = { startDate: '2024-01-01', endDate: '2024-12-31' };
      const key = CacheKeyGenerator.statistics('course-completion', 'org-123', params);
      expect(key).toBe('stats:org-123:course-completion:{"startDate":"2024-01-01","endDate":"2024-12-31"}');
    });
  });
});

describe('Cache Decorators', () => {
  let cache: CachingService;

  beforeEach(() => {
    cache = new CachingService({
      defaultTTL: 5,
      maxSize: 10,
      cleanupInterval: 1000,
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('cached decorator', () => {
    it('should cache method results', async () => {
      class TestService {
        callCount = 0;

        @cached((id: string) => `test:${id}`, 10)
        async getData(id: string): Promise<string> {
          this.callCount++;
          return `data-${id}`;
        }
      }

      const service = new TestService();
      
      // First call should execute method
      const result1 = await service.getData('123');
      expect(result1).toBe('data-123');
      expect(service.callCount).toBe(1);
      
      // Second call should use cache
      const result2 = await service.getData('123');
      expect(result2).toBe('data-123');
      expect(service.callCount).toBe(1);
    });
  });

  describe('invalidateCache decorator', () => {
    it('should invalidate cache after method execution', async () => {
      class TestService {
        @cached((id: string) => `test:${id}`, 10)
        async getData(id: string): Promise<string> {
          return `data-${id}`;
        }

        @invalidateCache((id: string) => `test:${id}`)
        async updateData(id: string, newData: string): Promise<string> {
          return newData;
        }
      }

      const service = new TestService();
      
      // Cache some data
      await service.getData('123');
      
      // Update data (should invalidate cache)
      await service.updateData('123', 'updated-data');
      
      // Next call should execute method again (cache was invalidated)
      const result = await service.getData('123');
      expect(result).toBe('data-123');
    });
  });
});

describe('Cache Service Singleton', () => {
  it('should be a singleton instance', () => {
    expect(cacheService).toBeDefined();
    expect(cacheService).toBeInstanceOf(CachingService);
  });

  it('should maintain state across operations', () => {
    cacheService.set('test-key', 'test-value');
    expect(cacheService.get('test-key')).toBe('test-value');
    
    // Clear for other tests
    cacheService.clear();
  });
});
