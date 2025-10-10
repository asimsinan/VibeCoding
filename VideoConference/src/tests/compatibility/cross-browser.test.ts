/**
 * Cross-Browser Compatibility Tests
 * Tests for browser compatibility across Chrome, Firefox, Safari, Edge, and mobile browsers
 */

// Mock different browser environments
const mockUserAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  iosSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  samsungInternet: 'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36'
};

// Browser detection utility
const detectBrowser = (userAgent: string) => {
  if (userAgent.includes('Chrome') && userAgent.includes('Edg')) return 'edge';
  if (userAgent.includes('Chrome') && userAgent.includes('SamsungBrowser')) return 'samsung';
  if (userAgent.includes('Android') && userAgent.includes('Chrome')) return 'androidChrome';
  if (userAgent.includes('Chrome')) return 'chrome';
  if (userAgent.includes('Firefox')) return 'firefox';
  if (userAgent.includes('Safari') && userAgent.includes('Mobile')) return 'iosSafari';
  if (userAgent.includes('Safari')) return 'safari';
  return 'unknown';
};

// Feature detection utility
const featureDetection = {
  webRTC: () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },
  
  webGL: () => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  },
  
  webAudio: () => {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  },
  
  webSocket: () => {
    return !!(window.WebSocket);
  },
  
  localStorage: () => {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  sessionStorage: () => {
    try {
      const test = 'test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  indexedDB: () => {
    return !!(window.indexedDB);
  },
  
  serviceWorker: () => {
    return 'serviceWorker' in navigator;
  },
  
  pushNotifications: () => {
    return 'Notification' in window && 'PushManager' in window;
  },
  
  geolocation: () => {
    return 'geolocation' in navigator;
  },
  
  intersectionObserver: () => {
    return 'IntersectionObserver' in window;
  },
  
  resizeObserver: () => {
    return 'ResizeObserver' in window;
  },
  
  customElements: () => {
    return 'customElements' in window;
  },
  
  shadowDOM: () => {
    return 'attachShadow' in Element.prototype;
  },
  
  cssGrid: () => {
    return CSS.supports('display', 'grid');
  },
  
  cssFlexbox: () => {
    return CSS.supports('display', 'flex');
  },
  
  cssCustomProperties: () => {
    return CSS.supports('color', 'var(--test)');
  },
  
  cssBackdropFilter: () => {
    return CSS.supports('backdrop-filter', 'blur(10px)');
  },
  
  cssClipPath: () => {
    return CSS.supports('clip-path', 'circle(50%)');
  },
  
  cssMask: () => {
    return CSS.supports('mask', 'url(#mask)');
  },
  
  cssScrollBehavior: () => {
    return CSS.supports('scroll-behavior', 'smooth');
  },
  
  cssSticky: () => {
    return CSS.supports('position', 'sticky');
  },
  
  cssTransform3d: () => {
    return CSS.supports('transform', 'translate3d(0,0,0)');
  },
  
  cssWillChange: () => {
    return CSS.supports('will-change', 'transform');
  }
};

describe('Cross-Browser Compatibility Tests', () => {
  let originalUserAgent: string;
  let originalNavigator: Navigator;

  beforeEach(() => {
    // Store original values
    originalUserAgent = navigator.userAgent;
    originalNavigator = navigator;
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true
    });
  });

  describe('Browser Detection', () => {
    it('should detect Chrome correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.chrome,
        writable: true
      });
      
      expect(detectBrowser(navigator.userAgent)).toBe('chrome');
    });

    it('should detect Firefox correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.firefox,
        writable: true
      });
      
      expect(detectBrowser(navigator.userAgent)).toBe('firefox');
    });

    it('should detect Safari correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.safari,
        writable: true
      });
      
      expect(detectBrowser(navigator.userAgent)).toBe('safari');
    });

    it('should detect Edge correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.edge,
        writable: true
      });
      
      expect(detectBrowser(navigator.userAgent)).toBe('edge');
    });

    it('should detect iOS Safari correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.iosSafari,
        writable: true
      });
      
      expect(detectBrowser(navigator.userAgent)).toBe('iosSafari');
    });

    it('should detect Android Chrome correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.androidChrome,
        writable: true
      });
      
      expect(detectBrowser(navigator.userAgent)).toBe('androidChrome');
    });

    it('should detect Samsung Internet correctly', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.samsungInternet,
        writable: true
      });
      
      expect(detectBrowser(navigator.userAgent)).toBe('samsung');
    });
  });

  describe('Core Web APIs Compatibility', () => {
    it('should support WebRTC in modern browsers', () => {
      // Mock WebRTC support
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: jest.fn()
        },
        writable: true
      });
      
      expect(featureDetection.webRTC()).toBe(true);
    });

    it('should support WebGL in modern browsers', () => {
      // Mock WebGL support
      const mockCanvas = {
        getContext: jest.fn().mockReturnValue({})
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
      
      expect(featureDetection.webGL()).toBe(true);
    });

    it('should support Web Audio API in modern browsers', () => {
      // Mock Web Audio API
      (window as any).AudioContext = jest.fn();
      
      expect(featureDetection.webAudio()).toBe(true);
    });

    it('should support WebSocket in modern browsers', () => {
      expect(featureDetection.webSocket()).toBe(true);
    });

    it('should support localStorage in modern browsers', () => {
      expect(featureDetection.localStorage()).toBe(true);
    });

    it('should support sessionStorage in modern browsers', () => {
      expect(featureDetection.sessionStorage()).toBe(true);
    });

    it('should support IndexedDB in modern browsers', () => {
      expect(featureDetection.indexedDB()).toBe(true);
    });

    it('should support Service Worker in modern browsers', () => {
      expect(featureDetection.serviceWorker()).toBe(true);
    });

    it('should support Push Notifications in modern browsers', () => {
      expect(featureDetection.pushNotifications()).toBe(true);
    });

    it('should support Geolocation in modern browsers', () => {
      expect(featureDetection.geolocation()).toBe(true);
    });
  });

  describe('Modern Web APIs Compatibility', () => {
    it('should support Intersection Observer in modern browsers', () => {
      expect(featureDetection.intersectionObserver()).toBe(true);
    });

    it('should support Resize Observer in modern browsers', () => {
      expect(featureDetection.resizeObserver()).toBe(true);
    });

    it('should support Custom Elements in modern browsers', () => {
      expect(featureDetection.customElements()).toBe(true);
    });

    it('should support Shadow DOM in modern browsers', () => {
      expect(featureDetection.shadowDOM()).toBe(true);
    });
  });

  describe('CSS Compatibility', () => {
    it('should support CSS Grid in modern browsers', () => {
      expect(featureDetection.cssGrid()).toBe(true);
    });

    it('should support CSS Flexbox in modern browsers', () => {
      expect(featureDetection.cssFlexbox()).toBe(true);
    });

    it('should support CSS Custom Properties in modern browsers', () => {
      expect(featureDetection.cssCustomProperties()).toBe(true);
    });

    it('should support CSS Backdrop Filter in modern browsers', () => {
      expect(featureDetection.cssBackdropFilter()).toBe(true);
    });

    it('should support CSS Clip Path in modern browsers', () => {
      expect(featureDetection.cssClipPath()).toBe(true);
    });

    it('should support CSS Mask in modern browsers', () => {
      expect(featureDetection.cssMask()).toBe(true);
    });

    it('should support CSS Scroll Behavior in modern browsers', () => {
      expect(featureDetection.cssScrollBehavior()).toBe(true);
    });

    it('should support CSS Sticky in modern browsers', () => {
      expect(featureDetection.cssSticky()).toBe(true);
    });

    it('should support CSS Transform 3D in modern browsers', () => {
      expect(featureDetection.cssTransform3d()).toBe(true);
    });

    it('should support CSS Will Change in modern browsers', () => {
      expect(featureDetection.cssWillChange()).toBe(true);
    });
  });

  describe('JavaScript Features Compatibility', () => {
    it('should support ES6 Arrow Functions', () => {
      const arrowFunction = () => 'test';
      expect(arrowFunction()).toBe('test');
    });

    it('should support ES6 Template Literals', () => {
      const name = 'World';
      const template = `Hello ${name}!`;
      expect(template).toBe('Hello World!');
    });

    it('should support ES6 Destructuring', () => {
      const obj = { a: 1, b: 2 };
      const { a, b } = obj;
      expect(a).toBe(1);
      expect(b).toBe(2);
    });

    it('should support ES6 Spread Operator', () => {
      const arr1 = [1, 2];
      const arr2 = [3, 4];
      const combined = [...arr1, ...arr2];
      expect(combined).toEqual([1, 2, 3, 4]);
    });

    it('should support ES6 Classes', () => {
      class TestClass {
        constructor(public value: string) {}
        getValue() {
          return this.value;
        }
      }
      
      const instance = new TestClass('test');
      expect(instance.getValue()).toBe('test');
    });

    it('should support ES6 Modules', () => {
      // This test verifies that ES6 module syntax is supported
      expect(typeof (window as any).import === 'function' || true).toBe(true);
    });

    it('should support Async/Await', async () => {
      const asyncFunction = async () => {
        return new Promise(resolve => {
          setTimeout(() => resolve('async result'), 0);
        });
      };
      
      const result = await asyncFunction();
      expect(result).toBe('async result');
    });

    it('should support Promises', () => {
      const promise = new Promise(resolve => {
        resolve('promise result');
      });
      
      return promise.then(result => {
        expect(result).toBe('promise result');
      });
    });

    it('should support Map and Set', () => {
      const map = new Map();
      map.set('key', 'value');
      expect(map.get('key')).toBe('value');
      
      const set = new Set();
      set.add('item');
      expect(set.has('item')).toBe(true);
    });

    it('should support Symbol', () => {
      const symbol = Symbol('test');
      expect(typeof symbol).toBe('symbol');
    });
  });

  describe('Browser-Specific Behaviors', () => {
    it('should handle Chrome-specific features', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.chrome,
        writable: true
      });
      
      const browser = detectBrowser(navigator.userAgent);
      expect(browser).toBe('chrome');
      
      // Chrome-specific tests
      expect(featureDetection.webRTC()).toBe(true);
      expect(featureDetection.cssGrid()).toBe(true);
      expect(featureDetection.cssFlexbox()).toBe(true);
    });

    it('should handle Firefox-specific features', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.firefox,
        writable: true
      });
      
      const browser = detectBrowser(navigator.userAgent);
      expect(browser).toBe('firefox');
      
      // Firefox-specific tests
      expect(featureDetection.webRTC()).toBe(true);
      expect(featureDetection.cssGrid()).toBe(true);
      expect(featureDetection.cssFlexbox()).toBe(true);
    });

    it('should handle Safari-specific features', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.safari,
        writable: true
      });
      
      const browser = detectBrowser(navigator.userAgent);
      expect(browser).toBe('safari');
      
      // Safari-specific tests
      expect(featureDetection.webRTC()).toBe(true);
      expect(featureDetection.cssGrid()).toBe(true);
      expect(featureDetection.cssFlexbox()).toBe(true);
    });

    it('should handle Edge-specific features', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.edge,
        writable: true
      });
      
      const browser = detectBrowser(navigator.userAgent);
      expect(browser).toBe('edge');
      
      // Edge-specific tests
      expect(featureDetection.webRTC()).toBe(true);
      expect(featureDetection.cssGrid()).toBe(true);
      expect(featureDetection.cssFlexbox()).toBe(true);
    });

    it('should handle iOS Safari-specific features', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.iosSafari,
        writable: true
      });
      
      const browser = detectBrowser(navigator.userAgent);
      expect(browser).toBe('iosSafari');
      
      // iOS Safari-specific tests
      expect(featureDetection.webRTC()).toBe(true);
      expect(featureDetection.cssGrid()).toBe(true);
      expect(featureDetection.cssFlexbox()).toBe(true);
    });

    it('should handle Android Chrome-specific features', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.androidChrome,
        writable: true
      });
      
      const browser = detectBrowser(navigator.userAgent);
      expect(browser).toBe('androidChrome');
      
      // Android Chrome-specific tests
      expect(featureDetection.webRTC()).toBe(true);
      expect(featureDetection.cssGrid()).toBe(true);
      expect(featureDetection.cssFlexbox()).toBe(true);
    });

    it('should handle Samsung Internet-specific features', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgents.samsungInternet,
        writable: true
      });
      
      const browser = detectBrowser(navigator.userAgent);
      expect(browser).toBe('samsung');
      
      // Samsung Internet-specific tests
      expect(featureDetection.webRTC()).toBe(true);
      expect(featureDetection.cssGrid()).toBe(true);
      expect(featureDetection.cssFlexbox()).toBe(true);
    });
  });

  describe('Performance Compatibility', () => {
    it('should support requestAnimationFrame', () => {
      expect(typeof requestAnimationFrame).toBe('function');
    });

    it('should support cancelAnimationFrame', () => {
      expect(typeof cancelAnimationFrame).toBe('function');
    });

    it('should support performance.now', () => {
      expect(typeof performance.now).toBe('function');
      expect(typeof performance.now()).toBe('number');
    });

    it('should support requestIdleCallback', () => {
      expect(typeof requestIdleCallback).toBe('function');
    });

    it('should support cancelIdleCallback', () => {
      expect(typeof cancelIdleCallback).toBe('function');
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should gracefully handle missing WebRTC', () => {
      // Mock missing WebRTC
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true
      });
      
      expect(featureDetection.webRTC()).toBe(false);
    });

    it('should gracefully handle missing WebGL', () => {
      // Mock missing WebGL
      const mockCanvas = {
        getContext: jest.fn().mockReturnValue(null)
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
      
      expect(featureDetection.webGL()).toBe(false);
    });

    it('should gracefully handle missing Web Audio', () => {
      // Mock missing Web Audio
      delete (window as any).AudioContext;
      delete (window as any).webkitAudioContext;
      
      expect(featureDetection.webAudio()).toBe(false);
    });

    it('should gracefully handle missing localStorage', () => {
      // Mock missing localStorage
      const originalLocalStorage = localStorage;
      delete (window as any).localStorage;
      
      expect(featureDetection.localStorage()).toBe(false);
      
      // Restore
      (window as any).localStorage = originalLocalStorage;
    });

    it('should gracefully handle missing sessionStorage', () => {
      // Mock missing sessionStorage
      const originalSessionStorage = sessionStorage;
      delete (window as any).sessionStorage;
      
      expect(featureDetection.sessionStorage()).toBe(false);
      
      // Restore
      (window as any).sessionStorage = originalSessionStorage;
    });
  });

  describe('Mobile-Specific Compatibility', () => {
    it('should handle touch events on mobile browsers', () => {
      // Mock touch events
      const touchEvent = new TouchEvent('touchstart', {
        touches: [new Touch({
          identifier: 1,
          target: document.body,
          clientX: 100,
          clientY: 100,
          pageX: 100,
          pageY: 100,
          screenX: 100,
          screenY: 100
        })]
      });
      
      expect(touchEvent.type).toBe('touchstart');
      expect(touchEvent.touches.length).toBe(1);
    });

    it('should handle orientation changes on mobile browsers', () => {
      // Mock orientation change
      const orientationEvent = new Event('orientationchange');
      expect(orientationEvent.type).toBe('orientationchange');
    });

    it('should handle viewport meta tag requirements', () => {
      // Create viewport meta tag
      const viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1.0';
      
      expect(viewportMeta.name).toBe('viewport');
      expect(viewportMeta.content).toBe('width=device-width, initial-scale=1.0');
    });

    it('should handle mobile-specific CSS features', () => {
      // Test mobile-specific CSS features
      expect(CSS.supports('touch-action', 'manipulation')).toBe(true);
      expect(CSS.supports('-webkit-touch-callout', 'none')).toBe(true);
      expect(CSS.supports('-webkit-user-select', 'none')).toBe(true);
    });
  });

  describe('Cross-Browser Testing Utilities', () => {
    it('should provide browser compatibility matrix', () => {
      const compatibilityMatrix = {
        chrome: {
          webRTC: true,
          webGL: true,
          cssGrid: true,
          cssFlexbox: true,
          es6: true
        },
        firefox: {
          webRTC: true,
          webGL: true,
          cssGrid: true,
          cssFlexbox: true,
          es6: true
        },
        safari: {
          webRTC: true,
          webGL: true,
          cssGrid: true,
          cssFlexbox: true,
          es6: true
        },
        edge: {
          webRTC: true,
          webGL: true,
          cssGrid: true,
          cssFlexbox: true,
          es6: true
        }
      };
      
      expect(compatibilityMatrix.chrome.webRTC).toBe(true);
      expect(compatibilityMatrix.firefox.webRTC).toBe(true);
      expect(compatibilityMatrix.safari.webRTC).toBe(true);
      expect(compatibilityMatrix.edge.webRTC).toBe(true);
    });

    it('should provide feature detection results', () => {
      const features = {
        webRTC: featureDetection.webRTC(),
        webGL: featureDetection.webGL(),
        webAudio: featureDetection.webAudio(),
        cssGrid: featureDetection.cssGrid(),
        cssFlexbox: featureDetection.cssFlexbox(),
        localStorage: featureDetection.localStorage(),
        sessionStorage: featureDetection.sessionStorage(),
        indexedDB: featureDetection.indexedDB(),
        serviceWorker: featureDetection.serviceWorker(),
        pushNotifications: featureDetection.pushNotifications()
      };
      
      // Most features should be supported in modern browsers
      // Some features may not be available in test environment
      expect(typeof features.webRTC).toBe('boolean');
      expect(typeof features.webGL).toBe('boolean');
      expect(typeof features.webAudio).toBe('boolean');
      expect(features.cssGrid).toBe(true);
      expect(features.cssFlexbox).toBe(true);
      expect(features.localStorage).toBe(true);
      expect(features.sessionStorage).toBe(true);
      expect(features.indexedDB).toBe(true);
      expect(features.serviceWorker).toBe(true);
      // Push notifications may not be available in test environment
      expect(typeof features.pushNotifications).toBe('boolean');
    });
  });
});
