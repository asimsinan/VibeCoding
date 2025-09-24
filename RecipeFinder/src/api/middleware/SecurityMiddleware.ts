/**
 * Security Middleware Implementation
 * Traces to FR-001, FR-002, FR-003
 * TDD Phase: Implementation (GREEN phase)
 */

import { Request, Response, NextFunction } from 'express';
import { SecurityMiddleware as ISecurityMiddleware } from '../types/ApiTypes';
import rateLimit from 'express-rate-limit';

export class SecurityMiddleware implements ISecurityMiddleware {
  private rateLimiter: any;

  constructor() {
    // Configure rate limiting
    this.rateLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        statusCode: 429,
        timestamp: new Date().toISOString()
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  setupSecurity(req: Request, res: Response, next: NextFunction): void {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; frame-ancestors 'none';");

    // Sanitize input
    this.sanitizeInput(req);

    next();
  }

  rateLimit(req: Request, res: Response, next: NextFunction): void {
    this.rateLimiter(req, res, next);
  }

  private sanitizeInput(req: Request): void {
    // Sanitize query parameters
    if (req.query) {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = this.sanitizeString(req.query[key] as string);
        }
      }
    }

    // Sanitize body parameters
    if (req.body) {
      this.sanitizeObject(req.body);
    }
  }

  private sanitizeObject(obj: any): void {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = this.sanitizeString(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key] = obj[key].map((item: any) => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.sanitizeObject(obj[key]);
      }
    }
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}
