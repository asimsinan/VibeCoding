/**
 * Performance Monitoring Service
 * Tracks Core Web Vitals and application performance metrics
 */

export interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  loadTime: number; // Total page load time
}

export interface CustomMetrics {
  apiResponseTime: number;
  databaseQueryTime: number;
  renderTime: number;
  memoryUsage: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private customMetrics: CustomMetrics[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' && 
                    process.env.ENABLE_PERFORMANCE_MONITORING === 'true';
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (!this.isEnabled || typeof window === 'undefined') {
      return;
    }

    this.observeWebVitals();
    this.observeCustomMetrics();
  }

  /**
   * Observe Core Web Vitals
   */
  private observeWebVitals(): void {
    // LCP - Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('lcp', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID - First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.recordMetric('fid', (entry as any).processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.recordMetric('cls', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });

    // FCP - First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('fcp', entry.startTime);
        }
      });
    }).observe({ entryTypes: ['paint'] });
  }

  /**
   * Observe custom application metrics
   */
  private observeCustomMetrics(): void {
    // Page load time
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      this.recordCustomMetric('loadTime' as keyof CustomMetrics, loadTime);
    });

    // Memory usage (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordCustomMetric('memoryUsage', memory.usedJSHeapSize);
      }, 30000); // Every 30 seconds
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(type: keyof PerformanceMetrics, value: number): void {
    if (!this.isEnabled) return;

    this.metrics.push({
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
      loadTime: 0,
      [type]: value,
    });

    // Send to analytics service
    this.sendToAnalytics(type, value);
  }

  /**
   * Record a custom metric
   */
  recordCustomMetric(type: keyof CustomMetrics, value: number): void {
    if (!this.isEnabled) return;

    this.customMetrics.push({
      apiResponseTime: 0,
      databaseQueryTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      [type]: value,
    });

    this.sendToAnalytics(type, value);
  }

  /**
   * Track API response time
   */
  trackApiCall<T>(apiCall: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    return apiCall().then(
      (result) => {
        const endTime = performance.now();
        this.recordCustomMetric('apiResponseTime', endTime - startTime);
        return result;
      },
      (error) => {
        const endTime = performance.now();
        this.recordCustomMetric('apiResponseTime', endTime - startTime);
        throw error;
      }
    );
  }

  /**
   * Track render time
   */
  trackRender(componentName: string, renderFn: () => void): void {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    this.recordCustomMetric('renderTime', endTime - startTime);
    console.log(`${componentName} rendered in ${endTime - startTime}ms`);
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(type: string, value: number): void {
    // In a real application, this would send to your analytics service
    // For now, we'll just log it
    console.log(`Performance Metric: ${type} = ${value}ms`);
    
    // Example: Send to Google Analytics
    if (typeof (window as any).gtag !== 'undefined') {
      (window as any).gtag('event', 'performance_metric', {
        metric_type: type,
        metric_value: value,
        custom_parameter: 'moodtracker_app'
      });
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageMetrics: Partial<PerformanceMetrics>;
    averageCustomMetrics: Partial<CustomMetrics>;
    totalMeasurements: number;
  } {
    const totalMetrics = this.metrics.length;
    const totalCustomMetrics = this.customMetrics.length;

    const averageMetrics: Partial<PerformanceMetrics> = {};
    const averageCustomMetrics: Partial<CustomMetrics> = {};

    if (totalMetrics > 0) {
      const keys = ['lcp', 'fid', 'cls', 'fcp', 'ttfb', 'loadTime'] as const;
      keys.forEach(key => {
        const values = this.metrics.map(m => m[key]).filter(v => v > 0);
        if (values.length > 0) {
          averageMetrics[key] = values.reduce((a, b) => a + b, 0) / values.length;
        }
      });
    }

    if (totalCustomMetrics > 0) {
      const keys = ['apiResponseTime', 'databaseQueryTime', 'renderTime', 'memoryUsage'] as const;
      keys.forEach(key => {
        const values = this.customMetrics.map(m => m[key]).filter(v => v > 0);
        if (values.length > 0) {
          averageCustomMetrics[key] = values.reduce((a, b) => a + b, 0) / values.length;
        }
      });
    }

    return {
      averageMetrics,
      averageCustomMetrics,
      totalMeasurements: totalMetrics + totalCustomMetrics,
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.customMetrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
