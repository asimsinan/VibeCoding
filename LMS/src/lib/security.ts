import { NextRequest, NextResponse } from 'next/server';

// Security headers configuration
export const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Control browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self'",
    "child-src 'self'",
  ].join('; '),
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cross-Origin Embedder Policy
  'Cross-Origin-Embedder-Policy': 'require-corp',
  
  // Cross-Origin Opener Policy
  'Cross-Origin-Opener-Policy': 'same-origin',
  
  // Cross-Origin Resource Policy
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// CORS configuration
export const corsConfig = {
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:3001']
    : [process.env.NEXTAUTH_URL || 'https://lms.example.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Organization-ID',
    'X-User-Role',
    'X-User-ID',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: [
    'X-Organization-ID',
    'X-User-Role',
    'X-User-ID',
  ],
  maxAge: 86400, // 24 hours
};

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: NextRequest) => {
    // Skip rate limiting for health checks
    return req.nextUrl.pathname === '/api/health';
  },
};

// Security middleware
export function securityMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Handle CORS
  const origin = request.headers.get('origin');
  if (origin && corsConfig.origin.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
  response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }
  
  return response;
}

// Content Security Policy builder
export function buildCSP(options?: {
  allowInlineStyles?: boolean;
  allowInlineScripts?: boolean;
  allowEval?: boolean;
  allowDataUrls?: boolean;
  allowExternalImages?: boolean;
  allowExternalFonts?: boolean;
  allowExternalConnections?: boolean;
}) {
  const {
    allowInlineStyles = true,
    allowInlineScripts = true,
    allowEval = false,
    allowDataUrls = true,
    allowExternalImages = true,
    allowExternalFonts = true,
    allowExternalConnections = false,
  } = options || {};
  
  const directives = [
    "default-src 'self'",
    `script-src 'self'${allowInlineScripts ? " 'unsafe-inline'" : ''}${allowEval ? " 'unsafe-eval'" : ''}`,
    `style-src 'self'${allowInlineStyles ? " 'unsafe-inline'" : ''}`,
    `img-src 'self'${allowDataUrls ? ' data:' : ''}${allowExternalImages ? ' https:' : ''}`,
    `font-src 'self'${allowExternalFonts ? ' https:' : ''}`,
    `connect-src 'self'${allowExternalConnections ? ' https:' : ''}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self'",
    "child-src 'self'",
  ];
  
  return directives.join('; ');
}

// Security validation helpers
export const SecurityHelpers = {
  // Validate origin
  isValidOrigin: (origin: string): boolean => {
    return corsConfig.origin.includes(origin);
  },
  
  // Sanitize input
  sanitizeInput: (input: string): string => {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },
  
  // Validate file upload
  isValidFileType: (filename: string, allowedTypes: string[]): boolean => {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
  },
  
  // Validate file size
  isValidFileSize: (size: number, maxSize: number): boolean => {
    return size <= maxSize;
  },
  
  // Generate nonce for CSP
  generateNonce: (): string => {
    return Buffer.from(crypto.randomUUID()).toString('base64');
  },
  
  // Validate CSRF token
  validateCSRFToken: (token: string, sessionToken: string): boolean => {
    return token === sessionToken;
  },
};

// Security event logging
export class SecurityLogger {
  private static instance: SecurityLogger;
  private events: Array<{
    timestamp: Date;
    type: string;
    details: any;
    ip?: string;
    userAgent?: string;
  }> = [];
  
  private constructor() {}
  
  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }
  
  public logSecurityEvent(
    type: string,
    details: any,
    request?: NextRequest
  ): void {
    const event = {
      timestamp: new Date(),
      type,
      details,
      ip: request?.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown',
    };
    
    this.events.push(event);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 Security Event:', event);
    }
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service
      this.sendToMonitoringService(event);
    }
  }
  
  private sendToMonitoringService(event: any): void {
    // Implementation would depend on your monitoring service
    // For now, just log to console
    console.warn('Security event sent to monitoring service:', event);
  }
  
  public getSecurityEvents(): typeof this.events {
    return [...this.events];
  }
  
  public clearEvents(): void {
    this.events = [];
  }
}

// Security middleware for API routes
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: {
    requireHTTPS?: boolean;
    requireAuth?: boolean;
    rateLimit?: boolean;
    csp?: boolean;
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const {
      requireHTTPS = true,
      requireAuth = false,
      rateLimit = true,
      csp = true,
    } = options || {};
    
    // Check HTTPS requirement
    if (requireHTTPS && process.env.NODE_ENV === 'production') {
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      if (protocol !== 'https') {
        return NextResponse.json(
          { error: 'HTTPS required' },
          { status: 426 }
        );
      }
    }
    
    // Check authentication requirement
    if (requireAuth) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    // Apply security headers
    const response = await handler(request);
    
    if (csp) {
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  };
}

