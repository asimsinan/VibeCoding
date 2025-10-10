/**
 * Load Testing Infrastructure
 * Comprehensive load testing for concurrent users, database performance, and API endpoints
 */

import { DatabaseService } from '../../lib/video-conferencing/services/database.service';
import { AuthService } from '../../lib/auth/auth.service';
import { RoomService } from '../../lib/video-conferencing/services/room.service';
import { ParticipantService } from '../../lib/video-conferencing/services/participant.service';
import { MessageService } from '../../lib/video-conferencing/services/message.service';

// Load testing utilities
export class LoadTestUtils {
  static async createTestUsers(count: number): Promise<Array<{ id: string; email: string; password: string }>> {
    const users = [];
    const authService = new AuthService(DatabaseService.getInstance());
    
    for (let i = 0; i < count; i++) {
      const email = `loadtest${i}@example.com`;
      const password = 'LoadTest123!';
      
      try {
        const user = await authService.register(email, password, `Load Test User ${i}`);
        users.push({ id: user.id, email, password });
      } catch (error) {
        // User might already exist, try to login
        try {
          const loginResult = await authService.login(email, password);
          users.push({ id: loginResult.user.id, email, password });
        } catch (loginError) {
          console.error(`Failed to create/login user ${i}:`, loginError);
        }
      }
    }
    
    return users;
  }
  
  static async createTestRooms(count: number, createdBy: string): Promise<Array<{ id: string; name: string }>> {
    const rooms = [];
    const roomService = new RoomService(DatabaseService.getInstance());
    
    for (let i = 0; i < count; i++) {
      try {
        const room = await roomService.createRoom({
          name: `Load Test Room ${i}`,
          description: `Room for load testing ${i}`,
          maxParticipants: 50,
          isPrivate: false,
          createdBy
        });
        rooms.push({ id: room.id, name: room.name });
      } catch (error) {
        console.error(`Failed to create room ${i}:`, error);
      }
    }
    
    return rooms;
  }
  
  static async simulateConcurrentUsers(
    userCount: number, 
    operationsPerUser: number,
    operation: (user: any, index: number) => Promise<any>
  ): Promise<Array<{ success: boolean; duration: number; error?: string }>> {
    const results = [];
    const users = await this.createTestUsers(userCount);
    
    const promises = users.map(async (user, userIndex) => {
      const userResults = [];
      
      for (let opIndex = 0; opIndex < operationsPerUser; opIndex++) {
        const startTime = Date.now();
        
        try {
          await operation(user, opIndex);
          const duration = Date.now() - startTime;
          userResults.push({ success: true, duration });
        } catch (error) {
          const duration = Date.now() - startTime;
          userResults.push({ 
            success: false, 
            duration, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      return userResults;
    });
    
    const allResults = await Promise.all(promises);
    return allResults.flat();
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
  
  static async measureCPUUsage(): Promise<{ cpu: number }> {
    if (typeof process !== 'undefined' && process.cpuUsage) {
      const usage = process.cpuUsage();
      return { cpu: usage.user + usage.system };
    }
    return { cpu: 0 };
  }
  
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  static generateRandomEmail(): string {
    return `loadtest${Date.now()}${Math.random().toString(36).substr(2, 5)}@example.com`;
  }
  
  static generateRandomRoomName(): string {
    return `Load Test Room ${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
  }
}

// Load testing scenarios
export class LoadTestScenarios {
  static async concurrentUserRegistration(userCount: number): Promise<any> {
    const authService = new AuthService(DatabaseService.getInstance());
    
    return LoadTestUtils.simulateConcurrentUsers(userCount, 1, async (user, index) => {
      const email = LoadTestUtils.generateRandomEmail();
      const password = 'LoadTest123!';
      const name = `Load Test User ${index}`;
      
      await authService.register(email, password, name);
    });
  }
  
  static async concurrentUserLogin(userCount: number): Promise<any> {
    const authService = new AuthService(DatabaseService.getInstance());
    const users = await LoadTestUtils.createTestUsers(userCount);
    
    return LoadTestUtils.simulateConcurrentUsers(userCount, 1, async (user, index) => {
      await authService.login(user.email, user.password);
    });
  }
  
  static async concurrentRoomCreation(userCount: number): Promise<any> {
    const roomService = new RoomService(DatabaseService.getInstance());
    const users = await LoadTestUtils.createTestUsers(userCount);
    
    return LoadTestUtils.simulateConcurrentUsers(userCount, 1, async (user, index) => {
      const roomName = LoadTestUtils.generateRandomRoomName();
      await roomService.createRoom({
        name: roomName,
        description: `Load test room ${index}`,
        maxParticipants: 50,
        isPrivate: false,
        createdBy: user.id
      });
    });
  }
  
  static async concurrentRoomJoining(userCount: number, roomCount: number): Promise<any> {
    const participantService = new ParticipantService(DatabaseService.getInstance());
    const users = await LoadTestUtils.createTestUsers(userCount);
    const rooms = await LoadTestUtils.createTestRooms(roomCount, users[0].id);
    
    return LoadTestUtils.simulateConcurrentUsers(userCount, 1, async (user, index) => {
      const room = rooms[index % rooms.length];
      await participantService.joinRoom(room.id, user.id, `Participant ${index}`);
    });
  }
  
  static async concurrentMessageSending(userCount: number, messagesPerUser: number): Promise<any> {
    const messageService = new MessageService(DatabaseService.getInstance());
    const users = await LoadTestUtils.createTestUsers(userCount);
    const rooms = await LoadTestUtils.createTestRooms(1, users[0].id);
    const room = rooms[0];
    
    // Join all users to the room first
    const participantService = new ParticipantService(DatabaseService.getInstance());
    for (const user of users) {
      try {
        await participantService.joinRoom(room.id, user.id, `Participant ${user.id}`);
      } catch (error) {
        // User might already be in room
      }
    }
    
    return LoadTestUtils.simulateConcurrentUsers(userCount, messagesPerUser, async (user, index) => {
      const message = `Load test message ${index} from user ${user.id}`;
      await messageService.sendMessage(room.id, user.id, message);
    });
  }
  
  static async concurrentDatabaseQueries(queryCount: number): Promise<any> {
    const dbService = DatabaseService.getInstance();
    
    const results = [];
    const promises = [];
    
    for (let i = 0; i < queryCount; i++) {
      promises.push(
        (async () => {
          const startTime = Date.now();
          try {
            await dbService.query('SELECT COUNT(*) FROM "user"');
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
  
  static async concurrentWebRTCConnections(connectionCount: number): Promise<any> {
    // Mock WebRTC connection testing
    const results = [];
    const promises = [];
    
    for (let i = 0; i < connectionCount; i++) {
      promises.push(
        (async () => {
          const startTime = Date.now();
          try {
            // Simulate WebRTC connection setup
            await LoadTestUtils.sleep(Math.random() * 100 + 50); // 50-150ms
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
  
  static async stressTestAPIEndpoints(endpointCount: number, requestsPerEndpoint: number): Promise<any> {
    const authService = new AuthService(DatabaseService.getInstance());
    const roomService = new RoomService(DatabaseService.getInstance());
    const users = await LoadTestUtils.createTestUsers(endpointCount);
    
    const results = [];
    const promises = [];
    
    for (let i = 0; i < endpointCount; i++) {
      const user = users[i];
      
      for (let j = 0; j < requestsPerEndpoint; j++) {
        promises.push(
          (async () => {
            const startTime = Date.now();
            try {
              // Simulate different API operations
              const operation = j % 4;
              switch (operation) {
                case 0:
                  await authService.getUserProfile(user.id);
                  break;
                case 1:
                  await roomService.getRooms();
                  break;
                case 2:
                  await authService.refreshAccessToken('mock-refresh-token');
                  break;
                case 3:
                  await roomService.getRoom('mock-room-id', user.id);
                  break;
              }
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
    }
    
    await Promise.all(promises);
    return results;
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Array<{ timestamp: number; metric: string; value: number }> = [];
  
  startMonitoring() {
    this.metrics = [];
  }
  
  recordMetric(metric: string, value: number) {
    this.metrics.push({
      timestamp: Date.now(),
      metric,
      value
    });
  }
  
  getMetrics() {
    return this.metrics;
  }
  
  getAverageMetric(metric: string): number {
    const metricData = this.metrics.filter(m => m.metric === metric);
    if (metricData.length === 0) return 0;
    
    const sum = metricData.reduce((acc, m) => acc + m.value, 0);
    return sum / metricData.length;
  }
  
  getMaxMetric(metric: string): number {
    const metricData = this.metrics.filter(m => m.metric === metric);
    if (metricData.length === 0) return 0;
    
    return Math.max(...metricData.map(m => m.value));
  }
  
  getMinMetric(metric: string): number {
    const metricData = this.metrics.filter(m => m.metric === metric);
    if (metricData.length === 0) return 0;
    
    return Math.min(...metricData.map(m => m.value));
  }
}

// Load test configuration
export interface LoadTestConfig {
  name: string;
  description: string;
  userCount: number;
  operationsPerUser: number;
  duration?: number;
  rampUpTime?: number;
  rampDownTime?: number;
}

// Load test results
export interface LoadTestResults {
  config: LoadTestConfig;
  stats: any;
  memoryUsage: { heapUsed: number; heapTotal: number; external: number };
  cpuUsage: { cpu: number };
  duration: number;
  timestamp: number;
}

// Main load testing class
export class LoadTester {
  private monitor: PerformanceMonitor;
  
  constructor() {
    this.monitor = new PerformanceMonitor();
  }
  
  async runLoadTest(config: LoadTestConfig, scenario: (userCount: number, operationsPerUser: number) => Promise<any>): Promise<LoadTestResults> {
    console.log(`Starting load test: ${config.name}`);
    console.log(`Description: ${config.description}`);
    console.log(`Users: ${config.userCount}, Operations per user: ${config.operationsPerUser}`);
    
    const startTime = Date.now();
    this.monitor.startMonitoring();
    
    // Record initial memory usage
    const initialMemory = await LoadTestUtils.measureMemoryUsage();
    this.monitor.recordMetric('memory_heap_used', initialMemory.heapUsed);
    
    try {
      // Run the load test scenario
      const results = await scenario(config.userCount, config.operationsPerUser);
      
      // Calculate statistics
      const stats = LoadTestUtils.calculateStats(results);
      
      // Record final memory usage
      const finalMemory = await LoadTestUtils.measureMemoryUsage();
      this.monitor.recordMetric('memory_heap_used', finalMemory.heapUsed);
      
      const duration = Date.now() - startTime;
      
      const loadTestResults: LoadTestResults = {
        config,
        stats,
        memoryUsage: finalMemory,
        cpuUsage: await LoadTestUtils.measureCPUUsage(),
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
  
  async runMultipleLoadTests(configs: LoadTestConfig[], scenario: (userCount: number, operationsPerUser: number) => Promise<any>): Promise<LoadTestResults[]> {
    const results = [];
    
    for (const config of configs) {
      try {
        const result = await this.runLoadTest(config, scenario);
        results.push(result);
        
        // Wait between tests to allow system to recover
        await LoadTestUtils.sleep(2000);
      } catch (error) {
        console.error(`Load test failed for config ${config.name}:`, error);
      }
    }
    
    return results;
  }
  
  generateReport(results: LoadTestResults[]): string {
    let report = '# Load Testing Report\n\n';
    
    results.forEach((result, index) => {
      report += `## Test ${index + 1}: ${result.config.name}\n\n`;
      report += `**Description:** ${result.config.description}\n\n`;
      report += `**Configuration:**\n`;
      report += `- Users: ${result.config.userCount}\n`;
      report += `- Operations per user: ${result.config.operationsPerUser}\n`;
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
      report += `- Memory heap total: ${(result.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB\n`;
      report += `- CPU usage: ${result.cpuUsage.cpu}\n\n`;
      
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
