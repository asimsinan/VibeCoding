/**
 * E2E Test Runner
 * TASK-024: End-to-End Test Setup
 * 
 * Comprehensive E2E test runner with setup, execution, and reporting.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestConfig {
  browsers: string[];
  environments: string[];
  parallel: boolean;
  retries: number;
  timeout: number;
}

class E2ETestRunner {
  private config: TestConfig;
  private results: any[] = [];

  constructor() {
    this.config = {
      browsers: ['chromium', 'firefox', 'webkit'],
      environments: ['development', 'staging'],
      parallel: true,
      retries: 2,
      timeout: 30000,
    };
  }

  async run() {
    console.log('🚀 Starting E2E Test Suite...');
    
    try {
      // 1. Pre-flight checks
      await this.preflightChecks();
      
      // 2. Setup test environment
      await this.setupEnvironment();
      
      // 3. Run tests
      await this.runTests();
      
      // 4. Generate reports
      await this.generateReports();
      
      // 5. Cleanup
      await this.cleanup();
      
      console.log('✅ E2E Test Suite completed successfully!');
    } catch (error) {
      console.error('❌ E2E Test Suite failed:', error);
      process.exit(1);
    }
  }

  private async preflightChecks() {
    console.log('🔍 Running pre-flight checks...');
    
    // Check if Playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Playwright is not installed. Run: npm install @playwright/test');
    }
    
    // Check if browsers are installed
    try {
      execSync('npx playwright install --dry-run', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 Installing Playwright browsers...');
      execSync('npx playwright install', { stdio: 'inherit' });
    }
    
    // Check if test database exists
    try {
      execSync('psql -lqt | cut -d \\| -f 1 | grep -qw personal_shopping_assistant_test', { stdio: 'pipe' });
    } catch (error) {
      console.log('📊 Creating test database...');
      execSync('npm run db:create:test', { stdio: 'inherit' });
    }
    
    console.log('✅ Pre-flight checks passed');
  }

  private async setupEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    // Create test results directory
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    // Set environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://localhost:5432/personal_shopping_assistant_test';
    
    console.log('✅ Test environment setup completed');
  }

  private async runTests() {
    console.log('🧪 Running E2E tests...');
    
    const testSuites = [
      'auth.spec.ts',
      'product-discovery.spec.ts',
      'user-preferences.spec.ts',
    ];
    
    for (const suite of testSuites) {
      console.log(`📋 Running test suite: ${suite}`);
      
      try {
        const command = `npx playwright test tests/e2e/${suite} --reporter=json --output-dir=test-results/${suite.replace('.spec.ts', '')}`;
        const output = execSync(command, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        this.results.push({
          suite,
          status: 'passed',
          output: JSON.parse(output)
        });
        
        console.log(`✅ ${suite} completed successfully`);
      } catch (error) {
        console.error(`❌ ${suite} failed:`, error);
        this.results.push({
          suite,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  private async generateReports() {
    console.log('📊 Generating test reports...');
    
    // Generate HTML report
    try {
      execSync('npx playwright show-report --host 0.0.0.0 --port 9323', { 
        stdio: 'pipe',
        detached: true 
      });
      console.log('🌐 HTML report available at: http://localhost:9323');
    } catch (error) {
      console.warn('⚠️ Failed to generate HTML report:', error.message);
    }
    
    // Generate JSON summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalSuites: this.results.length,
      passedSuites: this.results.filter(r => r.status === 'passed').length,
      failedSuites: this.results.filter(r => r.status === 'failed').length,
      results: this.results
    };
    
    fs.writeFileSync(
      path.join(process.cwd(), 'test-results', 'e2e-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('📄 JSON summary saved to: test-results/e2e-summary.json');
  }

  private async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    
    // Stop any running servers
    try {
      const backendPid = process.env.BACKEND_PID;
      if (backendPid) {
        process.kill(parseInt(backendPid), 'SIGTERM');
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    console.log('✅ Cleanup completed');
  }
}

// Run the E2E test suite
if (require.main === module) {
  const runner = new E2ETestRunner();
  runner.run().catch(console.error);
}

export default E2ETestRunner;
