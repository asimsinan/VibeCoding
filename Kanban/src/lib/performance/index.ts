/**
 * Performance monitoring utilities
 * Provides tools for measuring and optimizing application performance
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  
  // Custom metrics
  loadTime: number | null;
  domContentLoaded: number | null;
  firstPaint: number | null;
  firstContentfulPaint: number | null;
  
  // Resource metrics
  resourceCount: number;
  resourceSize: number;
  
  // Memory metrics
  memoryUsage: number | null;
  memoryLimit: number | null;
}

export interface PerformanceConfig {
  enableCoreWebVitals: boolean;
  enableCustomMetrics: boolean;
  enableResourceMetrics: boolean;
  enableMemoryMetrics: boolean;
  sampleRate: number; // 0-1, percentage of users to sample
}

const defaultConfig: PerformanceConfig = {
  enableCoreWebVitals: true,
  enableCustomMetrics: true,
  enableResourceMetrics: true,
  enableMemoryMetrics: true,
  sampleRate: 0.1, // 10% of users
};

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
      loadTime: null,
      domContentLoaded: null,
      firstPaint: null,
      firstContentfulPaint: null,
      resourceCount: 0,
      resourceSize: 0,
      memoryUsage: null,
      memoryLimit: null,
    };
  }

  /**
   * Initialize performance monitoring
   */
  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // Check if we should sample this user
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    this.setupCoreWebVitals();
    this.setupCustomMetrics();
    this.setupResourceMetrics();
    this.setupMemoryMetrics();
    this.setupNavigationTiming();

    this.isInitialized = true;
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  private setupCoreWebVitals(): void {
    if (!this.config.enableCoreWebVitals) return;

    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP monitoring not supported');
      }

      // FID - First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              this.metrics.fid = entry.processingStart - entry.startTime;
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID monitoring not supported');
      }

      // CLS - Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS monitoring not supported');
      }

      // FCP - First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (e) {
        console.warn('FCP monitoring not supported');
      }
    }
  }

  /**
   * Setup custom performance metrics
   */
  private setupCustomMetrics(): void {
    if (!this.config.enableCustomMetrics) return;

    // Load time
    window.addEventListener('load', () => {
      this.metrics.loadTime = performance.now();
    });

    // DOM Content Loaded
    document.addEventListener('DOMContentLoaded', () => {
      this.metrics.domContentLoaded = performance.now();
    });

    // First Paint and First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-paint') {
              this.metrics.firstPaint = entry.startTime;
            }
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
            }
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (e) {
        console.warn('Paint monitoring not supported');
      }
    }
  }

  /**
   * Setup resource metrics monitoring
   */
  private setupResourceMetrics(): void {
    if (!this.config.enableResourceMetrics) return;

    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.resourceCount++;
            this.metrics.resourceSize += entry.transferSize || 0;
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn('Resource monitoring not supported');
      }
    }
  }

  /**
   * Setup memory metrics monitoring
   */
  private setupMemoryMetrics(): void {
    if (!this.config.enableMemoryMetrics) return;

    // Memory usage (Chrome only)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
      this.metrics.memoryLimit = memory.jsHeapSizeLimit;
    }
  }

  /**
   * Setup navigation timing
   */
  private setupNavigationTiming(): void {
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.entryType === 'navigation') {
              this.metrics.ttfb = entry.responseStart - entry.requestStart;
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.warn('Navigation timing not supported');
      }
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get Core Web Vitals score
   */
  public getCoreWebVitalsScore(): { lcp: string; fid: string; cls: string; fcp: string } {
    const getLCPScore = (lcp: number | null): string => {
      if (lcp === null) return 'unknown';
      if (lcp <= 2500) return 'good';
      if (lcp <= 4000) return 'needs-improvement';
      return 'poor';
    };

    const getFIDScore = (fid: number | null): string => {
      if (fid === null) return 'unknown';
      if (fid <= 100) return 'good';
      if (fid <= 300) return 'needs-improvement';
      return 'poor';
    };

    const getCLSScore = (cls: number | null): string => {
      if (cls === null) return 'unknown';
      if (cls <= 0.1) return 'good';
      if (cls <= 0.25) return 'needs-improvement';
      return 'poor';
    };

    const getFCPScore = (fcp: number | null): string => {
      if (fcp === null) return 'unknown';
      if (fcp <= 1800) return 'good';
      if (fcp <= 3000) return 'needs-improvement';
      return 'poor';
    };

    return {
      lcp: getLCPScore(this.metrics.lcp),
      fid: getFIDScore(this.metrics.fid),
      cls: getCLSScore(this.metrics.cls),
      fcp: getFCPScore(this.metrics.fcp),
    };
  }

  /**
   * Send metrics to analytics service
   */
  public sendMetrics(endpoint: string): void {
    if (typeof window === 'undefined') return;

    const metrics = this.getMetrics();
    const scores = this.getCoreWebVitalsScore();

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics,
        scores,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    }).catch((error) => {
      console.warn('Failed to send performance metrics:', error);
    });
  }

  /**
   * Cleanup observers
   */
  public cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

/**
 * Get the performance monitor instance
 */
export function getPerformanceMonitor(config?: Partial<PerformanceConfig>): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(config);
  }
  return performanceMonitor;
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring(config?: Partial<PerformanceConfig>): void {
  const monitor = getPerformanceMonitor(config);
  monitor.initialize();
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  const monitor = getPerformanceMonitor();
  return monitor.getMetrics();
}

/**
 * Get Core Web Vitals score
 */
export function getCoreWebVitalsScore(): { lcp: string; fid: string; cls: string; fcp: string } {
  const monitor = getPerformanceMonitor();
  return monitor.getCoreWebVitalsScore();
}

/**
 * Send performance metrics to analytics
 */
export function sendPerformanceMetrics(endpoint: string): void {
  const monitor = getPerformanceMonitor();
  monitor.sendMetrics(endpoint);
}

/**
 * Cleanup performance monitoring
 */
export function cleanupPerformanceMonitoring(): void {
  if (performanceMonitor) {
    performanceMonitor.cleanup();
    performanceMonitor = null;
  }
}
