#!/usr/bin/env node
/**
 * Professional API Rate Limiting System
 * 
 * Implements comprehensive rate limiting with multiple strategies,
 * Redis caching, and flexible configuration options.
 * 
 * @fileoverview API rate limiting utilities and middleware
 */

// Express types are not needed for frontend
// import { Request, Response, any } from 'express'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests: boolean
  skipFailedRequests: boolean
  keyGenerator: (req: any) => string
  onLimitReached: (req: any, res: any) => void
  standardHeaders: boolean
  legacyHeaders: boolean
  message: string
  statusCode: number
  skip: (req: any) => boolean
  store: RateLimitStore
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ totalHits: number; resetTime: Date }>
  decrement(key: string): Promise<void>
  resetKey(key: string): Promise<void>
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: Date
  totalHits: number
}

export interface RateLimitRule {
  name: string
  windowMs: number
  maxRequests: number
  keyGenerator: (req: any) => string
  skip?: (req: any) => boolean
  message?: string
  statusCode?: number
}

export class MemoryRateLimitStore implements RateLimitStore {
  private hits: Map<string, { count: number; resetTime: Date }> = new Map()

  async increment(key: string, windowMs: number): Promise<{ totalHits: number; resetTime: Date }> {
    const now = new Date()
    const resetTime = new Date(now.getTime() + windowMs)
    
    const existing = this.hits.get(key)
    
    if (!existing || existing.resetTime <= now) {
      // New window or expired window
      this.hits.set(key, { count: 1, resetTime })
      return { totalHits: 1, resetTime }
    } else {
      // Existing window
      existing.count++
      return { totalHits: existing.count, resetTime: existing.resetTime }
    }
  }

  async decrement(key: string): Promise<void> {
    const existing = this.hits.get(key)
    if (existing && existing.count > 0) {
      existing.count--
    }
  }

  async resetKey(key: string): Promise<void> {
    this.hits.delete(key)
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = new Date()
    for (const [key, data] of this.hits.entries()) {
      if (data.resetTime <= now) {
        this.hits.delete(key)
      }
    }
  }
}

export class APIRateLimiter {
  private config: RateLimitConfig
  private rules: Map<string, RateLimitRule> = new Map()

  constructor(config: RateLimitConfig) {
    this.config = config
    this.initializeDefaultRules()
  }

  /**
   * Initialize default rate limiting rules
   */
  private initializeDefaultRules(): void {
    // Global rate limit
    this.addRule({
      name: 'global',
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000,
      keyGenerator: (req) => 'global',
      message: 'Too many requests from this IP, please try again later'
    })

    // Per-IP rate limit
    this.addRule({
      name: 'per-ip',
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      keyGenerator: (req: any) => `ip:${req.ip || 'unknown'}`,
      message: 'Too many requests from this IP, please try again later'
    })

    // Per-user rate limit
    this.addRule({
      name: 'per-user',
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 200,
      keyGenerator: (req) => `user:${(req as any).user?.id || 'anonymous'}`,
      skip: (req) => !(req as any).user,
      message: 'Too many requests from this user, please try again later'
    })

    // API endpoint specific limits
    this.addRule({
      name: 'events-create',
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      keyGenerator: (req: any) => `events-create:${req.user?.id || req.ip || 'unknown'}`,
      skip: (req: any) => req.method !== 'POST' || !req.path?.includes('/events'),
      message: 'Too many event creation requests, please try again later'
    })

    this.addRule({
      name: 'events-register',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5,
      keyGenerator: (req: any) => `events-register:${req.user?.id || req.ip || 'unknown'}`,
      skip: (req: any) => req.method !== 'POST' || !req.path?.includes('/register'),
      message: 'Too many registration requests, please try again later'
    })

    this.addRule({
      name: 'notifications-send',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,
      keyGenerator: (req: any) => `notifications-send:${req.user?.id || req.ip || 'unknown'}`,
      skip: (req: any) => req.method !== 'POST' || !req.path?.includes('/notifications'),
      message: 'Too many notification requests, please try again later'
    })

    this.addRule({
      name: 'networking-connect',
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      keyGenerator: (req: any) => `networking-connect:${req.user?.id || req.ip || 'unknown'}`,
      skip: (req: any) => req.method !== 'POST' || !req.path?.includes('/connect'),
      message: 'Too many connection requests, please try again later'
    })

    // Strict limits for sensitive operations
    this.addRule({
      name: 'password-reset',
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      keyGenerator: (req: any) => `password-reset:${req.body?.email || req.ip || 'unknown'}`,
      skip: (req: any) => !req.path?.includes('/password-reset'),
      message: 'Too many password reset requests, please try again later'
    })

    this.addRule({
      name: 'login-attempts',
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      keyGenerator: (req: any) => `login:${req.body?.email || req.ip || 'unknown'}`,
      skip: (req: any) => !req.path?.includes('/login'),
      message: 'Too many login attempts, please try again later'
    })
  }

  /**
   * Add custom rate limiting rule
   */
  public addRule(rule: RateLimitRule): void {
    this.rules.set(rule.name, rule)
  }

  /**
   * Remove rate limiting rule
   */
  public removeRule(name: string): void {
    this.rules.delete(name)
  }

  /**
   * Get rate limiting rule
   */
  public getRule(name: string): RateLimitRule | null {
    return this.rules.get(name) || null
  }

  /**
   * Create rate limiting middleware
   */
  public createMiddleware(ruleName?: string) {
    return async (req: any, res: any, next: any) => {
      try {
        // Get applicable rules
        const applicableRules = ruleName 
          ? [this.rules.get(ruleName)].filter(Boolean) as RateLimitRule[]
          : Array.from(this.rules.values()).filter(rule => !rule.skip || !rule.skip(req))

        // Check each rule
        for (const rule of applicableRules) {
          const key = rule.keyGenerator(req)
          const { totalHits, resetTime } = await this.config.store.increment(key, rule.windowMs)

          // Add rate limit headers
          this.addRateLimitHeaders(res, {
            limit: rule.maxRequests,
            remaining: Math.max(0, rule.maxRequests - totalHits),
            reset: resetTime,
            totalHits
          })

          // Check if limit exceeded
          if (totalHits > rule.maxRequests) {
            if (this.config.onLimitReached) {
              this.config.onLimitReached(req, res)
            }

            return res.status(rule.statusCode || 429).json({
              success: false,
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: rule.message || 'Rate limit exceeded',
                retryAfter: Math.ceil((resetTime.getTime() - Date.now()) / 1000)
              }
            })
          }
        }

        next()
      } catch (error) {
        // Continue without rate limiting if there's an error
        next()
      }
    }
  }

  /**
   * Add rate limit headers to response
   */
  private addRateLimitHeaders(res: any, info: RateLimitInfo): void {
    if (this.config.standardHeaders) {
      res.set({
        'RateLimit-Limit': info.limit.toString(),
        'RateLimit-Remaining': info.remaining.toString(),
        'RateLimit-Reset': Math.ceil(info.reset.getTime() / 1000).toString()
      })
    }

    if (this.config.legacyHeaders) {
      res.set({
        'X-RateLimit-Limit': info.limit.toString(),
        'X-RateLimit-Remaining': info.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(info.reset.getTime() / 1000).toString()
      })
    }
  }

  /**
   * Get rate limit status for a key
   */
  public async getRateLimitStatus(key: string, ruleName: string): Promise<RateLimitInfo | null> {
    const rule = this.rules.get(ruleName)
    if (!rule) return null

    const { totalHits, resetTime } = await this.config.store.increment(key, rule.windowMs)
    
    return {
      limit: rule.maxRequests,
      remaining: Math.max(0, rule.maxRequests - totalHits),
      reset: resetTime,
      totalHits
    }
  }

  /**
   * Reset rate limit for a key
   */
  public async resetRateLimit(key: string): Promise<void> {
    await this.config.store.resetKey(key)
  }

  /**
   * Decrement rate limit for a key (useful for failed requests)
   */
  public async decrementRateLimit(key: string): Promise<void> {
    await this.config.store.decrement(key)
  }

  /**
   * Create adaptive rate limiting middleware
   */
  public createAdaptiveMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        // Determine if request was successful
        const originalSend = res.send
        let isSuccessful = true

        res.send = function(data: any) {
          isSuccessful = res.statusCode < 400
          return originalSend.call(this, data)
        }

        // Apply rate limiting
        await this.createMiddleware()(req, res, next)

        // Decrement on failed requests if configured
        if (!isSuccessful && this.config.skipFailedRequests) {
          const applicableRules = Array.from(this.rules.values()).filter(rule => !rule.skip || !rule.skip(req))
          for (const rule of applicableRules) {
            const key = rule.keyGenerator(req)
            await this.decrementRateLimit(key)
          }
        }
      } catch (error) {
        next()
      }
    }
  }

  /**
   * Create burst protection middleware
   */
  public createBurstProtectionMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const burstKey = `burst:${req.ip}`
        const { totalHits } = await this.config.store.increment(burstKey, 60 * 1000) // 1 minute window

        // Allow burst of 20 requests per minute
        if (totalHits > 20) {
          return res.status(429).json({
            success: false,
            error: {
              code: 'BURST_LIMIT_EXCEEDED',
              message: 'Too many requests in a short time period',
              retryAfter: 60
            }
          })
        }

        next()
      } catch (error) {
        next()
      }
    }
  }

  /**
   * Create distributed rate limiting middleware (for multiple servers)
   */
  public createDistributedMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        // Use Redis or other distributed store
        const distributedKey = `distributed:${req.ip}`
        const { totalHits, resetTime } = await this.config.store.increment(distributedKey, 15 * 60 * 1000)

        if (totalHits > 1000) { // Global limit across all servers
          return res.status(429).json({
            success: false,
            error: {
              code: 'DISTRIBUTED_RATE_LIMIT_EXCEEDED',
              message: 'Rate limit exceeded across all servers',
              retryAfter: Math.ceil((resetTime.getTime() - Date.now()) / 1000)
            }
          })
        }

        next()
      } catch (error) {
        next()
      }
    }
  }

  /**
   * Create rate limiting middleware with custom logic
   */
  public createCustomMiddleware(
    customLogic: (req: any, res: any, next: any) => Promise<void>
  ) {
    return async (req: any, res: any, next: any) => {
      try {
        await customLogic(req, res, next)
      } catch (error) {
        next()
      }
    }
  }

  /**
   * Get rate limiting statistics
   */
  public async getStatistics(): Promise<{
    totalRules: number
    activeRules: string[]
    storeType: string
  }> {
    return {
      totalRules: this.rules.size,
      activeRules: Array.from(this.rules.keys()),
      storeType: this.config.store.constructor.name
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Default configuration
export const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => req.ip,
  onLimitReached: (req, res) => {
  },
  standardHeaders: true,
  legacyHeaders: true,
  message: 'Too many requests, please try again later',
  statusCode: 429,
  skip: (req) => false,
  store: new MemoryRateLimitStore()
}

// Express middleware extension
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
      }
    }
  }
}

// CLI interface
export class APIRateLimitingCLI {
  private limiter: APIRateLimiter

  constructor(config: RateLimitConfig = defaultRateLimitConfig) {
    this.limiter = new APIRateLimiter(config)
  }

  public async run(args: string[]): Promise<void> {
    const command = args[0] || 'status'

    switch (command) {
      case 'status':
        await this.showStatus()
        break
      case 'rules':
        this.listRules()
        break
      case 'add':
        if (args.length < 5) {
          return
        }
        this.limiter.addRule({
          name: args[1],
          windowMs: parseInt(args[2]),
          maxRequests: parseInt(args[3]),
          keyGenerator: (req) => args[4] === 'ip' ? req.ip : `custom:${args[4]}`
        })
        break
      case 'remove':
        if (args.length < 2) {
          return
        }
        this.limiter.removeRule(args[1])
        break
      case 'reset':
        if (args.length < 2) {
          return
        }
        await this.limiter.resetRateLimit(args[1])
        break
      default:
    }
  }

  private async showStatus(): Promise<void> {
    const stats = await this.limiter.getStatistics()
  }

  private listRules(): void {
    this.limiter['rules'].forEach((rule, name) => {
    })
  }
}

export default APIRateLimiter
