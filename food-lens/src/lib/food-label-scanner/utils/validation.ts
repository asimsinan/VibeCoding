/**
 * Validation Utilities
 * Shared validation functions to consolidate duplicate code
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const Validators = {
  email: (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new ValidationError('Invalid email address format');
    }
    return email.toLowerCase().trim();
  },

  uid: (uid: string): string => {
    if (!uid || uid.trim().length === 0) {
      throw new ValidationError('UID cannot be empty');
    }
    if (uid.length > 128) {
      throw new ValidationError('UID cannot exceed 128 characters');
    }
    return uid.trim();
  },

  displayName: (displayName: string): string => {
    if (!displayName || displayName.trim().length === 0) {
      throw new ValidationError('Display name cannot be empty');
    }
    if (displayName.length < 2) {
      throw new ValidationError('Display name must be at least 2 characters');
    }
    if (displayName.length > 50) {
      throw new ValidationError('Display name cannot exceed 50 characters');
    }
    return displayName.trim();
  },

  language: (language: string): 'en' | 'tr' => {
    if (language !== 'en' && language !== 'tr') {
      throw new ValidationError('Language must be either "en" or "tr"');
    }
    return language as 'en' | 'tr';
  },

  scanId: (scanId: string): string => {
    if (!scanId || scanId.trim().length === 0) {
      throw new ValidationError('Scan ID cannot be empty');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(scanId)) {
      throw new ValidationError('Scan ID must contain only alphanumeric characters, underscores, and hyphens');
    }
    return scanId.trim();
  },

  nonNegative: (value: number, name: string): number => {
    if (value < 0) {
      throw new ValidationError(`${name} cannot be negative`);
    }
    return value;
  },
};

