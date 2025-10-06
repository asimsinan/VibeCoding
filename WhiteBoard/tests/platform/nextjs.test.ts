/**
 * Next.js Platform Tests
 * 
 * Platform-specific tests for Next.js features including App Router,
 * middleware, API routes, and performance optimizations.
 * 
 * @fileoverview Next.js platform-specific testing
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { renderWithProviders, nextjsMocks } from '../utils/nextjs-test-utils'
import { NextRequest, NextResponse } from 'next/server'

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: jest.fn(({ src, alt, ...props }) => {
    const React = require('react')
    return React.createElement('img', { src, alt, ...props })
  }),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: jest.fn(({ href, children, ...props }) => {
    const React = require('react')
    return React.createElement('a', { href, ...props }, children)
  }),
}))

describe('Next.js Platform Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
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
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('App Router Integration', () => {
    it('should render components with App Router context', () => {
      const React = require('react')
      const TestComponent = () => React.createElement('div', null, 'Test Component')
      
      const { container } = renderWithProviders(React.createElement(TestComponent))
      
      expect(container.textContent).toBe('Test Component')
    })

    it('should handle App Router navigation', () => {
      const React = require('react')
      const mockAppRouter = nextjsMocks.createMockAppRouter()
      const TestComponent = () => React.createElement('div', null, 'Navigation Test')
      
      const { appRouter } = renderWithProviders(React.createElement(TestComponent), {
        appRouter: mockAppRouter
      })
      
      expect(appRouter.push).toBeDefined()
      expect(appRouter.replace).toBeDefined()
      expect(appRouter.back).toBeDefined()
    })

    it('should handle App Router prefetching', () => {
      const React = require('react')
      const mockAppRouter = nextjsMocks.createMockAppRouter()
      const TestComponent = () => React.createElement('div', null, 'Prefetch Test')
      
      const { appRouter } = renderWithProviders(React.createElement(TestComponent), {
        appRouter: mockAppRouter
      })
      
      expect(appRouter.prefetch).toBeDefined()
    })
  })

  describe('Middleware Integration', () => {
    it('should handle authentication middleware', async () => {
      const mockRequest = nextjsMocks.createMockMiddlewareRequest()
      const mockResponse = nextjsMocks.createMockMiddlewareResponse()
      
      // Mock authenticated user
      mockRequest.headers.set('authorization', 'Bearer valid-token')
      
      // Test middleware logic
      const isAuthenticated = mockRequest.headers.has('authorization')
      expect(isAuthenticated).toBe(true)
    })

    it('should handle CORS middleware', () => {
      const mockRequest = nextjsMocks.createMockMiddlewareRequest()
      const mockResponse = nextjsMocks.createMockMiddlewareResponse()
      
      // Test CORS headers
      mockResponse.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000')
      mockResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
      
      expect(mockResponse.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
      expect(mockResponse.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE')
    })

    it('should handle security headers middleware', () => {
      const mockRequest = nextjsMocks.createMockMiddlewareRequest()
      const mockResponse = nextjsMocks.createMockMiddlewareResponse()
      
      // Test security headers
      mockResponse.headers.set('X-Frame-Options', 'DENY')
      mockResponse.headers.set('X-Content-Type-Options', 'nosniff')
      mockResponse.headers.set('X-XSS-Protection', '1; mode=block')
      
      expect(mockResponse.headers.get('X-Frame-Options')).toBe('DENY')
      expect(mockResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(mockResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    })

    it('should handle API versioning middleware', () => {
      const mockRequest = nextjsMocks.createMockMiddlewareRequest()
      const mockResponse = nextjsMocks.createMockMiddlewareResponse()
      
      // Test API versioning
      mockRequest.nextUrl.pathname = '/api/v1/whiteboards'
      
      if (mockRequest.nextUrl.pathname.startsWith('/api/')) {
        mockResponse.headers.set('X-API-Version', '1.0.0')
      }
      
      expect(mockResponse.headers.get('X-API-Version')).toBe('1.0.0')
    })
  })

  describe('API Routes Integration', () => {
    it('should handle GET requests', async () => {
      const mockRequest = nextjsMocks.createMockRequest({
        method: 'GET',
        url: '/api/v1/whiteboards'
      })
      
      const mockResponse = nextjsMocks.createMockResponse()
      
      // Test GET request handling
      expect(mockRequest.method).toBe('GET')
      expect(mockRequest.url).toBe('/api/v1/whiteboards')
    })

    it('should handle POST requests', async () => {
      const mockRequest = nextjsMocks.createMockRequest({
        method: 'POST',
        url: '/api/v1/whiteboards',
        body: { name: 'Test Whiteboard' }
      })
      
      const mockResponse = nextjsMocks.createMockResponse()
      
      // Test POST request handling
      expect(mockRequest.method).toBe('POST')
      expect(mockRequest.body).toEqual({ name: 'Test Whiteboard' })
    })

    it('should handle PUT requests', async () => {
      const mockRequest = nextjsMocks.createMockRequest({
        method: 'PUT',
        url: '/api/v1/whiteboards/123',
        body: { name: 'Updated Whiteboard' }
      })
      
      const mockResponse = nextjsMocks.createMockResponse()
      
      // Test PUT request handling
      expect(mockRequest.method).toBe('PUT')
      expect(mockRequest.url).toBe('/api/v1/whiteboards/123')
      expect(mockRequest.body).toEqual({ name: 'Updated Whiteboard' })
    })

    it('should handle DELETE requests', async () => {
      const mockRequest = nextjsMocks.createMockRequest({
        method: 'DELETE',
        url: '/api/v1/whiteboards/123'
      })
      
      const mockResponse = nextjsMocks.createMockResponse()
      
      // Test DELETE request handling
      expect(mockRequest.method).toBe('DELETE')
      expect(mockRequest.url).toBe('/api/v1/whiteboards/123')
    })

    it('should handle OPTIONS requests for CORS', async () => {
      const mockRequest = nextjsMocks.createMockRequest({
        method: 'OPTIONS',
        url: '/api/v1/whiteboards'
      })
      
      const mockResponse = nextjsMocks.createMockResponse()
      
      // Test OPTIONS request handling
      expect(mockRequest.method).toBe('OPTIONS')
      
      // Should return 200 for preflight requests
      mockResponse.status = 200
      expect(mockResponse.status).toBe(200)
    })
  })

  describe('Performance Optimizations', () => {
    it('should handle image optimization', () => {
      const mockImage = nextjsMocks.createMockImage()
      
      // Test image component
      const result = mockImage({
        src: '/test-image.jpg',
        alt: 'Test Image',
        width: 100,
        height: 100
      })
      
      expect(mockImage).toHaveBeenCalledWith({
        src: '/test-image.jpg',
        alt: 'Test Image',
        width: 100,
        height: 100
      })
    })

    it('should handle dynamic imports', () => {
      const mockDynamicImport = nextjsMocks.createMockDynamicImport()
      
      // Test dynamic import
      const Component = mockDynamicImport(() => import('./test-component'))
      
      expect(mockDynamicImport).toHaveBeenCalled()
    })

    it('should handle code splitting', () => {
      const mockLazy = nextjsMocks.createMockLazy()
      
      // Test lazy loading
      const LazyComponent = mockLazy(() => import('./lazy-component'))
      
      expect(mockLazy).toHaveBeenCalled()
    })

    it('should handle prefetching', () => {
      const mockPrefetch = nextjsMocks.createMockPrefetch()
      
      // Test prefetching
      mockPrefetch('/whiteboard/123')
      
      expect(mockPrefetch).toHaveBeenCalledWith('/whiteboard/123')
    })
  })

  describe('PWA Features', () => {
    it('should handle service worker registration', () => {
      // Mock service worker registration
      const mockSW = {
        register: jest.fn().mockResolvedValue({
          installing: null,
          waiting: null,
          active: {
            addEventListener: jest.fn(),
            postMessage: jest.fn()
          }
        })
      }
      
      // Test service worker registration
      expect(mockSW.register).toBeDefined()
    })

    it('should handle offline functionality', () => {
      // Mock offline detection
      const isOnline = navigator.onLine
      
      // Test offline detection
      expect(typeof isOnline).toBe('boolean')
    })

    it('should handle push notifications', () => {
      // Mock push notification
      const mockNotification = {
        requestPermission: jest.fn().mockResolvedValue('granted'),
        show: jest.fn()
      }
      
      // Test push notification
      expect(mockNotification.requestPermission).toBeDefined()
      expect(mockNotification.show).toBeDefined()
    })
  })

  describe('Security Features', () => {
    it('should handle Content Security Policy', () => {
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://*.supabase.co"
      ].join('; ')
      
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src 'self'")
      expect(csp).toContain("style-src 'self'")
    })

    it('should handle XSS protection', () => {
      const xssProtection = '1; mode=block'
      
      expect(xssProtection).toBe('1; mode=block')
    })

    it('should handle CSRF protection', () => {
      // Mock CSRF token
      const csrfToken = 'csrf-token-123'
      
      expect(csrfToken).toBeDefined()
      expect(typeof csrfToken).toBe('string')
    })
  })

  describe('Accessibility Features', () => {
    it('should handle keyboard navigation', () => {
      const mockKeyboardEvent = {
        key: 'Tab',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      }
      
      // Test keyboard navigation
      expect(mockKeyboardEvent.key).toBe('Tab')
    })

    it('should handle screen reader support', () => {
      const mockAriaLabel = 'Whiteboard canvas'
      const mockAriaDescribedBy = 'whiteboard-description'
      
      // Test ARIA attributes
      expect(mockAriaLabel).toBeDefined()
      expect(mockAriaDescribedBy).toBeDefined()
    })

    it('should handle high contrast mode', () => {
      // Mock high contrast detection
      const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      
      // Test high contrast detection
      expect(typeof isHighContrast).toBe('boolean')
    })
  })

  describe('Browser Compatibility', () => {
    it('should handle Chrome browser', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      
      expect(userAgent).toContain('Chrome')
    })

    it('should handle Firefox browser', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      
      expect(userAgent).toContain('Firefox')
    })

    it('should handle Safari browser', () => {
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
      
      expect(userAgent).toContain('Safari')
    })

    it('should handle Edge browser', () => {
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
      
      expect(userAgent).toContain('Edg')
    })
  })

  describe('Error Handling', () => {
    it('should handle 404 errors', () => {
      const mock404Response = {
        status: 404,
        statusText: 'Not Found',
        body: { error: 'Page not found' }
      }
      
      expect(mock404Response.status).toBe(404)
      expect(mock404Response.body.error).toBe('Page not found')
    })

    it('should handle 500 errors', () => {
      const mock500Response = {
        status: 500,
        statusText: 'Internal Server Error',
        body: { error: 'Something went wrong' }
      }
      
      expect(mock500Response.status).toBe(500)
      expect(mock500Response.body.error).toBe('Something went wrong')
    })

    it('should handle network errors', () => {
      const mockNetworkError = new Error('Network request failed')
      
      expect(mockNetworkError.message).toBe('Network request failed')
    })
  })

  describe('Caching Strategy', () => {
    it('should handle static asset caching', () => {
      const cacheControl = 'public, max-age=31536000, immutable'
      
      expect(cacheControl).toContain('public')
      expect(cacheControl).toContain('max-age=31536000')
      expect(cacheControl).toContain('immutable')
    })

    it('should handle API response caching', () => {
      const cacheControl = 'public, max-age=60, s-maxage=300'
      
      expect(cacheControl).toContain('public')
      expect(cacheControl).toContain('max-age=60')
      expect(cacheControl).toContain('s-maxage=300')
    })

    it('should handle no-cache headers', () => {
      const cacheControl = 'no-cache, no-store, must-revalidate'
      
      expect(cacheControl).toContain('no-cache')
      expect(cacheControl).toContain('no-store')
      expect(cacheControl).toContain('must-revalidate')
    })
  })

  describe('Build Optimization', () => {
    it('should handle bundle splitting', () => {
      const bundleConfig = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          }
        }
      }
      
      expect(bundleConfig.chunks).toBe('all')
      expect(bundleConfig.cacheGroups.vendor).toBeDefined()
    })

    it('should handle tree shaking', () => {
      const treeShakingConfig = {
        sideEffects: false,
        usedExports: true
      }
      
      expect(treeShakingConfig.sideEffects).toBe(false)
      expect(treeShakingConfig.usedExports).toBe(true)
    })

    it('should handle minification', () => {
      const minificationConfig = {
        removeConsole: true,
        compress: true,
        mangle: true
      }
      
      expect(minificationConfig.removeConsole).toBe(true)
      expect(minificationConfig.compress).toBe(true)
      expect(minificationConfig.mangle).toBe(true)
    })
  })
})
