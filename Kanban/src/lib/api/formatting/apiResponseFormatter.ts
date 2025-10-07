/**
 * API Response Formatter - Standardize API responses
 * FR-001: API-First Design - Response formatting implementation
 */

import { ResponseMeta, PaginationMeta, ErrorResponse, ValidationErrorResponse } from '../../../contracts/types/api.types';

export interface ApiResponseOptions {
  version?: string;
  includeMetadata?: boolean;
  includePagination?: boolean;
  includeTiming?: boolean;
  includeRequestId?: boolean;
  requestId?: string;
  startTime?: number;
}

export class ApiResponseFormatter {
  private static instance: ApiResponseFormatter;
  private defaultOptions: ApiResponseOptions;

  constructor() {
    this.defaultOptions = {
      version: '1.0.0',
      includeMetadata: true,
      includePagination: false,
      includeTiming: false,
      includeRequestId: true,
    };
  }

  public static getInstance(): ApiResponseFormatter {
    if (!ApiResponseFormatter.instance) {
      ApiResponseFormatter.instance = new ApiResponseFormatter();
    }
    return ApiResponseFormatter.instance;
  }

  public formatSuccessResponse<T>(
    data: T,
    options: Partial<ApiResponseOptions> = {}
  ): { data: T; meta: ResponseMeta } {
    const opts = { ...this.defaultOptions, ...options };
    const meta = this.createResponseMeta(opts);
    
    return {
      data,
      meta,
    };
  }

  public formatPaginatedResponse<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    options: Partial<ApiResponseOptions> = {}
  ): { data: T[]; meta: ResponseMeta } {
    const opts = { ...this.defaultOptions, ...options, includePagination: true };
    const meta = this.createPaginationMeta(pagination, opts);
    
    return {
      data,
      meta,
    };
  }

  public formatErrorResponse(
    error: {
      code: string;
      message: string;
      details?: Record<string, any>;
    },
    statusCode: number,
    options: Partial<ApiResponseOptions> = {}
  ): ErrorResponse {
    const opts = { ...this.defaultOptions, ...options };
    const meta = this.createResponseMeta(opts);
    
    return {
      error: error.code,
      message: error.message,
      details: error.details,
      timestamp: meta.timestamp,
      statusCode: statusCode,
    };
  }

  public formatValidationErrorResponse(
    errors: Array<{
      field: string;
      message: string;
      value?: string;
    }>,
    options: Partial<ApiResponseOptions> = {}
  ): ValidationErrorResponse {
    const opts = { ...this.defaultOptions, ...options };
    const meta = this.createResponseMeta(opts);
    
    return {
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors.reduce((acc, error) => {
        acc[error.field] = [error.message];
        return acc;
      }, {} as Record<string, string[]>),
      timestamp: meta.timestamp,
      statusCode: 400,
    };
  }

  public formatCreatedResponse<T>(
    data: T,
    location: string,
    options: Partial<ApiResponseOptions> = {}
  ): { data: T; meta: ResponseMeta; location: string } {
    const response = this.formatSuccessResponse(data, options);
    return {
      ...response,
      location,
    };
  }

  public formatNoContentResponse(
    options: Partial<ApiResponseOptions> = {}
  ): { meta: ResponseMeta } {
    const opts = { ...this.defaultOptions, ...options };
    const meta = this.createResponseMeta(opts);
    
    return {
      meta,
    };
  }

  public formatAcceptedResponse<T>(
    data: T,
    status: string,
    options: Partial<ApiResponseOptions> = {}
  ): { data: T; meta: ResponseMeta; status: string } {
    const response = this.formatSuccessResponse(data, options);
    return {
      ...response,
      status,
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createResponseMeta(options: ApiResponseOptions): ResponseMeta {
    const meta: ResponseMeta = {
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
      version: options.version || '1.0.0',
    };

    if (options.includeRequestId && options.requestId) {
      meta.requestId = options.requestId;
    }

    if (options.includeTiming && options.startTime) {
      meta.duration = Date.now() - options.startTime;
    }

    return meta;
  }

  private createPaginationMeta(
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    options: ApiResponseOptions
  ): ResponseMeta {
    const meta = this.createResponseMeta(options);
    
    return {
      ...meta,
      pagination: {
        offset: pagination.page * pagination.limit,
        limit: pagination.limit,
        total: pagination.total,
        has_more: pagination.hasNext,
      },
    };
  }

  public formatListResponse<T>(
    items: T[],
    options: Partial<ApiResponseOptions> = {}
  ): { data: T[]; meta: ResponseMeta; count: number } {
    const response = this.formatSuccessResponse(items, options);
    return {
      ...response,
      count: items.length,
    };
  }

  public formatItemResponse<T>(
    item: T,
    options: Partial<ApiResponseOptions> = {}
  ): { data: T; meta: ResponseMeta } {
    return this.formatSuccessResponse(item, options);
  }

  public formatBulkResponse<T>(
    items: T[],
    created: number,
    updated: number,
    deleted: number,
    errors: Array<{ item: T; error: string }> = [],
    options: Partial<ApiResponseOptions> = {}
  ): {
    data: T[];
    meta: ResponseMeta;
    summary: {
      total: number;
      created: number;
      updated: number;
      deleted: number;
      errors: number;
    };
    errors?: Array<{ item: T; error: string }>;
  } {
    const response = this.formatSuccessResponse(items, options);
    const summary = {
      total: items.length,
      created,
      updated,
      deleted,
      errors: errors.length,
    };

    const result: any = {
      ...response,
      summary,
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    return result;
  }

  public formatSearchResponse<T>(
    items: T[],
    query: string,
    filters: Record<string, any> = {},
    options: Partial<ApiResponseOptions> = {}
  ): {
    data: T[];
    meta: ResponseMeta;
    search: {
      query: string;
      filters: Record<string, any>;
      count: number;
    };
  } {
    const response = this.formatSuccessResponse(items, options);
    return {
      ...response,
      search: {
        query,
        filters,
        count: items.length,
      },
    };
  }

  public formatStreamResponse<T>(
    data: T,
    chunk: number,
    total: number,
    options: Partial<ApiResponseOptions> = {}
  ): {
    data: T;
    meta: ResponseMeta;
    stream: {
      chunk: number;
      total: number;
      progress: number;
    };
  } {
    const response = this.formatSuccessResponse(data, options);
    return {
      ...response,
      stream: {
        chunk,
        total,
        progress: total > 0 ? (chunk / total) * 100 : 0,
      },
    };
  }

  public formatWebhookResponse<T>(
    data: T,
    event: string,
    webhookId: string,
    options: Partial<ApiResponseOptions> = {}
  ): {
    data: T;
    meta: ResponseMeta;
    webhook: {
      event: string;
      webhookId: string;
      timestamp: string;
    };
  } {
    const response = this.formatSuccessResponse(data, options);
    return {
      ...response,
      webhook: {
        event,
        webhookId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  public formatHealthCheckResponse(
    status: 'healthy' | 'degraded' | 'unhealthy',
    checks: Record<string, { status: string; message?: string; duration?: number }> = {},
    options: Partial<ApiResponseOptions> = {}
  ): {
    status: string;
    checks: Record<string, { status: string; message?: string; duration?: number }>;
    meta: ResponseMeta;
  } {
    const response = this.formatSuccessResponse(null as any, options);
    return {
      status,
      checks,
      meta: response.meta,
    };
  }

  public formatMetricsResponse(
    metrics: Record<string, number>,
    period: { start: string; end: string },
    options: Partial<ApiResponseOptions> = {}
  ): {
    metrics: Record<string, number>;
    period: { start: string; end: string };
    meta: ResponseMeta;
  } {
    const response = this.formatSuccessResponse(null as any, options);
    return {
      metrics,
      period,
      meta: response.meta,
    };
  }

  public updateDefaultOptions(options: Partial<ApiResponseOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  public getDefaultOptions(): ApiResponseOptions {
    return { ...this.defaultOptions };
  }
}

// Export singleton instance
export const apiResponseFormatter = ApiResponseFormatter.getInstance();
