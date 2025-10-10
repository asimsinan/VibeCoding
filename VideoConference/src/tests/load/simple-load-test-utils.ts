/**
 * Simplified Load Testing
 * Realistic load testing that won't overwhelm the test environment
 */

import { DatabaseService } from '../../lib/video-conferencing/services/database.service';
import { AuthService } from '../../lib/auth/auth.service';
import { RoomService } from '../../lib/video-conferencing/services/room.service';

// Simplified load testing utilities
export class SimpleLoadTestUtils {
  static async createTestUser(): Promise<{ id: string; email: string; password: string }> {
    const authService = new AuthService(DatabaseService.getInstance());
    const email = `loadtest${Date.now()}@example.com`;
    const password = 'LoadTest123!';
    
    try {
      const result = await authService.register({ email, password, name: 'Load Test User' });
      return { id: result.user.id, email, password };
    } catch (error) {
      // User might already exist, try to login
      try {
        const loginResult = await authService.login(email, password);
        return { id: loginResult.user.id, email, password };
      } catch (loginError) {
        throw new Error(`Failed to create/login user: ${loginError}`);
      }
    }
  }
  
  static async createTestRoom(createdBy: string): Promise<{ id: string; name: string }> {
    const roomService = new RoomService(DatabaseService.getInstance());
    
    try {
      const room = await roomService.createRoom({
        name: `Load Test Room ${Date.now()}`,
        description: 'Room for load testing',
        maxParticipants: 50,
        isPrivate: false,
        createdBy
      });
      return { id: room.id, name: room.name };
    } catch (error) {
      throw new Error(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  static async simulateConcurrentOperations(
    operationCount: number,
    operation: (index: number) => Promise<any>
  ): Promise<Array<{ success: boolean; duration: number; error?: string }>> {
    const results = [];
    const promises = [];
    
    for (let i = 0; i < operationCount; i++) {
      promises.push(
        (async () => {
          const startTime = Date.now();
          try {
            await operation(i);
            const duration = Date.now() - startTime;
            results.push({ success: true, duration });
          } catch (error) {
            const duration = Date.now() - startTime;
            results.push({ 
              success: false, 
              duration, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        })()
      );
    }
    
    await Promise.all(promises);
    return results;
  }
  
  static calculateStats(results: Array<{ success: boolean; duration: number; error?: string }>) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const durations = successful.map(r => r.duration);
    
    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / results.length) * 100,
      averageResponseTime: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      minResponseTime: durations.length > 0 ? Math.min(...durations) : 0,
      maxResponseTime: durations.length > 0 ? Math.max(...durations) : 0,
      p95ResponseTime: durations.length > 0 ? this.percentile(durations, 95) : 0,
      p99ResponseTime: durations.length > 0 ? this.percentile(durations, 99) : 0,
      errors: failed.map(f => f.error).filter((error, index, arr) => arr.indexOf(error) === index)
    };
  }
  
  static percentile(arr: number[], p: number): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
  
  static async measureMemoryUsage(): Promise<{ heapUsed: number; heapTotal: number; external: number }> {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external
      };
    }
    return { heapUsed: 0, heapTotal: 0, external: 0 };
  }
  
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Simplified load testing scenarios
export class SimpleLoadTestScenarios {
  static async concurrentUserRegistrations(count: number): Promise<any> {
    const authService = new AuthService(DatabaseService.getInstance());
    
    return SimpleLoadTestUtils.simulateConcurrentOperations(count, async (index) => {
      const email = `loadtest${Date.now()}${index}@example.com`;
      const password = 'LoadTest123!';
      const name = `Load Test User ${index}`;
      
      await authService.register({ email, password, name });
    });
  }
  
  static async concurrentUserLogins(count: number): Promise<any> {
    const authService = new AuthService(DatabaseService.getInstance());
    
    // Create users first
    const users = [];
    for (let i = 0; i < count; i++) {
      try {
        const user = await SimpleLoadTestUtils.createTestUser();
        users.push(user);
      } catch (error) {
        console.warn(`Failed to create user ${i}:`, error);
      }
    }
    
    return SimpleLoadTestUtils.simulateConcurrentOperations(users.length, async (index) => {
      const user = users[index];
      await authService.login(user.email, user.password);
    });
  }
  
  static async concurrentRoomCreations(count: number): Promise<any> {
    const roomService = new RoomService(DatabaseService.getInstance());
    
    // Create a test user first
    const user = await SimpleLoadTestUtils.createTestUser();
    
    return SimpleLoadTestUtils.simulateConcurrentOperations(count, async (index) => {
      const roomName = `Load Test Room ${Date.now()}${index}`;
      await roomService.createRoom({
        name: roomName,
        description: `Load test room ${index}`,
        maxParticipants: 50,
        isPrivate: false,
        createdBy: user.id
      });
    });
  }
  
  static async concurrentDatabaseQueries(count: number): Promise<any> {
    const dbService = DatabaseService.getInstance();
    
    return SimpleLoadTestUtils.simulateConcurrentOperations(count, async (index) => {
      await dbService.query('SELECT COUNT(*) FROM "user"');
    });
  }
  
  static async concurrentWebRTCConnections(count: number): Promise<any> {
    return SimpleLoadTestUtils.simulateConcurrentOperations(count, async (index) => {
      // Simulate WebRTC connection setup
      await SimpleLoadTestUtils.sleep(Math.random() * 50 + 25); // 25-75ms
    });
  }
}

// Simplified load test configuration
export interface SimpleLoadTestConfig {
  name: string;
  description: string;
  operationCount: number;
  timeout?: number;
}

// Simplified load test results
export interface SimpleLoadTestResults {
  config: SimpleLoadTestConfig;
  stats: any;
  memoryUsage: { heapUsed: number; heapTotal: number; external: number };
  duration: number;
  timestamp: number;
}

// Simplified load tester
export class SimpleLoadTester {
  async runLoadTest(
    config: SimpleLoadTestConfig, 
    scenario: (operationCount: number) => Promise<any>
  ): Promise<SimpleLoadTestResults> {
    console.log(`Starting load test: ${config.name}`);
    console.log(`Description: ${config.description}`);
    console.log(`Operations: ${config.operationCount}`);
    
    const startTime = Date.now();
    
    // Record initial memory usage
    const initialMemory = await SimpleLoadTestUtils.measureMemoryUsage();
    
    try {
      // Run the load test scenario
      const results = await scenario(config.operationCount);
      
      // Calculate statistics
      const stats = SimpleLoadTestUtils.calculateStats(results);
      
      // Record final memory usage
      const finalMemory = await SimpleLoadTestUtils.measureMemoryUsage();
      
      const duration = Date.now() - startTime;
      
      const loadTestResults: SimpleLoadTestResults = {
        config,
        stats,
        memoryUsage: finalMemory,
        duration,
        timestamp: Date.now()
      };
      
      console.log(`Load test completed in ${duration}ms`);
      console.log(`Success rate: ${stats.successRate.toFixed(2)}%`);
      console.log(`Average response time: ${stats.averageResponseTime.toFixed(2)}ms`);
      console.log(`P95 response time: ${stats.p95ResponseTime.toFixed(2)}ms`);
      
      return loadTestResults;
    } catch (error) {
      console.error('Load test failed:', error);
      throw error;
    }
  }
  
  generateReport(results: SimpleLoadTestResults[]): string {
    let report = '# Load Testing Report\n\n';
    
    results.forEach((result, index) => {
      report += `## Test ${index + 1}: ${result.config.name}\n\n`;
      report += `**Description:** ${result.config.description}\n\n`;
      report += `**Configuration:**\n`;
      report += `- Operations: ${result.config.operationCount}\n`;
      report += `- Duration: ${result.duration}ms\n\n`;
      
      report += `**Results:**\n`;
      report += `- Success rate: ${result.stats.successRate.toFixed(2)}%\n`;
      report += `- Average response time: ${result.stats.averageResponseTime.toFixed(2)}ms\n`;
      report += `- P95 response time: ${result.stats.p95ResponseTime.toFixed(2)}ms\n`;
      report += `- P99 response time: ${result.stats.p99ResponseTime.toFixed(2)}ms\n`;
      report += `- Min response time: ${result.stats.minResponseTime}ms\n`;
      report += `- Max response time: ${result.stats.maxResponseTime}ms\n\n`;
      
      report += `**Resource Usage:**\n`;
      report += `- Memory heap used: ${(result.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB\n`;
      report += `- Memory heap total: ${(result.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB\n\n`;
      
      if (result.stats.errors.length > 0) {
        report += `**Errors:**\n`;
        result.stats.errors.forEach(error => {
          report += `- ${error}\n`;
        });
        report += '\n';
      }
      
      report += '---\n\n';
    });
    
    return report;
  }
}
