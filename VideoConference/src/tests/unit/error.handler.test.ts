import { ErrorHandler } from '../../lib/error/error.handler';
import { AppErrorClass } from '../../lib/error/app.error';
import { ErrorCode, ErrorSeverity } from '../../lib/error/error.types';
import { NextRequest } from 'next/server';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
    // Clear logs and metrics
    (errorHandler as any).errorLogs.clear();
    (errorHandler as any).errorMetrics.clear();
    (errorHandler as any).severityMetrics.clear();
  });

  describe('handleError', () => {
    it('should handle AppError correctly', () => {
      const appError = new AppErrorClass(
        'Test error',
        ErrorCode.VALIDATION_ERROR,
        ErrorSeverity.LOW,
        400
      );

      const result = errorHandler.handleError(appError);

      expect(result).toBe(appError);
      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(result.severity).toBe(ErrorSeverity.LOW);
    });

    it('should convert regular Error to AppError', () => {
      const regularError = new Error('Regular error');

      const result = errorHandler.handleError(regularError);

      expect(result).toBeInstanceOf(AppErrorClass);
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(result.message).toBe('Regular error');
    });

    it('should add context to error', () => {
      const appError = new AppErrorClass('Test error', ErrorCode.VALIDATION_ERROR);
      const context = {
        userId: 'user-123',
        sessionId: 'session-456',
        requestId: 'request-789'
      };

      const result = errorHandler.handleError(appError, context);

      expect(result.context).toEqual(expect.objectContaining(context));
    });

    it('should update metrics', () => {
      const appError = new AppErrorClass('Test error', ErrorCode.VALIDATION_ERROR);
      
      errorHandler.handleError(appError);
      
      const metrics = errorHandler.getMetrics();
      expect(metrics.errorsByCode[ErrorCode.VALIDATION_ERROR]).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.LOW]).toBe(1);
    });
  });

  describe('handleApiError', () => {
    it('should return proper API response for AppError', () => {
      const appError = new AppErrorClass(
        'Test error',
        ErrorCode.VALIDATION_ERROR,
        ErrorSeverity.LOW,
        400
      );

      const response = errorHandler.handleApiError(appError);

      expect(response.status).toBe(400);
    });

    it('should return proper API response for regular Error', () => {
      const regularError = new Error('Regular error');

      const response = errorHandler.handleApiError(regularError);

      expect(response.status).toBe(500);
    });

    it('should include request ID in response', () => {
      const appError = new AppErrorClass('Test error', ErrorCode.VALIDATION_ERROR);
      const context = { requestId: 'test-request-id' };

      const response = errorHandler.handleApiError(appError, undefined, context);

      expect(response.headers.get('X-Request-ID')).toBe('test-request-id');
    });
  });

  describe('getMetrics', () => {
    it('should return correct metrics', () => {
      const appError1 = new AppErrorClass('Error 1', ErrorCode.VALIDATION_ERROR);
      const appError2 = new AppErrorClass('Error 2', ErrorCode.AUTHENTICATION_ERROR);
      const appError3 = new AppErrorClass('Error 3', ErrorCode.VALIDATION_ERROR);

      errorHandler.handleError(appError1);
      errorHandler.handleError(appError2);
      errorHandler.handleError(appError3);

      const metrics = errorHandler.getMetrics();

      expect(metrics.totalErrors).toBe(3);
      expect(metrics.errorsByCode[ErrorCode.VALIDATION_ERROR]).toBe(2);
      expect(metrics.errorsBySeverity[ErrorSeverity.LOW]).toBe(2);
      expect(metrics.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(1);
    });
  });

  describe('getErrorLogs', () => {
    it('should return error logs', () => {
      const appError = new AppErrorClass('Test error', ErrorCode.VALIDATION_ERROR);
      
      errorHandler.handleError(appError);
      
      const logs = errorHandler.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].error).toBe(appError);
    });

    it('should limit number of logs returned', () => {
      // Create multiple errors
      for (let i = 0; i < 5; i++) {
        const appError = new AppErrorClass(`Error ${i}`, ErrorCode.VALIDATION_ERROR);
        errorHandler.handleError(appError);
      }

      const logs = errorHandler.getErrorLogs(3);
      expect(logs).toHaveLength(3);
    });
  });

  describe('resolveError', () => {
    it('should resolve error successfully', () => {
      const appError = new AppErrorClass('Test error', ErrorCode.VALIDATION_ERROR);
      
      errorHandler.handleError(appError);
      const logs = errorHandler.getErrorLogs();
      const errorId = logs[0].id;

      const result = errorHandler.resolveError(errorId, 'admin-user');

      expect(result).toBe(true);
      expect(logs[0].resolved).toBe(true);
      expect(logs[0].resolvedBy).toBe('admin-user');
      expect(logs[0].resolvedAt).toBeDefined();
    });

    it('should return false for non-existent error', () => {
      const result = errorHandler.resolveError('non-existent-id', 'admin-user');
      expect(result).toBe(false);
    });
  });

  describe('createRequestId', () => {
    it('should create unique request IDs', () => {
      const id1 = errorHandler.createRequestId();
      const id2 = errorHandler.createRequestId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('wrapAsync', () => {
    it('should wrap async function successfully', async () => {
      const asyncFn = async () => 'success';
      const result = await errorHandler.wrapAsync(asyncFn);
      expect(result).toBe('success');
    });

    it('should handle async function errors', async () => {
      const asyncFn = async () => {
        throw new Error('Async error');
      };

      await expect(errorHandler.wrapAsync(asyncFn)).rejects.toThrow();
    });
  });

  describe('wrapSync', () => {
    it('should wrap sync function successfully', () => {
      const syncFn = () => 'success';
      const result = errorHandler.wrapSync(syncFn);
      expect(result).toBe('success');
    });

    it('should handle sync function errors', () => {
      const syncFn = () => {
        throw new Error('Sync error');
      };

      expect(() => errorHandler.wrapSync(syncFn)).toThrow();
    });
  });

  describe('clearOldLogs', () => {
    it('should clear old logs', () => {
      // Create an old error
      const oldError = new AppErrorClass('Old error', ErrorCode.VALIDATION_ERROR);
      (oldError as any).timestamp = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
      
      errorHandler.handleError(oldError);

      // Create a recent error
      const recentError = new AppErrorClass('Recent error', ErrorCode.VALIDATION_ERROR);
      errorHandler.handleError(recentError);

      const clearedCount = errorHandler.clearOldLogs(30);
      
      expect(clearedCount).toBe(1);
      
      const remainingLogs = errorHandler.getErrorLogs();
      expect(remainingLogs).toHaveLength(1);
      expect(remainingLogs[0].error.message).toBe('Recent error');
    });
  });
});
