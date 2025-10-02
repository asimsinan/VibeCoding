// Request Validation Middleware
// Middleware for validating request data in API routes

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';

interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

interface ValidatedRequest extends NextRequest {
  validatedBody?: any;
  validatedQuery?: any;
  validatedParams?: any;
}

class ValidationMiddleware {
  async validate(
    request: NextRequest,
    options: ValidationOptions
  ): Promise<NextResponse | ValidatedRequest> {
    try {
      const validatedRequest = request as ValidatedRequest;

      // Validate request body
      if (options.body) {
        const body = await request.json().catch(() => ({}));
        const bodyResult = options.body.safeParse(body);
        
        if (!bodyResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              details: this.formatZodErrors(bodyResult.error)
            },
            { status: 400 }
          );
        }
        
        validatedRequest.validatedBody = bodyResult.data;
      }

      // Validate query parameters
      if (options.query) {
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        const queryResult = options.query.safeParse(queryParams);
        
        if (!queryResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: 'Query validation failed',
              details: this.formatZodErrors(queryResult.error)
            },
            { status: 400 }
          );
        }
        
        validatedRequest.validatedQuery = queryResult.data;
      }

      // Validate route parameters (if available)
      if (options.params) {
        // Note: Route params would need to be passed separately in Next.js App Router
        // This is a placeholder for future implementation
      }

      return validatedRequest;
    } catch (error) {
      console.error('Validation middleware error:', error);
      return NextResponse.json(
        { success: false, error: 'Validation failed' },
        { status: 500 }
      );
    }
  }

  private formatZodErrors(error: ZodError): any {
    return error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  }
}

// Singleton instance
const validationMiddleware = new ValidationMiddleware();

// Helper function for API routes
export async function withValidation(
  request: NextRequest,
  handler: (request: ValidatedRequest) => Promise<NextResponse>,
  options: ValidationOptions
): Promise<NextResponse> {
  const validationResult = await validationMiddleware.validate(request, options);
  
  if (validationResult instanceof NextResponse) {
    return validationResult; // Error response
  }
  
  return handler(validationResult);
}

// Common validation schemas
export const commonSchemas = {
  pagination: z.object({
    page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).optional().default('10')
  }),
  
  cuid: z.string().regex(/^c[0-9a-z]{25}$/, 'Invalid ID format'),
  
  email: z.string().email('Invalid email format'),
  
  password: z.string().min(8, 'Password must be at least 8 characters'),
  
  price: z.number().positive('Price must be positive').max(999999.99, 'Price too high'),
  
  currency: z.enum(['usd', 'eur', 'gbp', 'cad'], { errorMap: () => ({ message: 'Invalid currency' }) })
};

export type { ValidatedRequest, ValidationOptions };
export default validationMiddleware;
