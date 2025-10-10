/**
 * Compatibility Test Setup
 * Global setup for cross-browser compatibility testing
 */

import '@testing-library/jest-dom';

// Mock browser APIs for compatibility testing
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

global.MutationObserver = class MutationObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
};

// Mock WebRTC APIs
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(),
    getDisplayMedia: jest.fn(),
    enumerateDevices: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  },
  writable: true
});

// Mock WebRTC classes
global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
  createOffer: jest.fn(),
  createAnswer: jest.fn(),
  setLocalDescription: jest.fn(),
  setRemoteDescription: jest.fn(),
  addIceCandidate: jest.fn(),
  addTrack: jest.fn(),
  removeTrack: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  createDataChannel: jest.fn(),
  getStats: jest.fn(),
  connectionState: 'new',
  iceConnectionState: 'new',
  iceGatheringState: 'new',
  signalingState: 'stable'
}));

global.MediaStream = jest.fn().mockImplementation(() => ({
  getTracks: jest.fn().mockReturnValue([]),
  getAudioTracks: jest.fn().mockReturnValue([]),
  getVideoTracks: jest.fn().mockReturnValue([]),
  addTrack: jest.fn(),
  removeTrack: jest.fn(),
  clone: jest.fn(),
  getTrackById: jest.fn(),
  active: true,
  id: 'mock-stream-id'
}));

global.MediaStreamTrack = jest.fn().mockImplementation(() => ({
  kind: 'video',
  id: 'mock-track-id',
  label: 'Mock Track',
  enabled: true,
  muted: false,
  readyState: 'live',
  stop: jest.fn(),
  clone: jest.fn(),
  applyConstraints: jest.fn(),
  getConstraints: jest.fn().mockReturnValue({}),
  getCapabilities: jest.fn().mockReturnValue({}),
  getSettings: jest.fn().mockReturnValue({})
}));

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createGain: jest.fn(),
  createOscillator: jest.fn(),
  createAnalyser: jest.fn(),
  createMediaStreamSource: jest.fn(),
  createMediaStreamDestination: jest.fn(),
  close: jest.fn(),
  state: 'running',
  sampleRate: 44100
}));

// Mock WebGL
const mockWebGLContext = {
  getParameter: jest.fn(),
  getExtension: jest.fn(),
  createShader: jest.fn(),
  createProgram: jest.fn(),
  createBuffer: jest.fn(),
  createTexture: jest.fn(),
  createFramebuffer: jest.fn(),
  createRenderbuffer: jest.fn(),
  drawArrays: jest.fn(),
  drawElements: jest.fn(),
  clear: jest.fn(),
  viewport: jest.fn()
};

// Mock Canvas
const mockCanvas = {
  getContext: jest.fn().mockImplementation((contextType) => {
    if (contextType === '2d') {
      return {
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        clearRect: jest.fn(),
        fillText: jest.fn(),
        strokeText: jest.fn(),
        measureText: jest.fn().mockReturnValue({ width: 100 }),
        drawImage: jest.fn(),
        createImageData: jest.fn(),
        getImageData: jest.fn(),
        putImageData: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        transform: jest.fn(),
        setTransform: jest.fn(),
        beginPath: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        quadraticCurveTo: jest.fn(),
        bezierCurveTo: jest.fn(),
        arc: jest.fn(),
        arcTo: jest.fn(),
        rect: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        clip: jest.fn(),
        isPointInPath: jest.fn(),
        isPointInStroke: jest.fn()
      };
    } else if (contextType === 'webgl' || contextType === 'experimental-webgl') {
      return mockWebGLContext;
    } else if (contextType === 'webgl2') {
      return mockWebGLContext;
    }
    return null;
  }),
  toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mock'),
  toBlob: jest.fn().mockResolvedValue(new Blob(['mock'], { type: 'image/png' }))
};

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
document.createElement = jest.fn().mockImplementation((tagName) => {
  if (tagName === 'canvas') {
    return mockCanvas;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock CSS.supports
Object.defineProperty(window, 'CSS', {
  value: {
    supports: jest.fn().mockImplementation((property, value) => {
      // Mock CSS feature support
      const supportedFeatures = [
        'display:flex', 'display:grid', 'display:subgrid',
        'position:sticky', 'position:fixed',
        'color:var(--test)', 'backdrop-filter:blur(10px)',
        'clip-path:circle(50%)', 'mask:url(#mask)',
        'filter:blur(10px)', 'transform:translateX(10px)',
        'transform:translate3d(0,0,0)', 'animation:test 1s ease',
        'transition:all 1s ease', 'font-display:swap',
        'font-feature-settings:"liga" 1', 'text-overflow:ellipsis',
        'scroll-behavior:smooth', 'scroll-snap-type:x mandatory',
        'container-type:inline-size', 'color:color(display-p3 1 0 0)',
        'color:color-mix(in srgb, red, blue)', 'will-change:transform',
        'contain:layout', 'isolation:isolate', 'mix-blend-mode:multiply',
        'object-fit:cover', 'object-position:center',
        'touch-action:manipulation', '-webkit-touch-callout:none',
        '-webkit-user-select:none', '-webkit-appearance:none',
        '-webkit-transform:translateX(10px)', '-moz-transform:translateX(10px)',
        '-ms-transform:translateX(10px)'
      ];
      
      const testValue = `${property}:${value}`;
      return supportedFeatures.some(feature => testValue.includes(feature.split(':')[0]));
    })
  },
  writable: true
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn().mockReturnValue(Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn().mockReturnValue([]),
    getEntriesByName: jest.fn().mockReturnValue([]),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn()
  },
  writable: true
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn().mockImplementation(callback => {
  return setTimeout(callback, 16);
});

global.cancelAnimationFrame = jest.fn().mockImplementation(id => {
  clearTimeout(id);
});

// Mock requestIdleCallback and cancelIdleCallback
global.requestIdleCallback = jest.fn().mockImplementation(callback => {
  return setTimeout(callback, 0);
});

global.cancelIdleCallback = jest.fn().mockImplementation(id => {
  clearTimeout(id);
});

// Mock TouchEvent
global.TouchEvent = jest.fn().mockImplementation((type, eventInit) => ({
  type,
  touches: eventInit?.touches || [],
  targetTouches: eventInit?.targetTouches || [],
  changedTouches: eventInit?.changedTouches || [],
  preventDefault: jest.fn(),
  stopPropagation: jest.fn()
}));

// Mock Touch
global.Touch = jest.fn().mockImplementation((touchInit) => ({
  identifier: touchInit?.identifier || 1,
  target: touchInit?.target || document.body,
  clientX: touchInit?.clientX || 0,
  clientY: touchInit?.clientY || 0,
  pageX: touchInit?.pageX || 0,
  pageY: touchInit?.pageY || 0,
  screenX: touchInit?.screenX || 0,
  screenY: touchInit?.screenY || 0
}));

// Mock DeviceOrientationEvent
global.DeviceOrientationEvent = jest.fn().mockImplementation((type, eventInit) => ({
  type,
  alpha: eventInit?.alpha || 0,
  beta: eventInit?.beta || 0,
  gamma: eventInit?.gamma || 0,
  absolute: eventInit?.absolute || false,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn()
}));

// Mock DeviceMotionEvent
global.DeviceMotionEvent = jest.fn().mockImplementation((type, eventInit) => ({
  type,
  acceleration: eventInit?.acceleration || null,
  accelerationIncludingGravity: eventInit?.accelerationIncludingGravity || null,
  rotationRate: eventInit?.rotationRate || null,
  interval: eventInit?.interval || 0,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn()
}));

// Mock PointerEvent
global.PointerEvent = jest.fn().mockImplementation((type, eventInit) => ({
  type,
  pointerId: eventInit?.pointerId || 1,
  width: eventInit?.width || 1,
  height: eventInit?.height || 1,
  pressure: eventInit?.pressure || 0,
  tangentialPressure: eventInit?.tangentialPressure || 0,
  tiltX: eventInit?.tiltX || 0,
  tiltY: eventInit?.tiltY || 0,
  twist: eventInit?.twist || 0,
  pointerType: eventInit?.pointerType || 'mouse',
  isPrimary: eventInit?.isPrimary || false,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn()
}));

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  readyState: 1,
  url: 'ws://localhost',
  protocol: '',
  extensions: '',
  bufferedAmount: 0,
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Mock EventSource
global.EventSource = jest.fn().mockImplementation(() => ({
  readyState: 1,
  url: 'http://localhost/events',
  withCredentials: false,
  onopen: null,
  onmessage: null,
  onerror: null,
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Mock Worker
global.Worker = jest.fn().mockImplementation(() => ({
  postMessage: jest.fn(),
  terminate: jest.fn(),
  onmessage: null,
  onerror: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Mock SharedWorker
global.SharedWorker = jest.fn().mockImplementation(() => ({
  port: {
    postMessage: jest.fn(),
    close: jest.fn(),
    onmessage: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  },
  onerror: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Mock BroadcastChannel
global.BroadcastChannel = jest.fn().mockImplementation(() => ({
  name: 'test-channel',
  postMessage: jest.fn(),
  close: jest.fn(),
  onmessage: null,
  onmessageerror: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Mock MessageChannel
global.MessageChannel = jest.fn().mockImplementation(() => ({
  port1: {
    postMessage: jest.fn(),
    close: jest.fn(),
    onmessage: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  },
  port2: {
    postMessage: jest.fn(),
    close: jest.fn(),
    onmessage: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }
}));

// Mock File API
global.File = jest.fn().mockImplementation((fileBits, fileName, options) => ({
  name: fileName,
  size: fileBits.reduce((acc, bit) => acc + bit.length, 0),
  type: options?.type || '',
  lastModified: Date.now(),
  webkitRelativePath: '',
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  slice: jest.fn().mockReturnValue(new Blob()),
  stream: jest.fn().mockReturnValue(new ReadableStream()),
  text: jest.fn().mockResolvedValue('')
}));

global.FileReader = jest.fn().mockImplementation(() => ({
  readyState: 0,
  result: null,
  error: null,
  onload: null,
  onloadstart: null,
  onloadend: null,
  onprogress: null,
  onerror: null,
  onabort: null,
  readAsArrayBuffer: jest.fn(),
  readAsBinaryString: jest.fn(),
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

// Mock IndexedDB
global.indexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
  cmp: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
};

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(),
    getRegistration: jest.fn(),
    getRegistrations: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  },
  writable: true
});

// Mock Push Manager
global.PushManager = jest.fn().mockImplementation(() => ({
  subscribe: jest.fn(),
  getSubscription: jest.fn(),
  permissionState: jest.fn(),
  supportedContentEncodings: []
}));

// Mock Notification
global.Notification = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
}));

Object.defineProperty(global.Notification, 'permission', {
  value: 'default',
  writable: true
});

Object.defineProperty(global.Notification, 'requestPermission', {
  value: jest.fn().mockResolvedValue('granted'),
  writable: true
});

// Mock Geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn()
  },
  writable: true
});

// Mock Custom Elements
global.customElements = {
  define: jest.fn(),
  get: jest.fn(),
  whenDefined: jest.fn(),
  upgrade: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
};

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: new Headers(),
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  blob: jest.fn().mockResolvedValue(new Blob()),
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  formData: jest.fn().mockResolvedValue(new FormData()),
  clone: jest.fn(),
  body: null,
  bodyUsed: false,
  url: 'http://localhost',
  type: 'basic',
  redirected: false
});

// Setup compatibility testing utilities
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Reset focus
  document.activeElement?.blur();
});

// Global compatibility testing utilities
export const compatibilityTestUtils = {
  // Browser detection
  detectBrowser: (userAgent: string) => {
    if (userAgent.includes('Chrome') && userAgent.includes('Edg')) return 'edge';
    if (userAgent.includes('Chrome') && userAgent.includes('SamsungBrowser')) return 'samsung';
    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari') && userAgent.includes('Mobile')) return 'iosSafari';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Android') && userAgent.includes('Chrome')) return 'androidChrome';
    return 'unknown';
  },
  
  // Feature detection
  detectFeatures: () => ({
    webRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch (e) {
        return false;
      }
    })(),
    webAudio: !!(window.AudioContext || (window as any).webkitAudioContext),
    webSocket: !!(window.WebSocket),
    localStorage: (() => {
      try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    })(),
    sessionStorage: (() => {
      try {
        const test = 'test';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    })(),
    indexedDB: !!(window.indexedDB),
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'Notification' in window && 'PushManager' in window,
    geolocation: 'geolocation' in navigator,
    intersectionObserver: 'IntersectionObserver' in window,
    resizeObserver: 'ResizeObserver' in window,
    customElements: 'customElements' in window,
    shadowDOM: 'attachShadow' in Element.prototype,
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexbox: CSS.supports('display', 'flex'),
    cssCustomProperties: CSS.supports('color', 'var(--test)'),
    cssBackdropFilter: CSS.supports('backdrop-filter', 'blur(10px)'),
    cssClipPath: CSS.supports('clip-path', 'circle(50%)'),
    cssMask: CSS.supports('mask', 'url(#mask)'),
    cssScrollBehavior: CSS.supports('scroll-behavior', 'smooth'),
    cssSticky: CSS.supports('position', 'sticky'),
    cssTransform3d: CSS.supports('transform', 'translate3d(0,0,0)'),
    cssWillChange: CSS.supports('will-change', 'transform')
  }),
  
  // Compatibility matrix
  getCompatibilityMatrix: () => ({
    chrome: {
      webRTC: true,
      webGL: true,
      cssGrid: true,
      cssFlexbox: true,
      es6: true,
      es2017: true,
      webAPIs: true,
      modern: true
    },
    firefox: {
      webRTC: true,
      webGL: true,
      cssGrid: true,
      cssFlexbox: true,
      es6: true,
      es2017: true,
      webAPIs: true,
      modern: true
    },
    safari: {
      webRTC: true,
      webGL: true,
      cssGrid: true,
      cssFlexbox: true,
      es6: true,
      es2017: true,
      webAPIs: true,
      modern: true
    },
    edge: {
      webRTC: true,
      webGL: true,
      cssGrid: true,
      cssFlexbox: true,
      es6: true,
      es2017: true,
      webAPIs: true,
      modern: true
    }
  })
};
