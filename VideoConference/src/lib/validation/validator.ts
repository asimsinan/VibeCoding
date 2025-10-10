import { z } from 'zod';
import { AppErrorClass } from '../error/app.error';

export class Validator {
  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate UUID format
   */
  static validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate room name
   */
  static validateRoomName(name: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Room name is required');
    } else if (name.trim().length < 2) {
      errors.push('Room name must be at least 2 characters long');
    } else if (name.trim().length > 100) {
      errors.push('Room name must be no more than 100 characters long');
    }

    // Check for potentially harmful content
    if (/<script|javascript:|data:/i.test(name)) {
      errors.push('Room name contains potentially harmful content');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate participant name
   */
  static validateParticipantName(name: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Participant name is required');
    } else if (name.trim().length < 1) {
      errors.push('Participant name must be at least 1 character long');
    } else if (name.trim().length > 50) {
      errors.push('Participant name must be no more than 50 characters long');
    }

    // Check for potentially harmful content
    if (/<script|javascript:|data:/i.test(name)) {
      errors.push('Participant name contains potentially harmful content');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate message content
   */
  static validateMessageContent(content: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push('Message content is required');
    } else if (content.trim().length > 1000) {
      errors.push('Message content must be no more than 1000 characters long');
    }

    // Check for potentially harmful content
    if (/<script|javascript:|data:/i.test(content)) {
      errors.push('Message content contains potentially harmful content');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate URL format
   */
  static validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate WebSocket URL
   */
  static validateWebSocketURL(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'ws:' || parsedUrl.protocol === 'wss:';
    } catch {
      return false;
    }
  }

  /**
   * Validate port number
   */
  static validatePort(port: number): boolean {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  }

  /**
   * Validate file size
   */
  static validateFileSize(size: number, maxSize: number): boolean {
    return size >= 0 && size <= maxSize;
  }

  /**
   * Validate file type
   */
  static validateFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
  }

  /**
   * Validate JSON string
   */
  static validateJSON(jsonString: string): {
    isValid: boolean;
    data?: any;
    error?: string;
  } {
    try {
      const data = JSON.parse(jsonString);
      return { isValid: true, data };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON'
      };
    }
  }

  /**
   * Validate date string
   */
  static validateDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Validate IP address
   */
  static validateIPAddress(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Validate phone number
   */
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Validate timezone
   */
  static validateTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate color hex code
   */
  static validateColorHex(color: string): boolean {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }

  /**
   * Validate slug format
   */
  static validateSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug) && slug.length >= 1 && slug.length <= 100;
  }

  /**
   * Validate JWT token format
   */
  static validateJWTFormat(token: string): boolean {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    return jwtRegex.test(token);
  }

  /**
   * Validate base64 string
   */
  static validateBase64(base64: string): boolean {
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(base64) && base64.length % 4 === 0;
  }

  /**
   * Validate MongoDB ObjectId
   */
  static validateMongoObjectId(id: string): boolean {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  }

  /**
   * Validate credit card number (Luhn algorithm)
   */
  static validateCreditCard(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i] || '0');

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate with Zod schema and throw AppError on failure
   */
  static validateWithZod<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    errorMessage: string = 'Validation failed'
  ): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        throw AppErrorClass.validation(errorMessage, { validationErrors: details });
      }
      throw AppErrorClass.validation(errorMessage);
    }
  }

  /**
   * Safe validate with Zod schema (returns result instead of throwing)
   */
  static safeValidateWithZod<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): {
    success: boolean;
    data?: T;
    errors?: z.ZodError;
  } {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, errors: error };
      }
      return { success: false };
    }
  }

  /**
   * Validate array of items
   */
  static validateArray<T>(
    items: unknown[],
    validator: (item: unknown) => { isValid: boolean; errors: string[] },
    maxLength?: number
  ): {
    isValid: boolean;
    errors: string[];
    validItems: T[];
  } {
    const errors: string[] = [];
    const validItems: T[] = [];

    if (maxLength && items.length > maxLength) {
      errors.push(`Array must contain no more than ${maxLength} items`);
    }

    items.forEach((item, index) => {
      const result = validator(item);
      if (result.isValid) {
        validItems.push(item as T);
      } else {
        errors.push(`Item at index ${index}: ${result.errors.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validItems
    };
  }

  /**
   * Validate object properties
   */
  static validateObjectProperties(
    obj: Record<string, any>,
    requiredProperties: string[],
    optionalProperties: string[] = []
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const allProperties = [...requiredProperties, ...optionalProperties];
    const objKeys = Object.keys(obj);

    // Check for required properties
    requiredProperties.forEach(prop => {
      if (!(prop in obj) || obj[prop] === undefined || obj[prop] === null) {
        errors.push(`Required property '${prop}' is missing`);
      }
    });

    // Check for unknown properties
    objKeys.forEach(key => {
      if (!allProperties.includes(key)) {
        errors.push(`Unknown property '${key}'`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate numeric range
   */
  static validateNumericRange(
    value: number,
    min: number,
    max: number,
    fieldName: string = 'Value'
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (value < min) {
      errors.push(`${fieldName} must be at least ${min}`);
    }

    if (value > max) {
      errors.push(`${fieldName} must be no more than ${max}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate string length
   */
  static validateStringLength(
    str: string,
    minLength: number,
    maxLength: number,
    fieldName: string = 'String'
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (str.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters long`);
    }

    if (str.length > maxLength) {
      errors.push(`${fieldName} must be no more than ${maxLength} characters long`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
