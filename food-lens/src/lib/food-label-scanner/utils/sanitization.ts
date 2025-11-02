/**
 * Input Sanitization Utilities
 * Prevents XSS, SQL injection, and other security vulnerabilities
 */

import { SanitizationError } from './errors';

export const Sanitizers = {
  /**
   * Sanitize string input - remove dangerous characters
   */
  string(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      throw new SanitizationError('Input must be a string');
    }

    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Remove control characters except newline and tab
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized.trim();
  },

  /**
   * Sanitize email input
   */
  email(email: string): string {
    const sanitized = this.string(email, 254);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(sanitized)) {
      throw new SanitizationError('Invalid email format after sanitization');
    }

    return sanitized.toLowerCase();
  },

  /**
   * Sanitize display name
   */
  displayName(name: string): string {
    const sanitized = this.string(name, 50);
    
    // Allow only alphanumeric, spaces, hyphens, underscores, and common Unicode characters
    const allowedPattern = /^[a-zA-Z0-9\s\-_àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ]+$/;
    
    if (!allowedPattern.test(sanitized)) {
      throw new SanitizationError('Display name contains invalid characters');
    }

    return sanitized;
  },

  /**
   * Sanitize Firestore query input
   */
  firestoreQuery(query: string): string {
    const sanitized = this.string(query, 500);
    
    // Remove potentially dangerous Firestore operators
    const dangerous = ['$', '{', '}', '\\'];
    for (const char of dangerous) {
      if (sanitized.includes(char)) {
        throw new SanitizationError('Query contains potentially dangerous characters');
      }
    }

    return sanitized;
  },

  /**
   * Sanitize URL input
   */
  url(url: string): string {
    const sanitized = this.string(url, 2048);
    
    // Basic URL validation
    try {
      const parsed = new URL(sanitized);
      // Only allow http and https
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new SanitizationError('URL must use http or https protocol');
      }
      return sanitized;
    } catch {
      throw new SanitizationError('Invalid URL format');
    }
  },

  /**
   * Sanitize base64 image data
   */
  base64Image(base64: string): string {
    const sanitized = this.string(base64, 15 * 1024 * 1024); // 15MB max
    
    // Validate base64 format
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif);base64,[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(sanitized)) {
      throw new SanitizationError('Invalid base64 image format');
    }

    return sanitized;
  },

  /**
   * Sanitize number input
   */
  number(input: any, min?: number, max?: number): number {
    const num = Number(input);
    
    if (isNaN(num) || !isFinite(num)) {
      throw new SanitizationError('Input is not a valid number');
    }

    if (min !== undefined && num < min) {
      throw new SanitizationError(`Number must be at least ${min}`);
    }

    if (max !== undefined && num > max) {
      throw new SanitizationError(`Number must be at most ${max}`);
    }

    return num;
  },

  /**
   * Sanitize object - recursively sanitize all string properties
   */
  object<T extends Record<string, any>>(obj: T, maxDepth: number = 10): T {
    if (maxDepth <= 0) {
      throw new SanitizationError('Object nesting too deep');
    }

    const sanitized = {} as T;

    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.string(key, 100);
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey as keyof T] = this.string(value) as T[keyof T];
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey as keyof T] = value as T[keyof T];
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey as keyof T] = value as T[keyof T];
      } else if (value === null || value === undefined) {
        sanitized[sanitizedKey as keyof T] = value as T[keyof T];
      } else if (Array.isArray(value)) {
        sanitized[sanitizedKey as keyof T] = value.map((item: any) => 
          typeof item === 'string' ? this.string(item) : item
        ) as T[keyof T];
      } else if (typeof value === 'object') {
        sanitized[sanitizedKey as keyof T] = this.object(value, maxDepth - 1) as T[keyof T];
      }
    }

    return sanitized;
  },
};

