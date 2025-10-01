#!/usr/bin/env node
/**
 * Performance Optimization Analyzer for Personal Shopping Assistant API
 * 
 * This script analyzes performance test results and provides:
 * - Performance bottleneck identification
 * - Optimization recommendations
 * - Database query analysis
 * - Memory usage optimization suggestions
 * - Caching strategy recommendations
 */

const fs = require('fs');
const path = require('path');

// Performance thresholds
const THRESHOLDS = {
  responseTime: {
    excellent: 100,   // < 100ms
    good: 500,       // < 500ms
    acceptable: 1000, // < 1000ms
    poor: 2000       // < 2000ms
  },
  successRate: {
    excellent: 0.99,  // > 99%
    good: 0.95,       // > 95%
    acceptable: 0.90, // > 90%
    poor: 0.80        // > 80%
  },
  throughput: {
    excellent: 1000,  // > 1000 req/s
    good: 500,        // > 500 req/s
    acceptable: 100,  // > 100 req/s
    poor: 50          // > 50 req/s
  }
};

// Performance analyzer class
class PerformanceAnalyzer {
  constructor() {
    this.results = [];
    this.recommendations = [];
    this.bottlenecks = [];
  }

  async analyzeResults(resultsDir) {
    console.log('🔍 Analyzing Performance Test Results...');
    console.log('='.repeat(50));

    // Load all result files
    await this.loadResults(resultsDir);
    
    if (this.results.length === 0) {
      console.log('❌ No performance test results found!');
      console.log('   Run benchmark.js or load-test.js first.');
      return;
    }

    // Analyze each result set
    for (const result of this.results) {
      this.analyzeResultSet(result);
    }

    // Generate overall analysis
    this.generateOverallAnalysis();
    
    // Print recommendations
    this.printAnalysis();
    
    // Save analysis report
    await this.saveAnalysis();
  }

  async loadResults(resultsDir) {
    if (!fs.existsSync(resultsDir)) {
      console.log(`❌ Results directory not found: ${resultsDir}`);
      return;
    }

    const files = fs.readdirSync(resultsDir);
    const resultFiles = files.filter(f => f.endsWith('.json'));

    for (const file of resultFiles) {
      try {
        const filePath = path.join(resultsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const result = JSON.parse(content);
        
        this.results.push({
          file: file,
          type: this.detectResultType(result),
          data: result,
          timestamp: result.timestamp || new Date().toISOString()
        });
      } catch (error) {
        console.log(`⚠️  Could not load ${file}: ${error.message}`);
      }
    }

    console.log(`📊 Loaded ${this.results.length} result files`);
  }

  detectResultType(result) {
    if (result.results && Array.isArray(result.results)) {
      return 'load_test';
    } else if (result.results && result.summary) {
      return 'benchmark';
    } else if (result.metrics) {
      return 'monitor';
    }
    return 'unknown';
  }

  analyzeResultSet(result) {
    console.log(`\n📈 Analyzing ${result.type}: ${result.file}`);
    
    switch (result.type) {
      case 'load_test':
        this.analyzeLoadTest(result.data);
        break;
      case 'benchmark':
        this.analyzeBenchmark(result.data);
        break;
      case 'monitor':
        this.analyzeMonitor(result.data);
        break;
      default:
        console.log('   ⚠️  Unknown result type');
    }
  }

  analyzeLoadTest(data) {
    if (!data.results || !Array.isArray(data.results)) return;

    data.results.forEach((testResult, index) => {
      const concurrentUsers = data.config?.concurrentUsers?.[index] || 'Unknown';
      
      // Analyze response time
      const avgResponseTime = testResult.responseTime?.avg || 0;
      const responseTimeRating = this.rateResponseTime(avgResponseTime);
      
      if (responseTimeRating === 'poor' || responseTimeRating === 'acceptable') {
        this.bottlenecks.push({
          type: 'response_time',
          severity: responseTimeRating,
          test: `Load Test (${concurrentUsers} users)`,
          value: avgResponseTime,
          threshold: THRESHOLDS.responseTime[responseTimeRating === 'poor' ? 'acceptable' : 'good']
        });
      }

      // Analyze error rate
      const errorRate = testResult.errorRate || 0;
      const errorRateRating = this.rateErrorRate(errorRate);
      
      if (errorRateRating === 'poor' || errorRateRating === 'acceptable') {
        this.bottlenecks.push({
          type: 'error_rate',
          severity: errorRateRating,
          test: `Load Test (${concurrentUsers} users)`,
          value: errorRate,
          threshold: THRESHOLDS.successRate[errorRateRating === 'poor' ? 'acceptable' : 'good']
        });
      }

      // Analyze throughput
      const throughput = testResult.requestsPerSecond || 0;
      const throughputRating = this.rateThroughput(throughput);
      
      if (throughputRating === 'poor' || throughputRating === 'acceptable') {
        this.bottlenecks.push({
          type: 'throughput',
          severity: throughputRating,
          test: `Load Test (${concurrentUsers} users)`,
          value: throughput,
          threshold: THRESHOLDS.throughput[throughputRating === 'poor' ? 'acceptable' : 'good']
        });
      }
    });
  }

  analyzeBenchmark(data) {
    if (!data.results || !Array.isArray(data.results)) return;

    data.results.forEach(testResult => {
      if (testResult.error) return;

      const avgResponseTime = testResult.responseTime?.avg || 0;
      const responseTimeRating = this.rateResponseTime(avgResponseTime);
      
      if (responseTimeRating === 'poor' || responseTimeRating === 'acceptable') {
        this.bottlenecks.push({
          type: 'response_time',
          severity: responseTimeRating,
          test: testResult.testName,
          value: avgResponseTime,
          threshold: THRESHOLDS.responseTime[responseTimeRating === 'poor' ? 'acceptable' : 'good']
        });
      }

      const successRate = testResult.successRate || 0;
      const errorRate = 1 - successRate;
      const errorRateRating = this.rateErrorRate(errorRate);
      
      if (errorRateRating === 'poor' || errorRateRating === 'acceptable') {
        this.bottlenecks.push({
          type: 'error_rate',
          severity: errorRateRating,
          test: testResult.testName,
          value: errorRate,
          threshold: THRESHOLDS.successRate[errorRateRating === 'poor' ? 'acceptable' : 'good']
        });
      }
    });
  }

  analyzeMonitor(data) {
    if (!data.summary) return;

    const avgResponseTime = data.summary.avgResponseTime || 0;
    const responseTimeRating = this.rateResponseTime(avgResponseTime);
    
    if (responseTimeRating === 'poor' || responseTimeRating === 'acceptable') {
      this.bottlenecks.push({
        type: 'response_time',
        severity: responseTimeRating,
        test: 'Monitor',
        value: avgResponseTime,
        threshold: THRESHOLDS.responseTime[responseTimeRating === 'poor' ? 'acceptable' : 'good']
      });
    }
  }

  rateResponseTime(responseTime) {
    if (responseTime < THRESHOLDS.responseTime.excellent) return 'excellent';
    if (responseTime < THRESHOLDS.responseTime.good) return 'good';
    if (responseTime < THRESHOLDS.responseTime.acceptable) return 'acceptable';
    return 'poor';
  }

  rateErrorRate(errorRate) {
    const successRate = 1 - errorRate;
    if (successRate > THRESHOLDS.successRate.excellent) return 'excellent';
    if (successRate > THRESHOLDS.successRate.good) return 'good';
    if (successRate > THRESHOLDS.successRate.acceptable) return 'acceptable';
    return 'poor';
  }

  rateThroughput(throughput) {
    if (throughput > THRESHOLDS.throughput.excellent) return 'excellent';
    if (throughput > THRESHOLDS.throughput.good) return 'good';
    if (throughput > THRESHOLDS.throughput.acceptable) return 'acceptable';
    return 'poor';
  }

  generateOverallAnalysis() {
    // Group bottlenecks by type
    const bottlenecksByType = this.bottlenecks.reduce((acc, bottleneck) => {
      if (!acc[bottleneck.type]) {
        acc[bottleneck.type] = [];
      }
      acc[bottleneck.type].push(bottleneck);
      return acc;
    }, {});

    // Generate recommendations for each bottleneck type
    Object.keys(bottlenecksByType).forEach(type => {
      const bottlenecks = bottlenecksByType[type];
      const recommendations = this.generateRecommendations(type, bottlenecks);
      this.recommendations.push(...recommendations);
    });

    // Add general recommendations
    this.addGeneralRecommendations();
  }

  generateRecommendations(type, bottlenecks) {
    const recommendations = [];
    const severity = bottlenecks.some(b => b.severity === 'poor') ? 'high' : 'medium';

    switch (type) {
      case 'response_time':
        recommendations.push({
          category: 'Performance',
          priority: severity,
          title: 'Optimize Response Times',
          description: `Response times are ${bottlenecks[0].severity}. Current average: ${bottlenecks[0].value.toFixed(2)}ms`,
          actions: [
            'Implement database query optimization',
            'Add Redis caching for frequently accessed data',
            'Optimize API endpoint logic',
            'Consider implementing response compression',
            'Review and optimize database indexes'
          ],
          affectedTests: bottlenecks.map(b => b.test)
        });
        break;

      case 'error_rate':
        recommendations.push({
          category: 'Reliability',
          priority: severity,
          title: 'Reduce Error Rates',
          description: `Error rate is ${bottlenecks[0].severity}. Current rate: ${(bottlenecks[0].value * 100).toFixed(2)}%`,
          actions: [
            'Implement proper error handling and retry logic',
            'Add input validation and sanitization',
            'Review and fix database connection issues',
            'Implement circuit breaker pattern',
            'Add comprehensive logging for error tracking'
          ],
          affectedTests: bottlenecks.map(b => b.test)
        });
        break;

      case 'throughput':
        recommendations.push({
          category: 'Scalability',
          priority: severity,
          title: 'Improve Throughput',
          description: `Throughput is ${bottlenecks[0].severity}. Current: ${bottlenecks[0].value.toFixed(2)} req/s`,
          actions: [
            'Implement horizontal scaling',
            'Add load balancing',
            'Optimize database connection pooling',
            'Implement async processing for heavy operations',
            'Consider microservices architecture'
          ],
          affectedTests: bottlenecks.map(b => b.test)
        });
        break;
    }

    return recommendations;
  }

  addGeneralRecommendations() {
    // Database optimization
    this.recommendations.push({
      category: 'Database',
      priority: 'medium',
      title: 'Database Optimization',
      description: 'General database performance improvements',
      actions: [
        'Add database indexes for frequently queried columns',
        'Implement query result caching',
        'Optimize database connection pool settings',
        'Consider read replicas for read-heavy operations',
        'Implement database query monitoring'
      ],
      affectedTests: ['All database-dependent endpoints']
    });

    // Caching strategy
    this.recommendations.push({
      category: 'Caching',
      priority: 'medium',
      title: 'Implement Caching Strategy',
      description: 'Add caching to improve performance',
      actions: [
        'Implement Redis for session storage',
        'Add response caching for product listings',
        'Cache user preferences and recommendations',
        'Implement CDN for static assets',
        'Add database query result caching'
      ],
      affectedTests: ['Product endpoints', 'User endpoints']
    });

    // Monitoring and alerting
    this.recommendations.push({
      category: 'Monitoring',
      priority: 'low',
      title: 'Enhanced Monitoring',
      description: 'Improve monitoring and alerting capabilities',
      actions: [
        'Implement APM (Application Performance Monitoring)',
        'Add custom metrics and dashboards',
        'Set up automated alerting for performance degradation',
        'Implement health check endpoints',
        'Add performance regression testing to CI/CD'
      ],
      affectedTests: ['All endpoints']
    });
  }

  printAnalysis() {
    console.log('\n📊 PERFORMANCE ANALYSIS REPORT');
    console.log('='.repeat(60));

    if (this.bottlenecks.length === 0) {
      console.log('✅ No significant performance bottlenecks detected!');
      console.log('   Your API is performing well across all metrics.');
      return;
    }

    console.log(`\n🚨 BOTTLENECKS DETECTED (${this.bottlenecks.length}):`);
    console.log('-'.repeat(40));

    const bottlenecksByType = this.bottlenecks.reduce((acc, bottleneck) => {
      if (!acc[bottleneck.type]) {
        acc[bottleneck.type] = [];
      }
      acc[bottleneck.type].push(bottleneck);
      return acc;
    }, {});

    Object.keys(bottlenecksByType).forEach(type => {
      const bottlenecks = bottlenecksByType[type];
      const severity = bottlenecks.some(b => b.severity === 'poor') ? '🔴 HIGH' : '🟡 MEDIUM';
      
      console.log(`\n${severity} ${type.toUpperCase().replace('_', ' ')}:`);
      bottlenecks.forEach(bottleneck => {
        console.log(`   • ${bottleneck.test}: ${bottleneck.value.toFixed(2)} (threshold: ${bottleneck.threshold})`);
      });
    });

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(40));

    const recommendationsByCategory = this.recommendations.reduce((acc, rec) => {
      if (!acc[rec.category]) {
        acc[rec.category] = [];
      }
      acc[rec.category].push(rec);
      return acc;
    }, {});

    Object.keys(recommendationsByCategory).forEach(category => {
      console.log(`\n📋 ${category}:`);
      recommendationsByCategory[category].forEach(rec => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`\n   ${priority} ${rec.title}`);
        console.log(`      ${rec.description}`);
        console.log(`      Actions:`);
        rec.actions.forEach(action => {
          console.log(`        • ${action}`);
        });
        console.log(`      Affected: ${rec.affectedTests.join(', ')}`);
      });
    });
  }

  async saveAnalysis() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const analysisFile = path.join('./tests/performance/results', `analysis-${timestamp}.json`);
    
    const analysis = {
      timestamp: new Date().toISOString(),
      thresholds: THRESHOLDS,
      bottlenecks: this.bottlenecks,
      recommendations: this.recommendations,
      summary: {
        totalBottlenecks: this.bottlenecks.length,
        highPriorityIssues: this.bottlenecks.filter(b => b.severity === 'poor').length,
        mediumPriorityIssues: this.bottlenecks.filter(b => b.severity === 'acceptable').length,
        totalRecommendations: this.recommendations.length
      }
    };

    // Ensure results directory exists
    if (!fs.existsSync('./tests/performance/results')) {
      fs.mkdirSync('./tests/performance/results', { recursive: true });
    }

    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
    console.log(`\n💾 Analysis report saved to: ${analysisFile}`);
  }
}

// Main execution
async function main() {
  const resultsDir = process.argv[2] || './tests/performance/results';
  
  console.log('🔍 Performance Optimization Analyzer');
  console.log('='.repeat(40));
  console.log(`📁 Results directory: ${resultsDir}`);

  const analyzer = new PerformanceAnalyzer();
  
  try {
    await analyzer.analyzeResults(resultsDir);
    console.log('\n✅ Analysis completed successfully!');
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { PerformanceAnalyzer };
