import { useEffect, useState } from 'react'

// Browser compatibility configuration
export interface BrowserCompatibilityConfig {
  supportedBrowsers: {
    chrome: string
    firefox: string
    safari: string
    edge: string
  }
  requiredFeatures: string[]
  polyfills: {
    [key: string]: string
  }
  fallbacks: {
    [key: string]: any
  }
}

// Default browser compatibility configuration
export const defaultBrowserConfig: BrowserCompatibilityConfig = {
  supportedBrowsers: {
    chrome: '90',
    firefox: '88',
    safari: '14',
    edge: '90'
  },
  requiredFeatures: [
    'fetch',
    'Promise',
    'Map',
    'Set',
    'Symbol',
    'Array.from',
    'Object.assign',
    'String.includes',
    'String.startsWith',
    'String.endsWith'
  ],
  polyfills: {
    'fetch': 'https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.2/dist/fetch.umd.js',
    'Promise': 'https://cdn.jsdelivr.net/npm/es6-promise@4.2.8/dist/es6-promise.auto.min.js',
    'Map': 'https://cdn.jsdelivr.net/npm/core-js@3.26.1/client/shim.min.js',
    'Set': 'https://cdn.jsdelivr.net/npm/core-js@3.26.1/client/shim.min.js',
    'Symbol': 'https://cdn.jsdelivr.net/npm/core-js@3.26.1/client/shim.min.js'
  },
  fallbacks: {
    'fetch': 'XMLHttpRequest',
    'Promise': 'callback',
    'Map': 'Object',
    'Set': 'Array',
    'Symbol': 'string'
  }
}

// Browser information interface
export interface BrowserInfo {
  name: string
  version: string
  isSupported: boolean
  isModern: boolean
  userAgent: string
  features: {
    [key: string]: boolean
  }
}

// Browser compatibility service
export class BrowserCompatibilityService {
  private config: BrowserCompatibilityConfig
  private browserInfo: BrowserInfo | null = null

  constructor(config: BrowserCompatibilityConfig = defaultBrowserConfig) {
    this.config = config
  }

  // Detect browser information
  detectBrowser(): BrowserInfo {
    if (typeof window === 'undefined') {
      return {
        name: 'unknown',
        version: '0',
        isSupported: true,
        isModern: true,
        userAgent: '',
        features: {}
      }
    }

    const userAgent = window.navigator.userAgent
    const browserInfo = this.parseUserAgent(userAgent)
    const features = this.detectFeatures()
    const isSupported = this.checkBrowserSupport(browserInfo)
    const isModern = this.checkModernFeatures(features)

    this.browserInfo = {
      ...browserInfo,
      isSupported,
      isModern,
      userAgent,
      features
    }

    return this.browserInfo
  }

  // Parse user agent string
  private parseUserAgent(userAgent: string): { name: string; version: string } {
    const browsers = [
      { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
      { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
      { name: 'Safari', pattern: /Version\/(\d+).*Safari/ },
      { name: 'Edge', pattern: /Edg\/(\d+)/ },
      { name: 'Edge Legacy', pattern: /Edge\/(\d+)/ }
    ]

    for (const browser of browsers) {
      const match = userAgent.match(browser.pattern)
      if (match) {
        return {
          name: browser.name,
          version: match[1]
        }
      }
    }

    return { name: 'Unknown', version: '0' }
  }

  // Detect browser features
  private detectFeatures(): { [key: string]: boolean } {
    const features: { [key: string]: boolean } = {}

    // Check for required features
    for (const feature of this.config.requiredFeatures) {
      features[feature] = this.checkFeature(feature)
    }

    // Check for additional features
    features['WebSocket'] = typeof WebSocket !== 'undefined'
    features['localStorage'] = typeof localStorage !== 'undefined'
    features['sessionStorage'] = typeof sessionStorage !== 'undefined'
    features['indexedDB'] = typeof indexedDB !== 'undefined'
    features['serviceWorker'] = 'serviceWorker' in navigator
    features['pushManager'] = 'PushManager' in window
    features['geolocation'] = 'geolocation' in navigator
    features['webGL'] = this.checkWebGL()
    features['webRTC'] = this.checkWebRTC()
    features['webAssembly'] = typeof WebAssembly !== 'undefined'

    return features
  }

  // Check individual feature
  private checkFeature(feature: string): boolean {
    switch (feature) {
      case 'fetch':
        return typeof fetch !== 'undefined'
      case 'Promise':
        return typeof Promise !== 'undefined'
      case 'Map':
        return typeof Map !== 'undefined'
      case 'Set':
        return typeof Set !== 'undefined'
      case 'Symbol':
        return typeof Symbol !== 'undefined'
      case 'Array.from':
        return typeof Array.from !== 'undefined'
      case 'Object.assign':
        return typeof Object.assign !== 'undefined'
      case 'String.includes':
        return String.prototype.includes !== undefined
      case 'String.startsWith':
        return String.prototype.startsWith !== undefined
      case 'String.endsWith':
        return String.prototype.endsWith !== undefined
      default:
        return false
    }
  }

  // Check WebGL support
  private checkWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    } catch (e) {
      return false
    }
  }

  // Check WebRTC support
  private checkWebRTC(): boolean {
    return !!(
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection
    )
  }

  // Check browser support
  private checkBrowserSupport(browserInfo: { name: string; version: string }): boolean {
    const { name, version } = browserInfo
    const versionNumber = parseInt(version, 10)

    switch (name) {
      case 'Chrome':
        return versionNumber >= parseInt(this.config.supportedBrowsers.chrome, 10)
      case 'Firefox':
        return versionNumber >= parseInt(this.config.supportedBrowsers.firefox, 10)
      case 'Safari':
        return versionNumber >= parseInt(this.config.supportedBrowsers.safari, 10)
      case 'Edge':
      case 'Edge Legacy':
        return versionNumber >= parseInt(this.config.supportedBrowsers.edge, 10)
      default:
        return false
    }
  }

  // Check modern features
  private checkModernFeatures(features: { [key: string]: boolean }): boolean {
    const modernFeatures = ['fetch', 'Promise', 'Map', 'Set', 'Symbol']
    return modernFeatures.every(feature => features[feature])
  }

  // Load polyfills for missing features
  async loadPolyfills(): Promise<void> {
    if (typeof window === 'undefined') return

    const features = this.detectFeatures()
    const promises: Promise<void>[] = []

    for (const [feature, isSupported] of Object.entries(features)) {
      if (!isSupported && this.config.polyfills[feature]) {
        promises.push(this.loadPolyfill(feature, this.config.polyfills[feature]))
      }
    }

    await Promise.all(promises)
  }

  // Load individual polyfill
  private loadPolyfill(feature: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = url
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load polyfill for ${feature}`))
      document.head.appendChild(script)
    })
  }

  // Generate browser compatibility CSS
  generateCompatibilityCSS(): string {
    return `
      /* Browser Compatibility CSS */
      
      /* CSS Grid fallback */
      .grid {
        display: flex;
        flex-wrap: wrap;
      }
      
      @supports (display: grid) {
        .grid {
          display: grid;
        }
      }
      
      /* CSS Custom Properties fallback */
      :root {
        --primary-color: #3b82f6;
        --secondary-color: #6b7280;
        --success-color: #10b981;
        --error-color: #ef4444;
        --warning-color: #f59e0b;
      }
      
      .btn-primary {
        background-color: #3b82f6;
        color: white;
      }
      
      /* CSS Flexbox fallback */
      .flex {
        display: -webkit-box;
        display: -moz-box;
        display: -ms-flexbox;
        display: -webkit-flex;
        display: flex;
      }
      
      .flex-center {
        -webkit-box-align: center;
        -moz-box-align: center;
        -ms-flex-align: center;
        -webkit-align-items: center;
        align-items: center;
        -webkit-box-pack: center;
        -moz-box-pack: center;
        -ms-flex-pack: center;
        -webkit-justify-content: center;
        justify-content: center;
      }
      
      /* CSS Transform fallback */
      .transform-center {
        position: absolute;
        top: 50%;
        left: 50%;
        -webkit-transform: translate(-50%, -50%);
        -moz-transform: translate(-50%, -50%);
        -ms-transform: translate(-50%, -50%);
        transform: translate(-50%, -50%);
      }
      
      /* CSS Animation fallback */
      .fade-in {
        opacity: 0;
        -webkit-animation: fadeIn 0.3s ease-in-out forwards;
        -moz-animation: fadeIn 0.3s ease-in-out forwards;
        -ms-animation: fadeIn 0.3s ease-in-out forwards;
        animation: fadeIn 0.3s ease-in-out forwards;
      }
      
      @-webkit-keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @-moz-keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @-ms-keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      /* CSS Filter fallback */
      .blur {
        filter: blur(4px);
        -webkit-filter: blur(4px);
      }
      
      /* CSS Backdrop Filter fallback */
      .backdrop-blur {
        background-color: rgba(255, 255, 255, 0.8);
      }
      
      @supports (backdrop-filter: blur(4px)) {
        .backdrop-blur {
          background-color: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
      }
      
      /* CSS Clip Path fallback */
      .clip-circle {
        border-radius: 50%;
      }
      
      @supports (clip-path: circle(50%)) {
        .clip-circle {
          border-radius: 0;
          clip-path: circle(50%);
        }
      }
      
      /* CSS Scroll Behavior fallback */
      .smooth-scroll {
        scroll-behavior: smooth;
      }
      
      /* CSS Object Fit fallback */
      .object-cover {
        object-fit: cover;
        width: 100%;
        height: 100%;
      }
      
      /* CSS Sticky fallback */
      .sticky {
        position: -webkit-sticky;
        position: sticky;
        top: 0;
      }
      
      /* CSS Focus Visible fallback */
      .focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* CSS Logical Properties fallback */
      .margin-inline-start {
        margin-left: 1rem;
      }
      
      @supports (margin-inline-start: 1rem) {
        .margin-inline-start {
          margin-left: 0;
          margin-inline-start: 1rem;
        }
      }
      
      /* CSS Container Queries fallback */
      .container-query {
        width: 100%;
      }
      
      @supports (container-type: inline-size) {
        .container-query {
          container-type: inline-size;
        }
      }
      
      /* CSS Subgrid fallback */
      .subgrid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
      }
      
      @supports (grid-template-columns: subgrid) {
        .subgrid {
          grid-template-columns: subgrid;
        }
      }
      
      /* CSS Cascade Layers fallback */
      .layer-base {
        /* Base layer styles */
      }
      
      @supports (@layer) {
        @layer base {
          .layer-base {
            /* Base layer styles */
          }
        }
      }
      
      /* CSS Color Functions fallback */
      .color-mix {
        background-color: #3b82f6;
      }
      
      @supports (background-color: color-mix(in srgb, #3b82f6 50%, white)) {
        .color-mix {
          background-color: color-mix(in srgb, #3b82f6 50%, white);
        }
      }
      
      /* CSS Anchor Positioning fallback */
      .anchor-position {
        position: absolute;
        top: 100%;
        left: 0;
      }
      
      @supports (anchor-name: --anchor) {
        .anchor-position {
          position: anchor;
          anchor-name: --anchor;
        }
      }
      
      /* CSS View Transitions fallback */
      .view-transition {
        transition: all 0.3s ease;
      }
      
      @supports (view-transition-name: main) {
        .view-transition {
          view-transition-name: main;
        }
      }
      
      /* CSS Scroll Timeline fallback */
      .scroll-timeline {
        animation: scroll 1s linear;
      }
      
      @supports (animation-timeline: scroll()) {
        .scroll-timeline {
          animation-timeline: scroll();
        }
      }
      
      /* CSS Anchor Query fallback */
      .anchor-query {
        width: 100%;
      }
      
      @supports (width: anchor-size()) {
        .anchor-query {
          width: anchor-size();
        }
      }
      
      /* CSS Toggle fallback */
      .toggle {
        display: none;
      }
      
      @supports (toggle: --toggle) {
        .toggle {
          toggle: --toggle;
        }
      }
      
      /* CSS Popover fallback */
      .popover {
        position: absolute;
        z-index: 1000;
      }
      
      @supports (popover: auto) {
        .popover {
          popover: auto;
        }
      }
      
      /* CSS Anchor Positioning fallback */
      .anchor-position {
        position: absolute;
        top: 100%;
        left: 0;
      }
      
      @supports (anchor-name: --anchor) {
        .anchor-position {
          position: anchor;
          anchor-name: --anchor;
        }
      }
      
      /* CSS View Transitions fallback */
      .view-transition {
        transition: all 0.3s ease;
      }
      
      @supports (view-transition-name: main) {
        .view-transition {
          view-transition-name: main;
        }
      }
      
      /* CSS Scroll Timeline fallback */
      .scroll-timeline {
        animation: scroll 1s linear;
      }
      
      @supports (animation-timeline: scroll()) {
        .scroll-timeline {
          animation-timeline: scroll();
        }
      }
      
      /* CSS Anchor Query fallback */
      .anchor-query {
        width: 100%;
      }
      
      @supports (width: anchor-size()) {
        .anchor-query {
          width: anchor-size();
        }
      }
      
      /* CSS Toggle fallback */
      .toggle {
        display: none;
      }
      
      @supports (toggle: --toggle) {
        .toggle {
          toggle: --toggle;
        }
      }
      
      /* CSS Popover fallback */
      .popover {
        position: absolute;
        z-index: 1000;
      }
      
      @supports (popover: auto) {
        .popover {
          popover: auto;
        }
      }
    `
  }

  // Generate browser compatibility JavaScript
  generateCompatibilityJS(): string {
    return `
      /* Browser Compatibility JavaScript */
      
      // Polyfill for Array.from
      if (!Array.from) {
        Array.from = function(arrayLike) {
          return Array.prototype.slice.call(arrayLike);
        };
      }
      
      // Polyfill for Object.assign
      if (!Object.assign) {
        Object.assign = function(target) {
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
              }
            }
          }
          return target;
        };
      }
      
      // Polyfill for String.includes
      if (!String.prototype.includes) {
        String.prototype.includes = function(search, start) {
          if (typeof start !== 'number') {
            start = 0;
          }
          if (start + search.length > this.length) {
            return false;
          } else {
            return this.indexOf(search, start) !== -1;
          }
        };
      }
      
      // Polyfill for String.startsWith
      if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position) {
          position = position || 0;
          return this.substr(position, searchString.length) === searchString;
        };
      }
      
      // Polyfill for String.endsWith
      if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(searchString, length) {
          if (length === undefined || length > this.length) {
            length = this.length;
          }
          return this.substring(length - searchString.length, length) === searchString;
        };
      }
      
      // Polyfill for Array.includes
      if (!Array.prototype.includes) {
        Array.prototype.includes = function(searchElement, fromIndex) {
          if (this == null) {
            throw new TypeError('Array.prototype.includes called on null or undefined');
          }
          var O = Object(this);
          var len = parseInt(O.length) || 0;
          if (len === 0) {
            return false;
          }
          var n = parseInt(fromIndex) || 0;
          var k = n >= 0 ? n : Math.max(len + n, 0);
          while (k < len) {
            if (O[k] === searchElement) {
              return true;
            }
            k++;
          }
          return false;
        };
      }
      
      // Polyfill for Array.find
      if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {
          if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
          }
          if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
          }
          var list = Object(this);
          var length = parseInt(list.length) || 0;
          var thisArg = arguments[1];
          for (var i = 0; i < length; i++) {
            var value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
              return value;
            }
          }
          return undefined;
        };
      }
      
      // Polyfill for Array.findIndex
      if (!Array.prototype.findIndex) {
        Array.prototype.findIndex = function(predicate) {
          if (this == null) {
            throw new TypeError('Array.prototype.findIndex called on null or undefined');
          }
          if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
          }
          var list = Object(this);
          var length = parseInt(list.length) || 0;
          var thisArg = arguments[1];
          for (var i = 0; i < length; i++) {
            var value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
              return i;
            }
          }
          return -1;
        };
      }
      
      // Polyfill for Array.filter
      if (!Array.prototype.filter) {
        Array.prototype.filter = function(callback, thisArg) {
          if (this == null) {
            throw new TypeError('Array.prototype.filter called on null or undefined');
          }
          if (typeof callback !== 'function') {
            throw new TypeError('callback must be a function');
          }
          var list = Object(this);
          var length = parseInt(list.length) || 0;
          var result = [];
          for (var i = 0; i < length; i++) {
            if (i in list) {
              var value = list[i];
              if (callback.call(thisArg, value, i, list)) {
                result.push(value);
              }
            }
          }
          return result;
        };
      }
      
      // Polyfill for Array.map
      if (!Array.prototype.map) {
        Array.prototype.map = function(callback, thisArg) {
          if (this == null) {
            throw new TypeError('Array.prototype.map called on null or undefined');
          }
          if (typeof callback !== 'function') {
            throw new TypeError('callback must be a function');
          }
          var list = Object(this);
          var length = parseInt(list.length) || 0;
          var result = new Array(length);
          for (var i = 0; i < length; i++) {
            if (i in list) {
              result[i] = callback.call(thisArg, list[i], i, list);
            }
          }
          return result;
        };
      }
      
      // Polyfill for Array.reduce
      if (!Array.prototype.reduce) {
        Array.prototype.reduce = function(callback, initialValue) {
          if (this == null) {
            throw new TypeError('Array.prototype.reduce called on null or undefined');
          }
          if (typeof callback !== 'function') {
            throw new TypeError('callback must be a function');
          }
          var list = Object(this);
          var length = parseInt(list.length) || 0;
          var k = 0;
          var value;
          if (arguments.length >= 2) {
            value = arguments[1];
          } else {
            while (k < length && !(k in list)) {
              k++;
            }
            if (k >= length) {
              throw new TypeError('Reduce of empty array with no initial value');
            }
            value = list[k++];
          }
          while (k < length) {
            if (k in list) {
              value = callback(value, list[k], k, list);
            }
            k++;
          }
          return value;
        };
      }
      
      // Polyfill for Element.closest
      if (!Element.prototype.closest) {
        Element.prototype.closest = function(selector) {
          var element = this;
          while (element && element.nodeType === 1) {
            if (element.matches(selector)) {
              return element;
            }
            element = element.parentElement;
          }
          return null;
        };
      }
      
      // Polyfill for Element.matches
      if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.matchesSelector ||
          Element.prototype.mozMatchesSelector ||
          Element.prototype.msMatchesSelector ||
          Element.prototype.oMatchesSelector ||
          Element.prototype.webkitMatchesSelector ||
          function(s) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(s);
            var i = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {}
            return i > -1;
          };
      }
      
      // Polyfill for Element.remove
      if (!Element.prototype.remove) {
        Element.prototype.remove = function() {
          if (this.parentNode) {
            this.parentNode.removeChild(this);
          }
        };
      }
      
      // Polyfill for NodeList.forEach
      if (!NodeList.prototype.forEach) {
        NodeList.prototype.forEach = function(callback, thisArg) {
          for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
          }
        };
      }
      
      // Polyfill for HTMLCollection.forEach
      if (!HTMLCollection.prototype.forEach) {
        HTMLCollection.prototype.forEach = function(callback, thisArg) {
          for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
          }
        };
      }
      
      // Polyfill for CustomEvent
      if (!window.CustomEvent) {
        function CustomEvent(event, params) {
          params = params || { bubbles: false, cancelable: false, detail: undefined };
          var evt = document.createEvent('CustomEvent');
          evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
          return evt;
        }
        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent;
      }
      
      // Polyfill for requestAnimationFrame
      if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
          return setTimeout(callback, 1000 / 60);
        };
      }
      
      // Polyfill for cancelAnimationFrame
      if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
          clearTimeout(id);
        };
      }
      
      // Polyfill for URL
      if (!window.URL) {
        window.URL = function(url, base) {
          if (base) {
            return new URL(url, base);
          }
          return new URL(url);
        };
      }
      
      // Polyfill for URLSearchParams
      if (!window.URLSearchParams) {
        window.URLSearchParams = function(search) {
          this.params = {};
          if (search) {
            var pairs = search.split('&');
            for (var i = 0; i < pairs.length; i++) {
              var pair = pairs[i].split('=');
              this.params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
            }
          }
        };
        window.URLSearchParams.prototype.get = function(name) {
          return this.params[name] || null;
        };
        window.URLSearchParams.prototype.set = function(name, value) {
          this.params[name] = value;
        };
        window.URLSearchParams.prototype.toString = function() {
          var pairs = [];
          for (var key in this.params) {
            pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(this.params[key]));
          }
          return pairs.join('&');
        };
      }
    `
  }
}

// Browser compatibility hook
export function useBrowserCompatibility(config: BrowserCompatibilityConfig = defaultBrowserConfig) {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const service = new BrowserCompatibilityService(config)
    const info = service.detectBrowser()
    
    setBrowserInfo(info)
    setIsLoading(false)

    // Load polyfills if needed
    if (!info.isModern) {
    }
  }, [config])

  return { browserInfo, isLoading }
}

// Browser compatibility component
export interface BrowserCompatibilityProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  config?: BrowserCompatibilityConfig
}

export function BrowserCompatibility({ 
  children, 
  fallback,
  config = defaultBrowserConfig 
}: BrowserCompatibilityProps) {
  const { browserInfo, isLoading } = useBrowserCompatibility(config)

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!browserInfo?.isSupported) {
    return fallback || (
      <div className="browser-compatibility-warning">
        <h2>Unsupported Browser</h2>
        <p>Your browser ({browserInfo?.name} {browserInfo?.version}) is not supported.</p>
        <p>Please upgrade to a modern browser for the best experience.</p>
        <div className="supported-browsers">
          <h3>Supported Browsers:</h3>
          <ul>
            <li>Chrome {config.supportedBrowsers.chrome}+</li>
            <li>Firefox {config.supportedBrowsers.firefox}+</li>
            <li>Safari {config.supportedBrowsers.safari}+</li>
            <li>Edge {config.supportedBrowsers.edge}+</li>
          </ul>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Export utilities
export function generateCompatibilityCSS(config: BrowserCompatibilityConfig = defaultBrowserConfig): string {
  const service = new BrowserCompatibilityService(config)
  return service.generateCompatibilityCSS()
}

export function generateCompatibilityJS(config: BrowserCompatibilityConfig = defaultBrowserConfig): string {
  const service = new BrowserCompatibilityService(config)
  return service.generateCompatibilityJS()
}

export default BrowserCompatibilityService
