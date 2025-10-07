/**
 * API Test Configuration - Configuration for API tests
 * FR-001: API-First Design - API test configuration
 */

export interface ApiTestConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  testData: {
    user: {
      email: string;
      password: string;
      fullName: string;
    };
    workspace: {
      name: string;
      description: string;
    };
    board: {
      name: string;
      description: string;
    };
    task: {
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
    };
  };
  performance: {
    responseTimeThreshold: number;
    throughputThreshold: number;
    errorRateThreshold: number;
    memoryUsageThreshold: number;
  };
  security: {
    testMaliciousInputs: boolean;
    testRateLimiting: boolean;
    testAuthentication: boolean;
    testAuthorization: boolean;
  };
  cleanup: {
    autoCleanup: boolean;
    cleanupOnFailure: boolean;
    cleanupTimeout: number;
  };
}

export class ApiTestConfigManager {
  private static instance: ApiTestConfigManager;
  private config: ApiTestConfig;

  constructor() {
    this.config = {
      baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      testData: {
        user: {
          email: 'test@example.com',
          password: 'TestPassword123!',
          fullName: 'Test User',
        },
        workspace: {
          name: 'Test Workspace',
          description: 'A test workspace for API testing',
        },
        board: {
          name: 'Test Board',
          description: 'A test board for API testing',
        },
        task: {
          title: 'Test Task',
          description: 'A test task for API testing',
          priority: 'medium',
        },
      },
      performance: {
        responseTimeThreshold: 1000, // 1 second
        throughputThreshold: 100, // 100 requests per second
        errorRateThreshold: 0.01, // 1% error rate
        memoryUsageThreshold: 100 * 1024 * 1024, // 100MB
      },
      security: {
        testMaliciousInputs: true,
        testRateLimiting: true,
        testAuthentication: true,
        testAuthorization: true,
      },
      cleanup: {
        autoCleanup: true,
        cleanupOnFailure: true,
        cleanupTimeout: 30000, // 30 seconds
      },
    };
  }

  public static getInstance(): ApiTestConfigManager {
    if (!ApiTestConfigManager.instance) {
      ApiTestConfigManager.instance = new ApiTestConfigManager();
    }
    return ApiTestConfigManager.instance;
  }

  public getConfig(): ApiTestConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<ApiTestConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public setEnvironment(env: 'development' | 'staging' | 'production'): void {
    switch (env) {
      case 'development':
        this.config.baseURL = 'http://localhost:3000/api/v1';
        this.config.timeout = 5000;
        this.config.retries = 1;
        this.config.performance.responseTimeThreshold = 2000;
        this.config.performance.throughputThreshold = 50;
        break;
      case 'staging':
        this.config.baseURL = 'https://staging-api.kanban-app.com/v1';
        this.config.timeout = 10000;
        this.config.retries = 2;
        this.config.performance.responseTimeThreshold = 1500;
        this.config.performance.throughputThreshold = 75;
        break;
      case 'production':
        this.config.baseURL = 'https://api.kanban-app.com/v1';
        this.config.timeout = 15000;
        this.config.retries = 3;
        this.config.performance.responseTimeThreshold = 1000;
        this.config.performance.throughputThreshold = 100;
        break;
    }
  }

  public setTestData(data: Partial<ApiTestConfig['testData']>): void {
    this.config.testData = { ...this.config.testData, ...data };
  }

  public setPerformanceThresholds(thresholds: Partial<ApiTestConfig['performance']>): void {
    this.config.performance = { ...this.config.performance, ...thresholds };
  }

  public setSecurityOptions(options: Partial<ApiTestConfig['security']>): void {
    this.config.security = { ...this.config.security, ...options };
  }

  public setCleanupOptions(options: Partial<ApiTestConfig['cleanup']>): void {
    this.config.cleanup = { ...this.config.cleanup, ...options };
  }

  public getBaseURL(): string {
    return this.config.baseURL;
  }

  public getTimeout(): number {
    return this.config.timeout;
  }

  public getRetries(): number {
    return this.config.retries;
  }

  public getRetryDelay(): number {
    return this.config.retryDelay;
  }

  public getTestUser(): ApiTestConfig['testData']['user'] {
    return { ...this.config.testData.user };
  }

  public getTestWorkspace(): ApiTestConfig['testData']['workspace'] {
    return { ...this.config.testData.workspace };
  }

  public getTestBoard(): ApiTestConfig['testData']['board'] {
    return { ...this.config.testData.board };
  }

  public getTestTask(): ApiTestConfig['testData']['task'] {
    return { ...this.config.testData.task };
  }

  public getPerformanceThresholds(): ApiTestConfig['performance'] {
    return { ...this.config.performance };
  }

  public getSecurityOptions(): ApiTestConfig['security'] {
    return { ...this.config.security };
  }

  public getCleanupOptions(): ApiTestConfig['cleanup'] {
    return { ...this.config.cleanup };
  }

  public isPerformanceTestEnabled(): boolean {
    return process.env.ENABLE_PERFORMANCE_TESTS === 'true';
  }

  public isSecurityTestEnabled(): boolean {
    return process.env.ENABLE_SECURITY_TESTS === 'true';
  }

  public isIntegrationTestEnabled(): boolean {
    return process.env.ENABLE_INTEGRATION_TESTS === 'true';
  }

  public isContractTestEnabled(): boolean {
    return process.env.ENABLE_CONTRACT_TESTS === 'true';
  }

  public getTestEnvironment(): string {
    return process.env.NODE_ENV || 'test';
  }

  public getTestTimeout(): number {
    return parseInt(process.env.TEST_TIMEOUT || '10000', 10);
  }

  public getTestRetries(): number {
    return parseInt(process.env.TEST_RETRIES || '3', 10);
  }

  public getTestParallelism(): number {
    return parseInt(process.env.TEST_PARALLELISM || '1', 10);
  }

  public getTestVerbose(): boolean {
    return process.env.TEST_VERBOSE === 'true';
  }

  public getTestDebug(): boolean {
    return process.env.TEST_DEBUG === 'true';
  }

  public getTestCoverage(): boolean {
    return process.env.TEST_COVERAGE === 'true';
  }

  public getTestReport(): boolean {
    return process.env.TEST_REPORT === 'true';
  }

  public getTestOutput(): string {
    return process.env.TEST_OUTPUT || 'console';
  }

  public getTestFormat(): string {
    return process.env.TEST_FORMAT || 'json';
  }

  public getTestFilter(): string {
    return process.env.TEST_FILTER || '';
  }

  public getTestPattern(): string {
    return process.env.TEST_PATTERN || '**/*.test.ts';
  }

  public getTestIgnore(): string[] {
    return (process.env.TEST_IGNORE || '').split(',').filter(Boolean);
  }

  public getTestSetup(): string {
    return process.env.TEST_SETUP || '';
  }

  public getTestTeardown(): string {
    return process.env.TEST_TEARDOWN || '';
  }

  public getTestBeforeAll(): string {
    return process.env.TEST_BEFORE_ALL || '';
  }

  public getTestAfterAll(): string {
    return process.env.TEST_AFTER_ALL || '';
  }

  public getTestBeforeEach(): string {
    return process.env.TEST_BEFORE_EACH || '';
  }

  public getTestAfterEach(): string {
    return process.env.TEST_AFTER_EACH || '';
  }

  public getTestSkip(): string[] {
    return (process.env.TEST_SKIP || '').split(',').filter(Boolean);
  }

  public getTestOnly(): string[] {
    return (process.env.TEST_ONLY || '').split(',').filter(Boolean);
  }

  public getTestBail(): boolean {
    return process.env.TEST_BAIL === 'true';
  }

  public getTestFailFast(): boolean {
    return process.env.TEST_FAIL_FAST === 'true';
  }

  public getTestSilent(): boolean {
    return process.env.TEST_SILENT === 'true';
  }

  public getTestQuiet(): boolean {
    return process.env.TEST_QUIET === 'true';
  }

  public getTestColor(): boolean {
    return process.env.TEST_COLOR !== 'false';
  }

  public getTestProgress(): boolean {
    return process.env.TEST_PROGRESS !== 'false';
  }

  public getTestUpdateSnapshots(): boolean {
    return process.env.TEST_UPDATE_SNAPSHOTS === 'true';
  }

  public getTestWatch(): boolean {
    return process.env.TEST_WATCH === 'true';
  }

  public getTestWatchAll(): boolean {
    return process.env.TEST_WATCH_ALL === 'true';
  }

  public getTestWatchPath(): string {
    return process.env.TEST_WATCH_PATH || '';
  }

  public getTestWatchIgnore(): string[] {
    return (process.env.TEST_WATCH_IGNORE || '').split(',').filter(Boolean);
  }

  public getTestWatchMode(): string {
    return process.env.TEST_WATCH_MODE || 'watch';
  }

  public getTestWatchDelay(): number {
    return parseInt(process.env.TEST_WATCH_DELAY || '1000', 10);
  }

  public getTestWatchDebounce(): number {
    return parseInt(process.env.TEST_WATCH_DEBOUNCE || '300', 10);
  }

  public getTestWatchMaxWorkers(): number {
    return parseInt(process.env.TEST_WATCH_MAX_WORKERS || '4', 10);
  }

  public getTestWatchPlugins(): string[] {
    return (process.env.TEST_WATCH_PLUGINS || '').split(',').filter(Boolean);
  }

  public getTestWatchSetup(): string {
    return process.env.TEST_WATCH_SETUP || '';
  }

  public getTestWatchTeardown(): string {
    return process.env.TEST_WATCH_TEARDOWN || '';
  }

  public getTestWatchBeforeAll(): string {
    return process.env.TEST_WATCH_BEFORE_ALL || '';
  }

  public getTestWatchAfterAll(): string {
    return process.env.TEST_WATCH_AFTER_ALL || '';
  }

  public getTestWatchBeforeEach(): string {
    return process.env.TEST_WATCH_BEFORE_EACH || '';
  }

  public getTestWatchAfterEach(): string {
    return process.env.TEST_WATCH_AFTER_EACH || '';
  }

  public getTestWatchSkip(): string[] {
    return (process.env.TEST_WATCH_SKIP || '').split(',').filter(Boolean);
  }

  public getTestWatchOnly(): string[] {
    return (process.env.TEST_WATCH_ONLY || '').split(',').filter(Boolean);
  }

  public getTestWatchBail(): boolean {
    return process.env.TEST_WATCH_BAIL === 'true';
  }

  public getTestWatchFailFast(): boolean {
    return process.env.TEST_WATCH_FAIL_FAST === 'true';
  }

  public getTestWatchSilent(): boolean {
    return process.env.TEST_WATCH_SILENT === 'true';
  }

  public getTestWatchQuiet(): boolean {
    return process.env.TEST_WATCH_QUIET === 'true';
  }

  public getTestWatchColor(): boolean {
    return process.env.TEST_WATCH_COLOR !== 'false';
  }

  public getTestWatchProgress(): boolean {
    return process.env.TEST_WATCH_PROGRESS !== 'false';
  }

  public getTestWatchUpdateSnapshots(): boolean {
    return process.env.TEST_WATCH_UPDATE_SNAPSHOTS === 'true';
  }
}

// Export singleton instance
export const apiTestConfig = ApiTestConfigManager.getInstance();
