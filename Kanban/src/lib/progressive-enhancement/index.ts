/**
 * Progressive Enhancement utilities
 * Ensures the application works without JavaScript and enhances with it
 */

export interface ProgressiveEnhancementConfig {
  enableJavaScript: boolean;
  enableAnimations: boolean;
  enableRealtime: boolean;
  enableAdvancedFeatures: boolean;
}

/**
 * Detect if JavaScript is enabled
 */
export function isJavaScriptEnabled(): boolean {
  return typeof window !== 'undefined' && 'document' in window;
}

/**
 * Detect if animations should be enabled based on user preferences
 */
export function shouldEnableAnimations(): boolean {
  if (typeof window === 'undefined') return true;
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return false;
  
  // Check for low-end device indicators
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
  if (isLowEndDevice) return false;
  
  return true;
}

/**
 * Detect if realtime features should be enabled
 */
export function shouldEnableRealtime(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for stable connection
  const connection = (navigator as any).connection;
  if (connection) {
    const isSlowConnection = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
    if (isSlowConnection) return false;
  }
  
  return true;
}

/**
 * Detect if advanced features should be enabled
 */
export function shouldEnableAdvancedFeatures(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for modern browser features
  const hasModernFeatures = 
    'IntersectionObserver' in window &&
    'ResizeObserver' in window &&
    'requestIdleCallback' in window;
  
  if (!hasModernFeatures) return false;
  
  // Check for sufficient memory
  const memory = (performance as any).memory;
  if (memory && memory.jsHeapSizeLimit < 100 * 1024 * 1024) { // Less than 100MB
    return false;
  }
  
  return true;
}

/**
 * Get the current progressive enhancement configuration
 */
export function getProgressiveEnhancementConfig(): ProgressiveEnhancementConfig {
  return {
    enableJavaScript: isJavaScriptEnabled(),
    enableAnimations: shouldEnableAnimations(),
    enableRealtime: shouldEnableRealtime(),
    enableAdvancedFeatures: shouldEnableAdvancedFeatures(),
  };
}

/**
 * Apply progressive enhancement to the document
 */
export function applyProgressiveEnhancement(): void {
  if (typeof document === 'undefined') return;
  
  const config = getProgressiveEnhancementConfig();
  
  // Add classes to document for CSS-based progressive enhancement
  const root = document.documentElement;
  
  if (config.enableJavaScript) {
    root.classList.add('js-enabled');
  }
  
  if (config.enableAnimations) {
    root.classList.add('animations-enabled');
  } else {
    root.classList.add('no-animations');
  }
  
  if (config.enableRealtime) {
    root.classList.add('realtime-enabled');
  }
  
  if (config.enableAdvancedFeatures) {
    root.classList.add('advanced-features-enabled');
  }
  
  // Set CSS custom properties for JavaScript-based progressive enhancement
  root.style.setProperty('--js-enabled', config.enableJavaScript ? '1' : '0');
  root.style.setProperty('--animations-enabled', config.enableAnimations ? '1' : '0');
  root.style.setProperty('--realtime-enabled', config.enableRealtime ? '1' : '0');
  root.style.setProperty('--advanced-features-enabled', config.enableAdvancedFeatures ? '1' : '0');
}

/**
 * Initialize progressive enhancement
 */
export function initializeProgressiveEnhancement(): void {
  // Apply immediately
  applyProgressiveEnhancement();
  
  // Re-apply on connection change
  if (typeof window !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    connection.addEventListener('change', applyProgressiveEnhancement);
  }
  
  // Re-apply on visibility change (user might have changed settings)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        applyProgressiveEnhancement();
      }
    });
  }
}
