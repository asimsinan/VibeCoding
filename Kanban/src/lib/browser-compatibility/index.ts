/**
 * Browser compatibility utilities
 * Provides feature detection and polyfills
 */

export interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
  features: Record<string, boolean>;
}

/**
 * Detect browser information
 */
export function detectBrowser(): BrowserInfo {
  if (typeof window === 'undefined') {
    return {
      name: 'unknown',
      version: '0',
      isSupported: false,
      features: {},
    };
  }

  const userAgent = navigator.userAgent;
  let name = 'unknown';
  let version = '0';

  // Detect browser
  if (userAgent.includes('Chrome')) {
    name = 'chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : '0';
  } else if (userAgent.includes('Firefox')) {
    name = 'firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : '0';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : '0';
  } else if (userAgent.includes('Edge')) {
    name = 'edge';
    const match = userAgent.match(/Edge\/(\d+)/);
    version = match ? match[1] : '0';
  }

  const features = detectFeatures();
  const isSupported = checkBrowserSupport(name, version, features);

  return { name, version, isSupported, features };
}

/**
 * Detect browser features
 */
export function detectFeatures(): Record<string, boolean> {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    // Modern JavaScript features
    es6Modules: 'noModule' in HTMLScriptElement.prototype,
    asyncAwait: typeof (async () => {})() === 'object',
    arrowFunctions: (() => {}) instanceof Function,
    templateLiterals: typeof `template` === 'string',
    
    // DOM features
    customElements: 'customElements' in window,
    shadowDOM: 'attachShadow' in Element.prototype,
    intersectionObserver: 'IntersectionObserver' in window,
    resizeObserver: 'ResizeObserver' in window,
    mutationObserver: 'MutationObserver' in window,
    
    // CSS features
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexbox: CSS.supports('display', 'flex'),
    cssCustomProperties: CSS.supports('--custom', 'value'),
    cssBackdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
    
    // Web APIs
    fetch: 'fetch' in window,
    promises: 'Promise' in window,
    webWorkers: 'Worker' in window,
    serviceWorkers: 'serviceWorker' in navigator,
    webSockets: 'WebSocket' in window,
    
    // Storage
    localStorage: 'localStorage' in window,
    sessionStorage: 'sessionStorage' in window,
    indexedDB: 'indexedDB' in window,
    
    // Media
    webRTC: 'RTCPeerConnection' in window,
    webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
    webGL: 'WebGLRenderingContext' in window,
    
    // Performance
    performance: 'performance' in window,
    requestAnimationFrame: 'requestAnimationFrame' in window,
    requestIdleCallback: 'requestIdleCallback' in window,
    
    // Security
    crypto: 'crypto' in window,
    subtleCrypto: 'crypto' in window && 'subtle' in window.crypto,
  };
}

/**
 * Check if browser is supported
 */
export function checkBrowserSupport(
  name: string, 
  version: string, 
  features: Record<string, boolean>
): boolean {
  const versionNum = parseInt(version, 10);
  
  // Minimum version requirements
  const minVersions: Record<string, number> = {
    chrome: 80,
    firefox: 75,
    safari: 13,
    edge: 80,
  };
  
  if (minVersions[name] && versionNum < minVersions[name]) {
    return false;
  }
  
  // Required features
  const requiredFeatures = [
    'es6Modules',
    'asyncAwait',
    'fetch',
    'promises',
    'localStorage',
    'cssFlexbox',
    'intersectionObserver',
  ];
  
  return requiredFeatures.every(feature => features[feature] === true);
}

/**
 * Load polyfills for missing features
 */
export async function loadPolyfills(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const features = detectFeatures();
  const polyfills: Promise<any>[] = [];
  
  // Load polyfills for missing features
  if (!features.intersectionObserver) {
    polyfills.push(import('intersection-observer'));
  }
  
  if (!features.resizeObserver) {
    polyfills.push(import('resize-observer-polyfill'));
  }
  
  if (!features.requestIdleCallback) {
    polyfills.push(import('requestidlecallback-polyfill'));
  }
  
  // Wait for all polyfills to load
  await Promise.all(polyfills);
}

/**
 * Get browser compatibility warnings
 */
export function getCompatibilityWarnings(): string[] {
  const browser = detectBrowser();
  const warnings: string[] = [];
  
  if (!browser.isSupported) {
    warnings.push(`Browser ${browser.name} ${browser.version} is not fully supported. Please update to a modern browser.`);
  }
  
  const features = browser.features;
  
  if (!features.cssGrid) {
    warnings.push('CSS Grid is not supported. Some layouts may not display correctly.');
  }
  
  if (!features.webWorkers) {
    warnings.push('Web Workers are not supported. Some features may be slower.');
  }
  
  if (!features.serviceWorkers) {
    warnings.push('Service Workers are not supported. Offline functionality may be limited.');
  }
  
  return warnings;
}
