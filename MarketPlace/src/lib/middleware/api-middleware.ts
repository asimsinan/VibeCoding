// API Middleware
// Common middleware for API routes

import { NextRequest, NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  details?: any;
  timestamp: string;
  version: string;
}

export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    if (code) {
      this.code = code;
    }
  }
}

// CORS middleware
export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'https://yourdomain.com',
    // Add your production domains
  ];

  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }

  const current = rateLimitMap.get(ip);
  
  if (!current) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

// Authentication middleware
export function authMiddleware(request: NextRequest): { userId: string; sessionToken: string } | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const sessionToken = authHeader.substring(7);
  
  // In real implementation, verify JWT token and extract user ID
  // For now, return mock data
  return {
    userId: 'current-user-id',
    sessionToken,
  };
}

// Request logging middleware
export function logRequest(request: NextRequest, response: NextResponse) {
  const { method, url } = request;
  const { status } = response;
  const timestamp = new Date().toISOString();
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

  console.log(`[${timestamp}] ${method} ${url} ${status} - ${ip} - ${userAgent}`);
}

// Error handling middleware
export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    { status: 500 }
  );
}

// API versioning middleware
export function apiVersionMiddleware(request: NextRequest): string {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  
  // Extract version from URL path (e.g., /api/v1/products -> v1)
  const apiIndex = pathSegments.indexOf('api');
  if (apiIndex !== -1 && pathSegments[apiIndex + 1]) {
    return pathSegments[apiIndex + 1]!;
  }
  
  return 'v1'; // Default version
}

// Request validation middleware
export function validateRequest<T>(
  _request: NextRequest,
  _schema: any
): { success: true; data: T } | { success: false; error: any } {
  try {
    // This would be implemented with actual request body parsing
    // For now, return success
    return { success: true, data: {} as T };
  } catch (error) {
    return { success: false, error };
  }
}

// Response formatting middleware
export function formatResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  const response: ApiResponse<T> = {
    data,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    ...(message && { message })
  };

  return NextResponse.json(response, { status });
}

// Pagination middleware
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export function parsePaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

// Sorting middleware
export interface SortParams {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function parseSortParams(request: NextRequest, defaultSortBy: string = 'createdAt'): SortParams {
  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get('sortBy') || defaultSortBy;
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  return { sortBy, sortOrder };
}

// Filtering middleware
export function parseFilters(request: NextRequest): Record<string, any> {
  const { searchParams } = new URL(request.url);
  const filters: Record<string, any> = {};

  for (const [key, value] of searchParams.entries()) {
    if (key !== 'page' && key !== 'limit' && key !== 'sortBy' && key !== 'sortOrder') {
      filters[key] = value;
    }
  }

  return filters;
}
