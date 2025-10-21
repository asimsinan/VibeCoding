import { z } from 'zod';
import { createError, ValidationError } from './error-handler';

// Base validation schemas
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email is too long');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password is too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters');

export const uploadIdSchema = z.string()
  .min(1, 'Upload ID is required')
  .max(50, 'Upload ID is too long')
  .regex(/^[a-zA-Z0-9\-_]+$/, 'Upload ID contains invalid characters');

export const sessionIdSchema = z.string()
  .min(1, 'Session ID is required')
  .max(100, 'Session ID is too long')
  .regex(/^[a-zA-Z0-9\-_\.]+$/, 'Session ID contains invalid characters');

export const userIdSchema = z.string()
  .min(1, 'User ID is required')
  .max(50, 'User ID is too long')
  .regex(/^[a-zA-Z0-9\-_]+$/, 'User ID contains invalid characters');

// File validation schemas
export const fileSchema = z.object({
  name: z.string().min(1, 'File name is required').max(255, 'File name is too long'),
  size: z.number().min(1, 'File size must be greater than 0').max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.enum(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], {
    errorMap: () => ({ message: 'Invalid file type. Only PDF and Word documents are allowed' })
  })
});

// Request validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').max(1000, 'Page is too large').optional(),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit is too large').optional(),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).optional()
});

export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
}, 'Start date must be before end date');

// Authentication schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

// Resume upload schemas
export const uploadResumeSchema = z.object({
  file: fileSchema,
  sessionId: sessionIdSchema.optional()
});

export const feedbackRequestSchema = z.object({
  uploadId: uploadIdSchema,
  includeAnalysis: z.boolean().optional(),
  includeRecommendations: z.boolean().optional()
});

export const deleteUploadSchema = z.object({
  uploadId: uploadIdSchema
});

// Health check schema
export const healthCheckSchema = z.object({
  includeMetrics: z.boolean().optional(),
  includeServices: z.boolean().optional()
});

// Validation utility functions
export class InputValidator {
  static validate<T>(schema: z.ZodSchema<T>, data: unknown, requestId?: string): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: (err as any).received
        }));

        throw createError.validation(
          'Input validation failed',
          { errors: validationErrors },
          requestId
        );
      }
      throw error;
    }
  }

  static validateAsync<T>(schema: z.ZodSchema<T>, data: unknown, requestId?: string): Promise<T> {
    return schema.parseAsync(data).catch(error => {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: (err as any).received
        }));

        throw createError.validation(
          'Input validation failed',
          { errors: validationErrors },
          requestId
        );
      }
      throw error;
    });
  }

  static validatePartial<T>(schema: z.ZodSchema<T>, data: unknown, requestId?: string): Partial<T> {
    try {
      return (schema as any).partial().parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: (err as any).received
        }));

        throw createError.validation(
          'Input validation failed',
          { errors: validationErrors },
          requestId
        );
      }
      throw error;
    }
  }

  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = {} as T;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key as keyof T] = this.sanitizeString(value) as T[keyof T];
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key as keyof T] = this.sanitizeObject(value) as T[keyof T];
      } else {
        sanitized[key as keyof T] = value;
      }
    }
    
    return sanitized;
  }

  static validateFileUpload(file: File): { name: string; size: number; type: string } {
    const fileData = {
      name: file.name,
      size: file.size,
      type: file.type
    };

    return this.validate(fileSchema, fileData);
  }

  static validateEmail(email: string): string {
    return this.validate(emailSchema, email);
  }

  static validatePassword(password: string): string {
    return this.validate(passwordSchema, password);
  }

  static validateName(name: string): string {
    return this.validate(nameSchema, name);
  }

  static validateUploadId(uploadId: string): string {
    return this.validate(uploadIdSchema, uploadId);
  }

  static validateSessionId(sessionId: string): string {
    return this.validate(sessionIdSchema, sessionId);
  }

  static validateUserId(userId: string): string {
    return this.validate(userIdSchema, userId);
  }

  static validatePagination(params: any): { page?: number; limit?: number; orderBy?: string; orderDirection?: 'asc' | 'desc' } {
    return this.validate(paginationSchema, params);
  }

  static validateDateRange(params: any): { startDate?: Date; endDate?: Date } {
    return this.validate(dateRangeSchema, params);
  }

  static validateRegistration(data: any): { email: string; password: string; firstName: string; lastName: string } {
    return this.validate(registerSchema, data);
  }

  static validateLogin(data: any): { email: string; password: string } {
    return this.validate(loginSchema, data);
  }

  static validatePasswordChange(data: any): { currentPassword: string; newPassword: string } {
    return this.validate(changePasswordSchema, data);
  }

  static validateResumeUpload(data: any): { file: { name: string; size: number; type: string }; sessionId?: string } {
    return this.validate(uploadResumeSchema, data);
  }

  static validateFeedbackRequest(data: any): { uploadId: string; includeAnalysis?: boolean; includeRecommendations?: boolean } {
    return this.validate(feedbackRequestSchema, data);
  }

  static validateDeleteRequest(data: any): { uploadId: string } {
    return this.validate(deleteUploadSchema, data);
  }

  static validateHealthCheck(data: any): { includeMetrics?: boolean; includeServices?: boolean } {
    return this.validate(healthCheckSchema, data);
  }
}

// Middleware for request validation
export const validateRequest = (schema: z.ZodSchema<any>) => {
  return (req: any, res: any, next: any) => {
    try {
      const requestId = req.headers['x-request-id'] || req.id;
      const validatedData = InputValidator.validate(schema, req.body, requestId);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware for query parameter validation
export const validateQuery = (schema: z.ZodSchema<any>) => {
  return (req: any, res: any, next: any) => {
    try {
      const requestId = req.headers['x-request-id'] || req.id;
      const validatedQuery = InputValidator.validate(schema, req.query, requestId);
      req.validatedQuery = validatedQuery;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Middleware for URL parameter validation
export const validateParams = (schema: z.ZodSchema<any>) => {
  return (req: any, res: any, next: any) => {
    try {
      const requestId = req.headers['x-request-id'] || req.id;
      const validatedParams = InputValidator.validate(schema, req.params, requestId);
      req.validatedParams = validatedParams;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Utility for validating file uploads
export const validateFileUpload = (req: any, res: any, next: any) => {
  try {
    if (!req.file) {
      throw createError.validation('No file uploaded');
    }

    const requestId = req.headers['x-request-id'] || req.id;
    const validatedFile = InputValidator.validateFileUpload(req.file);
    req.validatedFile = validatedFile;
    next();
  } catch (error) {
    next(error);
  }
};

// Security validation utilities
export class SecurityValidator {
  static validateCSRFToken(token: string, sessionToken: string): boolean {
    // In a real implementation, you would validate the CSRF token against the session
    // For now, we'll do a basic check
    return Boolean(token && token.length > 0 && token !== sessionToken);
  }

  static validateRateLimit(clientId: string, attempts: number, windowMs: number): boolean {
    // This would integrate with your rate limiting system
    return attempts < 100; // Placeholder limit
  }

  static validateOrigin(origin: string, allowedOrigins: string[]): boolean {
    return allowedOrigins.includes(origin);
  }

  static sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  static validateSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(;|\-\-|\/\*|\*\/)/,
      /(\b(CHAR|ASCII|SUBSTRING|LEN|COUNT)\s*\()/i
    ];

    return !sqlPatterns.some(pattern => pattern.test(input));
  }

  static validateXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    return !xssPatterns.some(pattern => pattern.test(input));
  }
}
