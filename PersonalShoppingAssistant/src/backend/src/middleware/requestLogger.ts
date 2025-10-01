/**
 * Request Logger Middleware
 * TASK-014: Express Server Setup - FR-001 through FR-007
 * 
 * This middleware logs all incoming requests with details like
 * method, URL, response time, status code, and user agent.
 */

import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request details
  console.log(`📥 ${req.method} ${req.url} - ${req.ip} - ${req.get('User-Agent') || 'Unknown'} - ${timestamp}`);

  // Override res.end to log response details
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Choose emoji based on status code
    let statusEmoji = '📤';
    if (statusCode >= 200 && statusCode < 300) {
      statusEmoji = '✅';
    } else if (statusCode >= 300 && statusCode < 400) {
      statusEmoji = '🔄';
    } else if (statusCode >= 400 && statusCode < 500) {
      statusEmoji = '❌';
    } else if (statusCode >= 500) {
      statusEmoji = '💥';
    }

    console.log(`${statusEmoji} ${req.method} ${req.url} - ${statusCode} - ${duration}ms - ${timestamp}`);
    
    // Call original end method
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};
