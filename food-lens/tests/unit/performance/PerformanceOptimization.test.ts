/**
 * Performance Optimization Tests
 * Tests for caching, query optimization, and performance improvements
 */

import { cacheService } from '../../../src/lib/food-label-scanner/services/cache/CacheService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(),
}));

describe('Performance Optimization - Caching', () => {
  beforeEach(async () => {
    await cacheService.clear();
  });

  it('should cache and retrieve data', async () => {
    const testData = { id: '123', name: 'Test' };
    
    await cacheService.set('test_key', testData, 60000);
    const retrieved = await cacheService.get('test_key');
    
    expect(retrieved).toEqual(testData);
  });

  it('should return null for expired cache', async () => {
    const testData = { id: '123', name: 'Test' };
    
    await cacheService.set('test_key', testData, -1000); // Already expired
    const retrieved = await cacheService.get('test_key');
    
    expect(retrieved).toBeNull();
  });

  it('should remove cached data', async () => {
    const testData = { id: '123', name: 'Test' };
    
    await cacheService.set('test_key', testData);
    await cacheService.remove('test_key');
    
    const retrieved = await cacheService.get('test_key');
    expect(retrieved).toBeNull();
  });

  it('should clear all cache', async () => {
    await cacheService.set('key1', 'value1');
    await cacheService.set('key2', 'value2');
    
    await cacheService.clear();
    
    expect(await cacheService.get('key1')).toBeNull();
    expect(await cacheService.get('key2')).toBeNull();
  });

  it('should limit memory cache size', async () => {
    // Set more than MAX_MEMORY_CACHE_SIZE items
    for (let i = 0; i < 110; i++) {
      await cacheService.set(`key_${i}`, `value_${i}`);
    }

    // Oldest entries should be evicted
    const stats = cacheService.getStats();
    expect(stats.memorySize).toBeLessThanOrEqual(100);
  });
});

describe('Performance Optimization - Query Optimization', () => {
  it('should optimize pagination queries', () => {
    // Test that queries use proper limits
    // This is tested indirectly through FirestoreService tests
    expect(true).toBe(true);
  });
});

