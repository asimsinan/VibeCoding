/**
 * Rate Limiter Middleware
 * TASK-014: Express Server Setup - FR-001 through FR-007
 * 
 * This middleware implements rate limiting to prevent abuse
 * and ensure fair usage of the API.
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
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
    this.cleanup();
  }

  /**
   * Check if request is within rate limit
   */
  public check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean up expired entries
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });

    // Get or create entry for this identifier
    if (!this.store[identifier]) {
      this.store[identifier] = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    const entry = this.store[identifier];

    // Reset if window has passed
    if (entry.resetTime < now) {
      entry.count = 0;
      entry.resetTime = now + this.config.windowMs;
    }

    // Check if limit exceeded
    const allowed = entry.count < this.config.maxRequests;
    
    if (allowed) {
      entry.count++;
    }

    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  /**
   * Clean up expired entries periodically
   */
  private cleanup(): void {
    setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetTime < now) {
          delete this.store[key];
        }
      });
    }, this.config.windowMs);
  }
}

// Create rate limiter instances for different endpoints
const generalLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10000, // 10000 requests per window (very high for development)
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 auth attempts per window (increased for development)
  message: 'Too many authentication attempts, please try again later.'
});

const strictLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000, // 1000 requests per minute (very high for development)
  message: 'Rate limit exceeded, please slow down your requests.'
});

/**
 * Get client identifier for rate limiting
 */
const getClientIdentifier = (req: Request): string => {
  // Use IP address as primary identifier
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // For authenticated users, also include user ID
  const userId = (req as any).user?.userId;
  if (userId) {
    return `${ip}:${userId}`;
  }
  
  return ip;
};

/**
 * General rate limiter middleware
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  // Skip rate limiting for static assets and images
  if (req.path.includes('.jpg') || req.path.includes('.png') || req.path.includes('.gif') || req.path.includes('.svg') || req.path.includes('.ico')) {
    next();
    return;
  }

  const identifier = getClientIdentifier(req);
  const result = generalLimiter.check(identifier);

  if (!result.allowed) {
    res.status(429).json({
      error: {
        message: generalLimiter['config'].message,
        status: 429,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        timestamp: new Date().toISOString()
      }
    });
    return;
  }

  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': generalLimiter['config'].maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
  });

  next();
};

/**
 * Authentication rate limiter middleware
 */
export const authRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const identifier = getClientIdentifier(req);
  const result = authLimiter.check(identifier);

  if (!result.allowed) {
    res.status(429).json({
      error: {
        message: authLimiter['config'].message,
        status: 429,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        timestamp: new Date().toISOString()
      }
    });
    return;
  }

  res.set({
    'X-RateLimit-Limit': authLimiter['config'].maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
  });

  next();
};

/**
 * Strict rate limiter middleware for sensitive operations
 */
export const strictRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const identifier = getClientIdentifier(req);
  const result = strictLimiter.check(identifier);

  if (!result.allowed) {
    res.status(429).json({
      error: {
        message: strictLimiter['config'].message,
        status: 429,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        timestamp: new Date().toISOString()
      }
    });
    return;
  }

  res.set({
    'X-RateLimit-Limit': strictLimiter['config'].maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
  });

  next();
};
