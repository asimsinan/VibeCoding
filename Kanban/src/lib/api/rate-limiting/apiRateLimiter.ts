/**
 * API Rate Limiting - Rate limiting implementation for API endpoints
 * FR-001: API-First Design - Rate limiting implementation
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  keyGenerator?: (req: any) => string; // Custom key generator
  onLimitReached?: (req: any, res: any) => void; // Callback when limit is reached
  standardHeaders?: boolean; // Include rate limit info in headers
  legacyHeaders?: boolean; // Include legacy rate limit headers
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitInfo | null>;
  set(key: string, info: RateLimitInfo, ttl: number): Promise<void>;
  increment(key: string, windowMs: number, maxRequests: number): Promise<RateLimitInfo>;
  reset(key: string): Promise<void>;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, { info: RateLimitInfo; expires: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }

    return entry.info;
  }

  async set(key: string, info: RateLimitInfo, ttl: number): Promise<void> {
    this.store.set(key, {
      info,
      expires: Date.now() + ttl,
    });
  }

  async increment(key: string, windowMs: number, maxRequests: number): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const entry = this.store.get(key);

    if (!entry || now > entry.expires) {
      // Create new entry
      const info: RateLimitInfo = {
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: now + windowMs,
      };
      await this.set(key, info, windowMs);
      return info;
    }

    // Update existing entry
    const info = entry.info;
    if (now >= info.reset) {
      // Window has expired, reset
      info.remaining = maxRequests - 1;
      info.reset = now + windowMs;
    } else {
      // Within window, decrement remaining
      info.remaining = Math.max(0, info.remaining - 1);
    }

    await this.set(key, info, windowMs);
    return info;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expires) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export class ApiRateLimiter {
  private static instance: ApiRateLimiter;
  private store: RateLimitStore;
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor(store?: RateLimitStore) {
    this.store = store || new MemoryRateLimitStore();
    this.initializeDefaultConfigs();
  }

  public static getInstance(store?: RateLimitStore): ApiRateLimiter {
    if (!ApiRateLimiter.instance) {
      ApiRateLimiter.instance = new ApiRateLimiter(store);
    }
    return ApiRateLimiter.instance;
  }

  private initializeDefaultConfigs(): void {
    // Global rate limit
    this.configs.set('global', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    });

    // Authentication rate limit
    this.configs.set('auth', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // 10 login attempts per 15 minutes
      skipSuccessfulRequests: true,
      standardHeaders: true,
    });

    // API rate limit
    this.configs.set('api', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per 15 minutes
      standardHeaders: true,
    });

    // Strict rate limit for sensitive operations
    this.configs.set('strict', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // 5 requests per minute
      standardHeaders: true,
    });
  }

  public addConfig(name: string, config: RateLimitConfig): void {
    this.configs.set(name, config);
  }

  public getConfig(name: string): RateLimitConfig | undefined {
    return this.configs.get(name);
  }

  public async checkLimit(
    key: string,
    configName: string = 'api'
  ): Promise<{ allowed: boolean; info: RateLimitInfo; retryAfter?: number }> {
    const config = this.configs.get(configName);
    if (!config) {
      throw new Error(`Rate limit config '${configName}' not found`);
    }

    const info = await this.store.increment(key, config.windowMs, config.maxRequests);
    const allowed = info.remaining >= 0;

    if (!allowed) {
      const retryAfter = Math.ceil((info.reset - Date.now()) / 1000);
      return { allowed: false, info, retryAfter };
    }

    return { allowed: true, info };
  }

  public async resetLimit(key: string): Promise<void> {
    await this.store.reset(key);
  }

  public generateKey(req: any, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(req);
    }

    // Default key generation based on IP and user
    const ip = this.getClientIP(req);
    const userId = this.getUserId(req);
    
    if (userId) {
      return `user:${userId}`;
    }
    
    return `ip:${ip}`;
  }

  public getRateLimitHeaders(info: RateLimitInfo, config: RateLimitConfig): Record<string, string> {
    const headers: Record<string, string> = {};

    if (config.standardHeaders) {
      headers['RateLimit-Limit'] = info.limit.toString();
      headers['RateLimit-Remaining'] = info.remaining.toString();
      headers['RateLimit-Reset'] = Math.ceil(info.reset / 1000).toString();
      
      if (info.retryAfter) {
        headers['Retry-After'] = info.retryAfter.toString();
      }
    }

    if (config.legacyHeaders) {
      headers['X-RateLimit-Limit'] = info.limit.toString();
      headers['X-RateLimit-Remaining'] = info.remaining.toString();
      headers['X-RateLimit-Reset'] = Math.ceil(info.reset / 1000).toString();
    }

    return headers;
  }

  public async middleware(configName: string = 'api') {
    return async (req: any, res: any, next: any) => {
      try {
        const config = this.configs.get(configName);
        if (!config) {
          return next();
        }

        const key = this.generateKey(req, config);
        const { allowed, info, retryAfter } = await this.checkLimit(key, configName);

        // Add rate limit headers
        const headers = this.getRateLimitHeaders(info, config);
        Object.entries(headers).forEach(([name, value]) => {
          res.setHeader(name, value);
        });

        if (!allowed) {
          if (config.onLimitReached) {
            config.onLimitReached(req, res);
          }

          return res.status(429).json({
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests',
              details: {
                limit: info.limit,
                remaining: info.remaining,
                reset: info.reset,
                retryAfter,
              },
            },
            meta: {
              timestamp: new Date().toISOString(),
              version: '1.0.0',
            },
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        next();
      }
    };
  }

  public async checkAndIncrement(
    key: string,
    configName: string = 'api'
  ): Promise<{ allowed: boolean; info: RateLimitInfo; retryAfter?: number }> {
    return this.checkLimit(key, configName);
  }

  public async getCurrentLimit(key: string, configName: string = 'api'): Promise<RateLimitInfo | null> {
    const config = this.configs.get(configName);
    if (!config) {
      return null;
    }

    return this.store.get(key);
  }

  public async isLimitExceeded(key: string, configName: string = 'api'): Promise<boolean> {
    const { allowed } = await this.checkLimit(key, configName);
    return !allowed;
  }

  public async getRemainingRequests(key: string, configName: string = 'api'): Promise<number> {
    const info = await this.getCurrentLimit(key, configName);
    return info ? info.remaining : 0;
  }

  public async getResetTime(key: string, configName: string = 'api'): Promise<number> {
    const info = await this.getCurrentLimit(key, configName);
    return info ? info.reset : 0;
  }

  private getClientIP(req: any): string {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           'unknown';
  }

  private getUserId(req: any): string | null {
    return req.user?.id || 
           req.headers['x-user-id'] ||
           null;
  }

  public destroy(): void {
    if (this.store instanceof MemoryRateLimitStore) {
      this.store.destroy();
    }
  }
}

// Export singleton instance
export const apiRateLimiter = ApiRateLimiter.getInstance();
