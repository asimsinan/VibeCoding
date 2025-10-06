/**
 * Next.js Test Utilities
 * 
 * Platform-specific testing utilities for Next.js applications.
 * Provides helpers for testing App Router, middleware, and Next.js features.
 * 
 * @fileoverview Next.js testing utilities and helpers
 * @version 1.0.0
 */

import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { NextRouter } from 'next/router'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'

// Mock Next.js router
const createMockRouter = (router: Partial<NextRouter> = {}): NextRouter => ({
  basePath: '',
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isLocale: false,
  isReady: true,
  isPreview: false,
  ...router,
})

// Mock App Router context
const createMockAppRouter = (router: any = {}) => ({
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  ...router,
})

// Custom render function with Next.js providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  router?: Partial<NextRouter>
  appRouter?: any
}

export function renderWithProviders(
  ui: React.ReactElement,
  { router, appRouter, ...renderOptions }: CustomRenderOptions = {}
) {
  const mockRouter = createMockRouter(router)
  const mockAppRouter = createMockAppRouter(appRouter)

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AppRouterContext.Provider value={mockAppRouter}>
        {children}
      </AppRouterContext.Provider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    router: mockRouter,
    appRouter: mockAppRouter,
  }
}

// Mock Next.js middleware
export function createMockMiddleware() {
  return {
    middleware: jest.fn(),
    config: {
      matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
    },
  }
}

// Mock Next.js API routes
export function createMockApiRoute(handler: any) {
  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    DELETE: handler,
    PATCH: handler,
  }
}

// Mock Next.js request/response
export function createMockRequest(options: {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: any
  query?: Record<string, string>
  cookies?: Record<string, string>
} = {}) {
  const {
    method = 'GET',
    url = '/',
    headers = {},
    body,
    query = {},
    cookies = {},
  } = options

  return {
    method,
    url,
    headers: new Map(Object.entries(headers)),
    body,
    query,
    cookies,
    nextUrl: {
      pathname: url,
      searchParams: new URLSearchParams(query),
    },
  } as any
}

export function createMockResponse() {
  const response = {
    status: 200,
    statusText: 'OK',
    headers: new Map(),
    body: null,
  }

  return {
    ...response,
    json: jest.fn().mockReturnValue(response),
    text: jest.fn().mockReturnValue(response),
    redirect: jest.fn().mockReturnValue(response),
    next: jest.fn().mockReturnValue(response),
  } as any
}

// Mock Next.js server components
export function createMockServerComponent() {
  return {
    default: jest.fn(),
    getServerSideProps: jest.fn(),
    getStaticProps: jest.fn(),
    getStaticPaths: jest.fn(),
  }
}

// Mock Next.js client components
export function createMockClientComponent() {
  return {
    default: jest.fn(),
    getInitialProps: jest.fn(),
  }
}

// Mock Next.js image component
export function createMockImage() {
  return jest.fn(({ src, alt, ...props }) => (
    <img src={src} alt={alt} {...props} />
  ))
}

// Mock Next.js link component
export function createMockLink() {
  return jest.fn(({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ))
}

// Mock Next.js head component
export function createMockHead() {
  return jest.fn(({ children }) => <>{children}</>)
}

// Mock Next.js script component
export function createMockScript() {
  return jest.fn(({ children, ...props }) => (
    <script {...props}>
      {children}
    </script>
  ))
}

// Mock Next.js dynamic imports
export function createMockDynamicImport() {
  return jest.fn((component) => component)
}

// Mock Next.js router events
export function createMockRouterEvents() {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  }
}

// Mock Next.js prefetch
export function createMockPrefetch() {
  return jest.fn().mockResolvedValue(undefined)
}

// Mock Next.js middleware matcher
export function createMockMatcher() {
  return jest.fn((pathname) => {
    return !pathname.startsWith('/_next/static') &&
           !pathname.startsWith('/_next/image') &&
           pathname !== '/favicon.ico'
  })
}

// Mock Next.js environment variables
export function createMockEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    NODE_ENV: 'test',
  }
}

// Mock Next.js build info
export function createMockBuildInfo() {
  return {
    buildId: 'test-build-id',
    buildTime: new Date().toISOString(),
    version: '1.0.0',
  }
}

// Mock Next.js performance
export function createMockPerformance() {
  return {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  }
}

// Mock Next.js analytics
export function createMockAnalytics() {
  return {
    track: jest.fn(),
    page: jest.fn(),
    identify: jest.fn(),
    group: jest.fn(),
    alias: jest.fn(),
  }
}

// Mock Next.js error boundary
export function createMockErrorBoundary() {
  return {
    componentDidCatch: jest.fn(),
    getDerivedStateFromError: jest.fn(),
  }
}

// Mock Next.js suspense
export function createMockSuspense() {
  return {
    fallback: <div>Loading...</div>,
  }
}

// Mock Next.js lazy loading
export function createMockLazy() {
  return jest.fn((importFunc) => {
    const Component = React.lazy(importFunc)
    return Component
  })
}

// Mock Next.js server actions
export function createMockServerAction() {
  return jest.fn(async (formData) => {
    return { success: true, data: formData }
  })
}

// Mock Next.js streaming
export function createMockStreaming() {
  return {
    renderToReadableStream: jest.fn(),
    renderToPipeableStream: jest.fn(),
  }
}

// Mock Next.js edge runtime
export function createMockEdgeRuntime() {
  return {
    runtime: 'edge',
    regions: ['us-east-1'],
  }
}

// Mock Next.js ISR
export function createMockISR() {
  return {
    revalidate: 60,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  }
}

// Mock Next.js middleware response
export function createMockMiddlewareResponse() {
  return {
    next: jest.fn(),
    rewrite: jest.fn(),
    redirect: jest.fn(),
    headers: new Map(),
  }
}

// Mock Next.js middleware request
export function createMockMiddlewareRequest() {
  return {
    nextUrl: {
      pathname: '/',
      searchParams: new URLSearchParams(),
    },
    headers: new Map(),
    cookies: new Map(),
    geo: {},
    ip: '127.0.0.1',
    ua: 'Mozilla/5.0 (compatible; TestBot/1.0)',
  }
}

// Export all mocks
export const nextjsMocks = {
  createMockRouter,
  createMockAppRouter,
  createMockMiddleware,
  createMockApiRoute,
  createMockRequest,
  createMockResponse,
  createMockServerComponent,
  createMockClientComponent,
  createMockImage,
  createMockLink,
  createMockHead,
  createMockScript,
  createMockDynamicImport,
  createMockRouterEvents,
  createMockPrefetch,
  createMockMatcher,
  createMockEnv,
  createMockBuildInfo,
  createMockPerformance,
  createMockAnalytics,
  createMockErrorBoundary,
  createMockSuspense,
  createMockLazy,
  createMockServerAction,
  createMockStreaming,
  createMockEdgeRuntime,
  createMockISR,
  createMockMiddlewareResponse,
  createMockMiddlewareRequest,
}

// Re-export everything
export * from './nextjs-test-utils'
