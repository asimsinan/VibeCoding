// Performance Monitoring Utilities
// Track and report Core Web Vitals and other performance metrics

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  navigationType?: string;
}

export interface WebVitalsMetrics {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

// Get performance rating
export function getPerformanceRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
  
  if (!threshold) {
    return 'good';
  }

  if (value <= threshold.good) {
    return 'good';
  }
  
  if (value <= threshold.poor) {
    return 'needs-improvement';
  }
  
  return 'poor';
}

// Report performance metric
export function reportMetric(metric: PerformanceMetric): void {
  // Send to analytics service
  console.log('[Performance]', metric);

  // You can send to your analytics service here
  // Example: sendToAnalytics(metric);
}

// Get Largest Contentful Paint (LCP)
export function getLCP(callback: (metric: PerformanceMetric) => void): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        const metric: PerformanceMetric = {
          name: 'LCP',
          value: lastEntry.renderTime || lastEntry.loadTime,
          rating: getPerformanceRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
        };

        callback(metric);
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.error('[Performance] LCP observation failed:', error);
    }
  }
}

// Get First Input Delay (FID)
export function getFID(callback: (metric: PerformanceMetric) => void): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as any;

        const metric: PerformanceMetric = {
          name: 'FID',
          value: firstEntry.processingStart - firstEntry.startTime,
          rating: getPerformanceRating('FID', firstEntry.processingStart - firstEntry.startTime),
        };

        callback(metric);
        observer.disconnect();
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.error('[Performance] FID observation failed:', error);
    }
  }
}

// Get Cumulative Layout Shift (CLS)
export function getCLS(callback: (metric: PerformanceMetric) => void): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('PerformanceObserver' in window) {
    try {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries: any[] = [];

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          // Only count layout shifts without recent user input
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            // If the entry occurred less than 1 second after the previous entry and
            // less than 5 seconds after the first entry in the session, include the
            // entry in the current session. Otherwise, start a new session.
            if (
              sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000
            ) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }

            // If the current session value is larger than the current CLS value,
            // update CLS and the entries contributing to it.
            if (sessionValue > clsValue) {
              clsValue = sessionValue;
            }
          }
        }

        const metric: PerformanceMetric = {
          name: 'CLS',
          value: clsValue,
          rating: getPerformanceRating('CLS', clsValue),
        };

        callback(metric);
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.error('[Performance] CLS observation failed:', error);
    }
  }
}

// Get First Contentful Paint (FCP)
export function getFCP(callback: (metric: PerformanceMetric) => void): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as any;

        const metric: PerformanceMetric = {
          name: 'FCP',
          value: firstEntry.startTime,
          rating: getPerformanceRating('FCP', firstEntry.startTime),
        };

        callback(metric);
        observer.disconnect();
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch (error) {
      console.error('[Performance] FCP observation failed:', error);
    }
  }
}

// Get Time to First Byte (TTFB)
export function getTTFB(callback: (metric: PerformanceMetric) => void): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const navigationEntry = entries[0] as any;

        const metric: PerformanceMetric = {
          name: 'TTFB',
          value: navigationEntry.responseStart - navigationEntry.requestStart,
          rating: getPerformanceRating('TTFB', navigationEntry.responseStart - navigationEntry.requestStart),
        };

        callback(metric);
        observer.disconnect();
      });

      observer.observe({ type: 'navigation', buffered: true });
    } catch (error) {
      console.error('[Performance] TTFB observation failed:', error);
    }
  }
}

// Get Interaction to Next Paint (INP)
export function getINP(callback: (metric: PerformanceMetric) => void): void {
  if (typeof window === 'undefined') {
    return;
  }

  if ('PerformanceObserver' in window) {
    try {
      let maxDuration = 0;

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        for (const entry of entries as any[]) {
          if (entry.duration > maxDuration) {
            maxDuration = entry.duration;
          }
        }

        const metric: PerformanceMetric = {
          name: 'INP',
          value: maxDuration,
          rating: getPerformanceRating('INP', maxDuration),
        };

        callback(metric);
      });

      observer.observe({ type: 'event', buffered: true, durationThreshold: 40 });
    } catch (error) {
      console.error('[Performance] INP observation failed:', error);
    }
  }
}

// Initialize all Core Web Vitals monitoring
export function initWebVitals(callback: (metric: PerformanceMetric) => void): void {
  getLCP(callback);
  getFID(callback);
  getCLS(callback);
  getFCP(callback);
  getTTFB(callback);
  getINP(callback);
}

// Get navigation timing
export function getNavigationTiming(): PerformanceTiming | null {
  if (typeof window === 'undefined' || !window.performance || !window.performance.timing) {
    return null;
  }

  return window.performance.timing;
}

// Get resource timing
export function getResourceTiming(): PerformanceResourceTiming[] {
  if (typeof window === 'undefined' || !window.performance || !window.performance.getEntriesByType) {
    return [];
  }

  return window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];
}

// Get memory usage (Chrome only)
export function getMemoryUsage(): any {
  if (typeof window === 'undefined') {
    return null;
  }

  const performance = window.performance as any;
  
  if (performance && performance.memory) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
    };
  }

  return null;
}

// Calculate performance score
export function calculatePerformanceScore(metrics: WebVitalsMetrics): number {
  let score = 100;

  // LCP weight: 25%
  if (metrics.LCP) {
    const lcpRating = getPerformanceRating('LCP', metrics.LCP);
    if (lcpRating === 'needs-improvement') {score -= 10;}
    if (lcpRating === 'poor') {score -= 25;}
  }

  // FID weight: 25%
  if (metrics.FID) {
    const fidRating = getPerformanceRating('FID', metrics.FID);
    if (fidRating === 'needs-improvement') {score -= 10;}
    if (fidRating === 'poor') {score -= 25;}
  }

  // CLS weight: 25%
  if (metrics.CLS) {
    const clsRating = getPerformanceRating('CLS', metrics.CLS);
    if (clsRating === 'needs-improvement') {score -= 10;}
    if (clsRating === 'poor') {score -= 25;}
  }

  // FCP weight: 15%
  if (metrics.FCP) {
    const fcpRating = getPerformanceRating('FCP', metrics.FCP);
    if (fcpRating === 'needs-improvement') {score -= 6;}
    if (fcpRating === 'poor') {score -= 15;}
  }

  // TTFB weight: 10%
  if (metrics.TTFB) {
    const ttfbRating = getPerformanceRating('TTFB', metrics.TTFB);
    if (ttfbRating === 'needs-improvement') {score -= 4;}
    if (ttfbRating === 'poor') {score -= 10;}
  }

  return Math.max(0, Math.min(100, score));
}
