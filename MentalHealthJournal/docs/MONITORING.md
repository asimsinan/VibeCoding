# Monitoring and Alerting Setup

## Overview

This document outlines the comprehensive monitoring and alerting system for the Mental Health Journal App, ensuring optimal performance, reliability, and user experience.

## 🎯 Monitoring Objectives

### Key Performance Indicators (KPIs)

- **Availability**: 99.9% uptime target
- **Response Time**: < 200ms for API calls, < 2s for page loads
- **Error Rate**: < 0.1% of all requests
- **User Satisfaction**: > 4.5/5 rating
- **Data Integrity**: 100% data consistency

### Business Metrics

- **Active Users**: Daily, weekly, monthly active users
- **Engagement**: Mood entries per user, session duration
- **Retention**: User retention rates over time
- **Growth**: New user registrations, feature adoption

## 📊 Monitoring Stack

### Application Performance Monitoring (APM)

**Sentry Integration:**
```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter sensitive data
    if (event.user) {
      delete event.user.email;
    }
    return event;
  },
});
```

**Custom Performance Metrics:**
```typescript
// src/lib/monitoring/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  trackPageLoad(page: string, loadTime: number): void {
    this.recordMetric(`page_load_${page}`, loadTime);
  }

  trackApiCall(endpoint: string, duration: number, status: number): void {
    this.recordMetric(`api_${endpoint}`, duration);
    this.recordMetric(`api_status_${status}`, 1);
  }

  trackUserAction(action: string, duration: number): void {
    this.recordMetric(`user_action_${action}`, duration);
  }

  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetrics(): Record<string, { avg: number; p95: number; count: number }> {
    const result: Record<string, { avg: number; p95: number; count: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      const sorted = values.sort((a, b) => a - b);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const p95Index = Math.floor(sorted.length * 0.95);
      
      result[name] = {
        avg,
        p95: sorted[p95Index] || 0,
        count: values.length
      };
    }
    
    return result;
  }
}
```

### Infrastructure Monitoring

**Prometheus Metrics:**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'moodtracker-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:5432']
    scrape_interval: 10s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
    scrape_interval: 10s
```

**Grafana Dashboards:**
```json
{
  "dashboard": {
    "title": "Mental Health Journal App - Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      }
    ]
  }
}
```

### Database Monitoring

**PostgreSQL Metrics:**
```sql
-- monitoring/queries/performance.sql
-- Active connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- Slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
WHERE mean_time > 1000
ORDER BY mean_time DESC
LIMIT 10;

-- Database size
SELECT pg_size_pretty(pg_database_size('moodtracker_production'));

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

**IndexedDB Monitoring:**
```typescript
// src/lib/monitoring/indexeddb.ts
export class IndexedDBMonitor {
  static async getStorageInfo(): Promise<{
    used: number;
    available: number;
    total: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota ? estimate.quota - (estimate.usage || 0) : 0,
        total: estimate.quota || 0
      };
    }
    return { used: 0, available: 0, total: 0 };
  }

  static async getDatabaseSize(): Promise<number> {
    try {
      const db = await openDB('MoodTrackerDB', 1);
      const transaction = db.transaction(['moodEntries'], 'readonly');
      const store = transaction.objectStore('moodEntries');
      const count = await store.count();
      return count;
    } catch (error) {
      console.error('Failed to get database size:', error);
      return 0;
    }
  }
}
```

## 🚨 Alerting Rules

### Critical Alerts

**High Error Rate:**
```yaml
# alert_rules.yml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} errors per second"
```

**High Response Time:**
```yaml
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High response time detected"
    description: "95th percentile response time is {{ $value }}s"
```

**Database Connection Issues:**
```yaml
- alert: DatabaseConnectionFailed
  expr: up{job="postgres"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Database connection failed"
    description: "PostgreSQL database is unreachable"
```

**Low Disk Space:**
```yaml
- alert: LowDiskSpace
  expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Low disk space"
    description: "Disk space is {{ $value | humanizePercentage }} full"
```

### Warning Alerts

**Memory Usage:**
```yaml
- alert: HighMemoryUsage
  expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.8
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "High memory usage"
    description: "Memory usage is {{ $value | humanizePercentage }}"
```

**CPU Usage:**
```yaml
- alert: HighCPUUsage
  expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage"
    description: "CPU usage is {{ $value }}%"
```

### Business Alerts

**User Registration Spike:**
```yaml
- alert: UserRegistrationSpike
  expr: rate(user_registrations_total[1h]) > 100
  for: 5m
  labels:
    severity: info
  annotations:
    summary: "Unusual user registration activity"
    description: "{{ $value }} registrations per hour"
```

**Mood Entry Drop:**
```yaml
- alert: MoodEntryDrop
  expr: rate(mood_entries_created_total[1h]) < 10
  for: 30m
  labels:
    severity: warning
  annotations:
    summary: "Low mood entry activity"
    description: "Only {{ $value }} entries per hour"
```

## 📈 Health Checks

### Application Health

**Health Check Endpoint:**
```typescript
// src/app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/monitoring/database';
import { checkIndexedDBHealth } from '@/lib/monitoring/indexeddb';

export async function GET(request: NextRequest) {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: await checkDatabaseConnection(),
      indexeddb: await checkIndexedDBHealth(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };

  const isHealthy = Object.values(checks.checks).every(check => 
    typeof check === 'object' ? check.status === 'healthy' : true
  );

  return NextResponse.json(checks, {
    status: isHealthy ? 200 : 503
  });
}
```

**Database Health Check:**
```typescript
// src/lib/monitoring/database.ts
export async function checkDatabaseConnection(): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    // Simple query to test connection
    const result = await db.query('SELECT 1');
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### User Experience Monitoring

**Core Web Vitals:**
```typescript
// src/lib/monitoring/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function trackWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  console.log('Web Vital:', metric);
  
  // Send to Sentry
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${metric.name}: ${metric.value}`,
    level: 'info'
  });
}
```

**User Journey Tracking:**
```typescript
// src/lib/monitoring/user-journey.ts
export class UserJourneyTracker {
  private static sessionId: string = crypto.randomUUID();
  private static events: any[] = [];

  static trackEvent(event: string, properties: any = {}) {
    const journeyEvent = {
      sessionId: this.sessionId,
      event,
      properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.events.push(journeyEvent);
    
    // Send to analytics
    this.sendToAnalytics(journeyEvent);
  }

  static trackPageView(page: string) {
    this.trackEvent('page_view', { page });
  }

  static trackMoodEntry(rating: number, hasNotes: boolean) {
    this.trackEvent('mood_entry_created', {
      rating,
      hasNotes,
      timestamp: new Date().toISOString()
    });
  }

  private static sendToAnalytics(event: any) {
    // Send to your analytics service
    console.log('User Journey Event:', event);
  }
}
```

## 📊 Logging Strategy

### Structured Logging

**Log Format:**
```typescript
// src/lib/monitoring/logger.ts
export class Logger {
  private static instance: Logger;
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  static getLogger(context: string): Logger {
    return new Logger(context);
  }

  info(message: string, meta: any = {}) {
    this.log('info', message, meta);
  }

  error(message: string, error: Error, meta: any = {}) {
    this.log('error', message, { ...meta, error: error.stack });
  }

  warn(message: string, meta: any = {}) {
    this.log('warn', message, meta);
  }

  private log(level: string, message: string, meta: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      meta,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version
    };

    console.log(JSON.stringify(logEntry));
  }
}
```

**Log Aggregation:**
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./monitoring/promtail.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
```

## 🔔 Notification Channels

### Alert Manager Configuration

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@moodtracker.app'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://localhost:5001/webhook'
    send_resolved: true

- name: 'email'
  email_configs:
  - to: 'devops@moodtracker.app'
    subject: 'MoodTracker Alert: {{ .GroupLabels.alertname }}'
    body: |
      {{ range .Alerts }}
      Alert: {{ .Annotations.summary }}
      Description: {{ .Annotations.description }}
      {{ end }}

- name: 'slack'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/...'
    channel: '#alerts'
    title: 'MoodTracker Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

### PagerDuty Integration

```typescript
// src/lib/monitoring/pagerduty.ts
export class PagerDutyService {
  private static instance: PagerDutyService;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createIncident(alert: any): Promise<void> {
    const response = await fetch('https://api.pagerduty.com/incidents', {
      method: 'POST',
      headers: {
        'Authorization': `Token token=${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        incident: {
          type: 'incident',
          title: alert.title,
          service: {
            id: 'moodtracker-app',
            type: 'service_reference'
          },
          priority: {
            id: alert.severity === 'critical' ? 'P1' : 'P2',
            type: 'priority_reference'
          },
          body: {
            type: 'incident_body',
            details: alert.description
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create PagerDuty incident: ${response.statusText}`);
    }
  }
}
```

## 📱 Mobile Monitoring

### React Native Performance

```typescript
// src/lib/monitoring/react-native.ts
import { Performance } from 'react-native-performance';

export class ReactNativeMonitor {
  static trackScreenLoad(screenName: string, loadTime: number) {
    Performance.mark(`screen_load_${screenName}`, loadTime);
  }

  static trackUserInteraction(interaction: string, duration: number) {
    Performance.mark(`interaction_${interaction}`, duration);
  }

  static trackMemoryUsage() {
    const memoryInfo = Performance.getMemoryInfo();
    console.log('Memory Usage:', memoryInfo);
  }
}
```

### Offline Monitoring

```typescript
// src/lib/monitoring/offline.ts
export class OfflineMonitor {
  private static isOnline: boolean = navigator.onLine;
  private static offlineEvents: any[] = [];

  static init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineEvents();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.trackOfflineEvent();
    });
  }

  static trackOfflineEvent() {
    const event = {
      timestamp: new Date().toISOString(),
      type: 'offline',
      duration: 0
    };
    this.offlineEvents.push(event);
  }

  static async syncOfflineEvents() {
    if (this.offlineEvents.length > 0) {
      // Send offline events to analytics
      console.log('Syncing offline events:', this.offlineEvents);
      this.offlineEvents = [];
    }
  }
}
```

## 🎯 Monitoring Dashboard

### Real-time Dashboard

```typescript
// src/app/dashboard/page.tsx
export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setMetrics(data);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">System Monitoring</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Response Time"
          value={`${metrics?.responseTime || 0}ms`}
          status={metrics?.responseTime < 200 ? 'good' : 'warning'}
        />
        <MetricCard
          title="Error Rate"
          value={`${(metrics?.errorRate || 0) * 100}%`}
          status={metrics?.errorRate < 0.01 ? 'good' : 'critical'}
        />
        <MetricCard
          title="Active Users"
          value={metrics?.activeUsers || 0}
          status="good"
        />
        <MetricCard
          title="Uptime"
          value={`${(metrics?.uptime || 0) * 100}%`}
          status={metrics?.uptime > 0.999 ? 'good' : 'warning'}
        />
      </div>
    </div>
  );
}
```

## 🔧 Maintenance Tasks

### Automated Cleanup

```typescript
// scripts/cleanup.ts
export class MaintenanceTasks {
  static async cleanupOldLogs() {
    // Remove logs older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Implementation for log cleanup
    console.log('Cleaning up logs older than', thirtyDaysAgo);
  }

  static async optimizeDatabase() {
    // Run database optimization queries
    console.log('Optimizing database...');
  }

  static async backupData() {
    // Create data backup
    console.log('Creating data backup...');
  }
}
```

### Health Check Automation

```bash
#!/bin/bash
# scripts/health-check.sh

echo "Running health checks..."

# Check application health
curl -f http://localhost:3000/api/health || exit 1

# Check database connectivity
psql -h localhost -U moodtracker -d moodtracker_production -c "SELECT 1;" || exit 1

# Check disk space
df -h | awk '$5 > 80 {print "Disk space warning: " $0}'

# Check memory usage
free -h | awk 'NR==2{printf "Memory Usage: %s/%s (%.2f%%)\n", $3,$2,$3*100/$2 }'

echo "Health checks completed successfully"
```

---

This comprehensive monitoring setup ensures the Mental Health Journal App maintains high availability, performance, and user satisfaction while providing actionable insights for continuous improvement.
