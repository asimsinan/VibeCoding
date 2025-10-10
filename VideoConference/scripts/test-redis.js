/**
 * Redis Connection Test Script
 * Test Upstash Redis connection
 */

import dotenv from 'dotenv';
import { Redis } from '@upstash/redis';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function testRedisConnection() {
  try {
    console.log('🔍 Testing Upstash Redis connection...');
    
    // Test basic connection
    const pong = await redis.ping();
    console.log('✅ Redis ping response:', pong);
    
    // Test set/get operations
    await redis.set('test:key', 'Hello Upstash!');
    const value = await redis.get('test:key');
    console.log('✅ Redis set/get test:', value);
    
    // Test JSON operations
    const testData = { 
      message: 'Redis is working!', 
      timestamp: new Date().toISOString(),
      roomId: 'test-room-123'
    };
    
    await redis.setex('test:json', 60, JSON.stringify(testData));
    const jsonValue = await redis.get('test:json');
    // Upstash Redis automatically parses JSON, so no need to JSON.parse
    const parsedData = typeof jsonValue === 'string' ? JSON.parse(jsonValue) : jsonValue;
    console.log('✅ Redis JSON test:', parsedData);
    
    // Test list operations (for messages)
    await redis.lpush('test:messages', 'Message 1', 'Message 2', 'Message 3');
    const messages = await redis.lrange('test:messages', 0, -1);
    console.log('✅ Redis list test:', messages);
    
    // Test expiration
    await redis.setex('test:expire', 5, 'This will expire');
    console.log('✅ Redis expiration test: Key set with 5 second TTL');
    
    // Clean up test keys
    await redis.del('test:key', 'test:json', 'test:messages', 'test:expire');
    console.log('🧹 Cleaned up test keys');
    
    console.log('🎉 All Redis tests passed!');
    
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    process.exit(1);
  }
}

// Run the test
testRedisConnection();
