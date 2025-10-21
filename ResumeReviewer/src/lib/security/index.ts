import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  isAllowed(req: NextRequest): boolean {
    const key = this.config.keyGenerator ? this.config.keyGenerator(req) : this.getDefaultKey(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up expired entries
    Object.keys(this.store).forEach(k => {
      if (this.store[k].resetTime < now) {
        delete this.store[k];
      }
    });

    // Get or create entry
    if (!this.store[key]) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      return true;
    }

    // Check if within limit
    if (this.store[key].count < this.config.maxRequests) {
      this.store[key].count++;
      return true;
    }

    return false;
  }

  private getDefaultKey(req: NextRequest): string {
    // Use IP address as default key
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
    return `rate_limit:${ip}`;
  }

  getRemainingTime(req: NextRequest): number {
    const key = this.config.keyGenerator ? this.config.keyGenerator(req) : this.getDefaultKey(req);
    const entry = this.store[key];
    if (!entry) return 0;
    return Math.max(0, entry.resetTime - Date.now());
  }
}

// Rate limiter instances
const analysisRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window (increased for testing)
});

const variantRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 requests per hour
});

export function createRateLimitMiddleware(config: RateLimitConfig) {
  const limiter = new RateLimiter(config);
  
  return (req: NextRequest): NextResponse | null => {
    if (!limiter.isAllowed(req)) {
      const remainingTime = limiter.getRemainingTime(req);
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(remainingTime / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(remainingTime / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + remainingTime).toISOString()
          }
        }
      );
    }
    return null;
  };
}

export { analysisRateLimiter, variantRateLimiter };

// API Key Management
export class APIKeyManager {
  private static instance: APIKeyManager;
  private keys: Map<string, { key: string; createdAt: number; lastUsed: number }> = new Map();

  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }

  addKey(id: string, key: string): void {
    this.keys.set(id, {
      key,
      createdAt: Date.now(),
      lastUsed: 0
    });
  }

  getKey(id: string): string | null {
    const keyData = this.keys.get(id);
    if (!keyData) return null;
    
    keyData.lastUsed = Date.now();
    return keyData.key;
  }

  rotateKey(id: string, newKey: string): void {
    this.keys.set(id, {
      key: newKey,
      createdAt: Date.now(),
      lastUsed: Date.now()
    });
  }

  removeKey(id: string): boolean {
    return this.keys.delete(id);
  }

  getKeyInfo(id: string): { createdAt: number; lastUsed: number } | null {
    const keyData = this.keys.get(id);
    if (!keyData) return null;
    return {
      createdAt: keyData.createdAt,
      lastUsed: keyData.lastUsed
    };
  }

  getAllKeys(): Array<{ id: string; createdAt: number; lastUsed: number }> {
    return Array.from(this.keys.entries()).map(([id, data]) => ({
      id,
      createdAt: data.createdAt,
      lastUsed: data.lastUsed
    }));
  }
}

// Input Validation and Sanitization
export class InputValidator {
  static validateFileName(fileName: string): boolean {
    // Check for dangerous characters and path traversal
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    const pathTraversal = /\.\./;
    
    return !dangerousChars.test(fileName) && 
           !pathTraversal.test(fileName) && 
           fileName.length > 0 && 
           fileName.length <= 255;
  }

  static sanitizeText(text: string): string {
    // Remove potentially dangerous HTML/script tags
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  static validateFileSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
    return size > 0 && size <= maxSize;
  }

  static validateFileType(type: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return allowedTypes.includes(type);
  }
}

// Security Headers
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP for API responses
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'none'; script-src 'none'; style-src 'none'; img-src 'none'"
  );
  
  return response;
}

// Request logging for security monitoring
export function logSecurityEvent(
  event: string,
  req: NextRequest,
  details?: Record<string, any>
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    ip: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    method: req.method,
    url: req.url,
    ...details
  };
  
  console.log(`[SECURITY] ${event}:`, JSON.stringify(logData));
}
