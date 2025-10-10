import { NextRequest, NextResponse } from 'next/server';
import { Validator } from './validator';
import { Sanitizer } from './sanitizer';
import { AppErrorClass } from '../error/app.error';
import { ErrorCode } from '../error/error.types';
import { z } from 'zod';

export class ValidationMiddleware {
  /**
   * Validate request body with Zod schema
   */
  static validateBody<T>(
    schema: z.ZodSchema<T>,
    errorMessage: string = 'Invalid request body'
  ) {
    return async (request: NextRequest): Promise<T> => {
      try {
        const body = await request.json();
        return Validator.validateWithZod(schema, body, errorMessage);
      } catch (error) {
        if (error instanceof AppErrorClass) {
          throw error;
        }
        throw AppErrorClass.validation('Invalid JSON in request body');
      }
    };
  }

  /**
   * Validate query parameters with Zod schema
   */
  static validateQuery<T>(
    schema: z.ZodSchema<T>,
    errorMessage: string = 'Invalid query parameters'
  ) {
    return (request: NextRequest): T => {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      return Validator.validateWithZod(schema, queryParams, errorMessage);
    };
  }

  /**
   * Validate headers with Zod schema
   */
  static validateHeaders<T>(
    schema: z.ZodSchema<T>,
    errorMessage: string = 'Invalid headers'
  ) {
    return (request: NextRequest): T => {
      const headers = Object.fromEntries(request.headers.entries());
      return Validator.validateWithZod(schema, headers, errorMessage);
    };
  }

  /**
   * Sanitize request body
   */
  static sanitizeBody() {
    return async (request: NextRequest): Promise<NextRequest> => {
      try {
        const body = await request.json();
        const sanitizedBody = Sanitizer.sanitizeObject(body);
        
        // Create new request with sanitized body
        const newRequest = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: JSON.stringify(sanitizedBody)
        });
        
        return newRequest;
      } catch (error) {
        throw AppErrorClass.validation('Failed to sanitize request body');
      }
    };
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): void {
    if (!Validator.validateEmail(email)) {
      throw AppErrorClass.validation('Invalid email format');
    }
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): void {
    const result = Validator.validatePassword(password);
    if (!result.isValid) {
      throw AppErrorClass.validation('Password does not meet requirements', {
        passwordErrors: result.errors
      });
    }
  }

  /**
   * Validate UUID format
   */
  static validateUUID(uuid: string, fieldName: string = 'ID'): void {
    if (!Validator.validateUUID(uuid)) {
      throw AppErrorClass.validation(`Invalid ${fieldName} format`);
    }
  }

  /**
   * Validate room name
   */
  static validateRoomName(name: string): void {
    const result = Validator.validateRoomName(name);
    if (!result.isValid) {
      throw AppErrorClass.validation('Invalid room name', {
        roomNameErrors: result.errors
      });
    }
  }

  /**
   * Validate participant name
   */
  static validateParticipantName(name: string): void {
    const result = Validator.validateParticipantName(name);
    if (!result.isValid) {
      throw AppErrorClass.validation('Invalid participant name', {
        participantNameErrors: result.errors
      });
    }
  }

  /**
   * Validate message content
   */
  static validateMessageContent(content: string): void {
    const result = Validator.validateMessageContent(content);
    if (!result.isValid) {
      throw AppErrorClass.validation('Invalid message content', {
        messageContentErrors: result.errors
      });
    }
  }

  /**
   * Validate and sanitize message content
   */
  static validateAndSanitizeMessageContent(content: string): string {
    this.validateMessageContent(content);
    return Sanitizer.sanitizeText(content);
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(
    file: File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      maxSizeMB?: number;
    } = {}
  ): void {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSizeMB = 10
    } = options;

    if (file.size > maxSize) {
      throw AppErrorClass.validation(`File size must be no more than ${maxSizeMB}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw AppErrorClass.validation(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    const sanitizedFilename = Sanitizer.sanitizeFilename(file.name);
    if (sanitizedFilename !== file.name) {
      throw AppErrorClass.validation('Invalid filename format');
    }
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(
    page: number,
    limit: number,
    maxLimit: number = 100
  ): { page: number; limit: number; offset: number } {
    const pageResult = Validator.validateNumericRange(page, 1, 1000, 'Page');
    if (!pageResult.isValid) {
      throw AppErrorClass.validation('Invalid pagination', { pageErrors: pageResult.errors });
    }

    const limitResult = Validator.validateNumericRange(limit, 1, maxLimit, 'Limit');
    if (!limitResult.isValid) {
      throw AppErrorClass.validation('Invalid pagination', { limitErrors: limitResult.errors });
    }

    return {
      page: Math.floor(page),
      limit: Math.floor(limit),
      offset: (Math.floor(page) - 1) * Math.floor(limit)
    };
  }

  /**
   * Validate sort parameters
   */
  static validateSort(
    sortBy: string,
    sortOrder: string,
    allowedFields: string[] = []
  ): { sortBy: string; sortOrder: 'asc' | 'desc' } {
    if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
      throw AppErrorClass.validation(`Sort field must be one of: ${allowedFields.join(', ')}`);
    }

    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      throw AppErrorClass.validation('Sort order must be "asc" or "desc"');
    }

    return {
      sortBy: Sanitizer.sanitizeText(sortBy),
      sortOrder: sortOrder as 'asc' | 'desc'
    };
  }

  /**
   * Validate search query
   */
  static validateSearchQuery(query: string): string {
    if (!query || query.trim().length === 0) {
      throw AppErrorClass.validation('Search query is required');
    }

    const sanitizedQuery = Sanitizer.sanitizeSearchQuery(query);
    if (sanitizedQuery.length < 2) {
      throw AppErrorClass.validation('Search query must be at least 2 characters long');
    }

    return sanitizedQuery;
  }

  /**
   * Validate date range
   */
  static validateDateRange(
    startDate: string,
    endDate: string
  ): { startDate: Date; endDate: Date } {
    if (!Validator.validateDate(startDate)) {
      throw AppErrorClass.validation('Invalid start date format');
    }

    if (!Validator.validateDate(endDate)) {
      throw AppErrorClass.validation('Invalid end date format');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw AppErrorClass.validation('Start date must be before end date');
    }

    const now = new Date();
    if (start > now) {
      throw AppErrorClass.validation('Start date cannot be in the future');
    }

    return { startDate: start, endDate: end };
  }

  /**
   * Validate rate limit parameters
   */
  static validateRateLimit(
    requests: number,
    windowMs: number
  ): { requests: number; windowMs: number } {
    const requestsResult = Validator.validateNumericRange(requests, 1, 10000, 'Requests');
    if (!requestsResult.isValid) {
      throw AppErrorClass.validation('Invalid rate limit', { requestsErrors: requestsResult.errors });
    }

    const windowResult = Validator.validateNumericRange(windowMs, 1000, 86400000, 'Window'); // 1s to 24h
    if (!windowResult.isValid) {
      throw AppErrorClass.validation('Invalid rate limit', { windowErrors: windowResult.errors });
    }

    return {
      requests: Math.floor(requests),
      windowMs: Math.floor(windowMs)
    };
  }

  /**
   * Validate WebSocket URL
   */
  static validateWebSocketURL(url: string): string {
    if (!Validator.validateWebSocketURL(url)) {
      throw AppErrorClass.validation('Invalid WebSocket URL format');
    }

    return Sanitizer.sanitizeURL(url);
  }

  /**
   * Validate configuration object
   */
  static validateConfig<T>(
    config: any,
    schema: z.ZodSchema<T>,
    errorMessage: string = 'Invalid configuration'
  ): T {
    const sanitizedConfig = Sanitizer.sanitizeConfigValue(config);
    return Validator.validateWithZod(schema, sanitizedConfig, errorMessage);
  }

  /**
   * Validate and sanitize user input
   */
  static validateAndSanitizeUserInput(
    input: string,
    options: {
      maxLength?: number;
      allowHTML?: boolean;
      required?: boolean;
    } = {}
  ): string {
    const { maxLength = 1000, allowHTML = false, required = true } = options;

    if (required && (!input || input.trim().length === 0)) {
      throw AppErrorClass.validation('Input is required');
    }

    if (input && input.length > maxLength) {
      throw AppErrorClass.validation(`Input must be no more than ${maxLength} characters long`);
    }

    if (allowHTML) {
      return Sanitizer.sanitizeHTML(input);
    } else {
      return Sanitizer.sanitizeText(input);
    }
  }

  /**
   * Create validation error response
   */
  static createValidationErrorResponse(
    errors: string[],
    requestId?: string
  ): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: { validationErrors: errors },
        timestamp: new Date().toISOString(),
        requestId
      },
      { 
        status: 400,
        headers: {
          'X-Error-Code': ErrorCode.VALIDATION_ERROR,
          'X-Request-ID': requestId || 'unknown'
        }
      }
    );
  }

  /**
   * Validate request ID format
   */
  static validateRequestId(requestId: string): void {
    if (!requestId || requestId.length !== 32) {
      throw AppErrorClass.validation('Invalid request ID format');
    }

    if (!/^[a-f0-9]{32}$/.test(requestId)) {
      throw AppErrorClass.validation('Invalid request ID format');
    }
  }

  /**
   * Validate session ID format
   */
  static validateSessionId(sessionId: string): void {
    if (!sessionId || sessionId.length < 16) {
      throw AppErrorClass.validation('Invalid session ID format');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(sessionId)) {
      throw AppErrorClass.validation('Invalid session ID format');
    }
  }
}
