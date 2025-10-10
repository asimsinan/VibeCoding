export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',

  // Database errors
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_TRANSACTION_ERROR = 'DATABASE_TRANSACTION_ERROR',

  // WebRTC errors
  WEBRTC_INITIALIZATION_ERROR = 'WEBRTC_INITIALIZATION_ERROR',
  WEBRTC_CONNECTION_ERROR = 'WEBRTC_CONNECTION_ERROR',
  WEBRTC_MEDIA_ERROR = 'WEBRTC_MEDIA_ERROR',
  WEBRTC_PERMISSION_ERROR = 'WEBRTC_PERMISSION_ERROR',

  // WebSocket errors
  WEBSOCKET_CONNECTION_ERROR = 'WEBSOCKET_CONNECTION_ERROR',
  WEBSOCKET_MESSAGE_ERROR = 'WEBSOCKET_MESSAGE_ERROR',
  WEBSOCKET_RECONNECTION_ERROR = 'WEBSOCKET_RECONNECTION_ERROR',

  // Room errors
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  ROOM_ACCESS_DENIED = 'ROOM_ACCESS_DENIED',
  ROOM_CREATION_ERROR = 'ROOM_CREATION_ERROR',

  // Participant errors
  PARTICIPANT_NOT_FOUND = 'PARTICIPANT_NOT_FOUND',
  PARTICIPANT_ALREADY_EXISTS = 'PARTICIPANT_ALREADY_EXISTS',
  PARTICIPANT_JOIN_ERROR = 'PARTICIPANT_JOIN_ERROR',
  PARTICIPANT_LEAVE_ERROR = 'PARTICIPANT_LEAVE_ERROR',

  // Chat errors
  MESSAGE_SEND_ERROR = 'MESSAGE_SEND_ERROR',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  MESSAGE_EDIT_ERROR = 'MESSAGE_EDIT_ERROR',
  MESSAGE_DELETE_ERROR = 'MESSAGE_DELETE_ERROR',

  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',

  // File upload errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError extends Error {
  code: ErrorCode;
  severity: ErrorSeverity;
  statusCode: number;
  details?: Record<string, any>;
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
}

import { AppErrorClass } from './app.error';

export interface ErrorLog {
  id: string;
  error: AppErrorClass;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCode: Record<ErrorCode, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByTimeRange: {
    last24Hours: number;
    last7Days: number;
    last30Days: number;
  };
  topErrors: Array<{
    code: ErrorCode;
    count: number;
    lastOccurred: Date;
  }>;
}
