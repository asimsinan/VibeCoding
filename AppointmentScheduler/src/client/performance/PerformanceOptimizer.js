/**
 * Performance Optimizer
 * 
 * Performance optimization utilities:
 * - Lazy loading implementation
 * - Memoization utilities
 * - Virtual scrolling
 * - Debounced API calls
 * - Memory leak prevention
 * - Bundle optimization
 * - Runtime optimization
 * - Network optimization
 * 
 * Maps to TASK-016: API Data Flow Integration
 * TDD Phase: Implementation
 * Constitutional Compliance: Performance Gate, Security Gate
 */

class PerformanceOptimizer {
  constructor() {
    this.observers = new Map();
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    this.intersectionObserver = null;
    this.performanceObserver = null;
    
    this.setupPerformanceMonitoring();
    this.setupIntersectionObserver();
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      } catch (error) {
        console.warn('Performance monitoring not fully supported:', error);
      }
    }
  }

  /**
   * Setup intersection observer for lazy loading
   */
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const callback = entry.target._lazyCallback;
              if (callback) {
                callback();
                this.intersectionObserver.unobserve(entry.target);
              }
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );
    }
  }

  /**
   * Handle performance entries
   */
  handlePerformanceEntry(entry) {
    switch (entry.entryType) {
      case 'measure':
        this.handleMeasureEntry(entry);
        break;
      case 'navigation':
        this.handleNavigationEntry(entry);
        break;
      case 'paint':
        this.handlePaintEntry(entry);
        break;
    }
  }

  /**
   * Handle measure entries
   */
  handleMeasureEntry(entry) {
    if (entry.duration > 100) {
      console.warn(`Slow operation detected: ${entry.name} took ${entry.duration}ms`);
    }
  }

  /**
   * Handle navigation entries
   */
  handleNavigationEntry(entry) {
    const metrics = {
      loadTime: entry.loadEventEnd - entry.loadEventStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      firstByte: entry.responseStart - entry.requestStart,
      domInteractive: entry.domInteractive - entry.navigationStart
    };

    // Log Core Web Vitals
    if (metrics.loadTime > 3000) {
      console.warn('Slow page load detected:', metrics.loadTime + 'ms');
    }
  }

  /**
   * Handle paint entries
   */
  handlePaintEntry(entry) {
    if (entry.name === 'first-contentful-paint' && entry.startTime > 1800) {
      console.warn('Slow first contentful paint:', entry.startTime + 'ms');
    }
  }

  /**
   * Debounce function calls
   */
  debounce(func, delay, key = 'default') {
    return (...args) => {
      const timerKey = `${key}_${func.name}`;
      
      if (this.debounceTimers.has(timerKey)) {
        clearTimeout(this.debounceTimers.get(timerKey));
      }

      const timer = setTimeout(() => {
        func.apply(this, args);
        this.debounceTimers.delete(timerKey);
      }, delay);

      this.debounceTimers.set(timerKey, timer);
    };
  }

  /**
   * Throttle function calls
   */
  throttle(func, delay, key = 'default') {
    return (...args) => {
      const timerKey = `${key}_${func.name}`;
      
      if (this.throttleTimers.has(timerKey)) {
        return;
      }

      func.apply(this, args);

      const timer = setTimeout(() => {
        this.throttleTimers.delete(timerKey);
      }, delay);

      this.throttleTimers.set(timerKey, timer);
    };
  }

  /**
   * Lazy load component
   */
  lazyLoad(element, callback) {
    if (!this.intersectionObserver) {
      // Fallback: execute immediately
      callback();
      return;
    }

    element._lazyCallback = callback;
    this.intersectionObserver.observe(element);
  }

  /**
   * Virtual scrolling for large lists
   */
  createVirtualScroller({
    container,
    itemHeight,
    itemCount,
    renderItem,
    overscan = 5
  }) {
    let scrollTop = 0;
    let containerHeight = 0;

    const updateVisibleItems = () => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
        itemCount - 1
      );

      const visibleItems = [];
      for (let i = startIndex; i <= endIndex; i++) {
        visibleItems.push({
          index: i,
          top: i * itemHeight,
          data: renderItem(i)
        });
      }

      return {
        visibleItems,
        startIndex,
        endIndex,
        totalHeight: itemCount * itemHeight
      };
    };

    const handleScroll = (event) => {
      scrollTop = event.target.scrollTop;
      const { visibleItems, totalHeight } = updateVisibleItems();
      
      // Update container height
      container.style.height = `${totalHeight}px`;
      
      // Render visible items
      container.innerHTML = '';
      visibleItems.forEach(item => {
        const element = document.createElement('div');
        element.style.position = 'absolute';
        element.style.top = `${item.top}px`;
        element.style.height = `${itemHeight}px`;
        element.innerHTML = item.data;
        container.appendChild(element);
      });
    };

    // Initial setup
    container.addEventListener('scroll', this.throttle(handleScroll, 16, 'virtual-scroll'));
    
    // Initial render
    containerHeight = container.clientHeight;
    handleScroll({ target: container });

    return {
      update: () => {
        containerHeight = container.clientHeight;
        handleScroll({ target: container });
      },
      destroy: () => {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }

  /**
   * Optimize images
   */
  optimizeImages(selector = 'img') {
    const images = document.querySelectorAll(selector);
    
    images.forEach(img => {
      // Add loading="lazy" if not already present
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      // Add decoding="async" for better performance
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }

      // Add error handling
      img.addEventListener('error', () => {
        img.src = '/placeholder-image.png';
        img.alt = 'Image failed to load';
      });
    });
  }

  /**
   * Preload critical resources
   */
  preloadResource(href, as = 'script') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (as === 'script') {
      link.onload = () => {
        const script = document.createElement('script');
        script.src = href;
        document.head.appendChild(script);
      };
    }
    
    document.head.appendChild(link);
  }

  /**
   * Prefetch resources
   */
  prefetchResource(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }

  /**
   * Measure performance
   */
  measure(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    performance.mark(`${name}-start`);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    
    return result;
  }

  /**
   * Monitor memory usage
   */
  monitorMemory() {
    if ('memory' in performance) {
      const memory = performance.memory;
      
      setInterval(() => {
        const used = memory.usedJSHeapSize / 1024 / 1024; // MB
        const total = memory.totalJSHeapSize / 1024 / 1024; // MB
        const limit = memory.jsHeapSizeLimit / 1024 / 1024; // MB
        
        if (used > limit * 0.8) {
          console.warn('High memory usage detected:', {
            used: `${used.toFixed(2)}MB`,
            total: `${total.toFixed(2)}MB`,
            limit: `${limit.toFixed(2)}MB`
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.throttleTimers.clear();

    // Disconnect observers
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const metrics = {
      memory: null,
      timing: null,
      paint: null
    };

    if ('memory' in performance) {
      metrics.memory = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }

    if ('timing' in performance) {
      const timing = performance.timing;
      metrics.timing = {
        loadTime: timing.loadEventEnd - timing.loadEventStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        firstByte: timing.responseStart - timing.requestStart
      };
    }

    return metrics;
  }
}

// Create singleton instance
const performanceOptimizer = new PerformanceOptimizer();

module.exports = { PerformanceOptimizer, performanceOptimizer };
