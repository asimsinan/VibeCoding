// Constants
// Shared constants used throughout the application

export const APP_CONFIG = {
  name: 'Marketplace',
  description: 'Your one-stop destination for buying and selling products online',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  retries: 3,
};

export const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  maxPageSize: 100,
  defaultPage: 1,
};

export const FILE_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'text/plain'],
};

export const NOTIFICATION_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 100,
};

export const CACHE_CONFIG = {
  ttl: 300, // 5 minutes
  maxSize: 1000,
};

export const VALIDATION_CONFIG = {
  minPasswordLength: 6,
  maxPasswordLength: 128,
  minUsernameLength: 3,
  maxUsernameLength: 50,
  minProductTitleLength: 3,
  maxProductTitleLength: 200,
  minProductDescriptionLength: 10,
  maxProductDescriptionLength: 2000,
};