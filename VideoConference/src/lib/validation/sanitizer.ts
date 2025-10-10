import { AppErrorClass } from '../error/app.error';

export class Sanitizer {
  /**
   * Sanitize HTML content to prevent XSS
   */
  static sanitizeHTML(html: string): string {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize text content (remove HTML tags and dangerous characters)
   */
  static sanitizeText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>]/g, '') // Remove remaining angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Sanitize user input for database storage
   */
  static sanitizeForDatabase(input: string): string {
    return input
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\0/g, '') // Remove null bytes
      .trim();
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid characters with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, '') // Remove leading/trailing underscores
      .substring(0, 255); // Limit length
  }

  /**
   * Sanitize URL
   */
  static sanitizeURL(url: string): string {
    try {
      const parsedUrl = new URL(url);
      
      // Only allow http and https protocols
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }

      return parsedUrl.toString();
    } catch {
      throw AppErrorClass.validation('Invalid URL format');
    }
  }

  /**
   * Sanitize email address
   */
  static sanitizeEmail(email: string): string {
    return email
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '') // Remove whitespace
      .replace(/[^\w@.-]/g, ''); // Remove invalid characters
  }

  /**
   * Sanitize phone number
   */
  static sanitizePhoneNumber(phone: string): string {
    return phone
      .replace(/\D/g, '') // Remove non-digits
      .replace(/^1/, '') // Remove leading 1 for US numbers
      .substring(0, 10); // Limit to 10 digits
  }

  /**
   * Sanitize JSON string
   */
  static sanitizeJSON(jsonString: string): string {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed);
    } catch {
      throw AppErrorClass.validation('Invalid JSON format');
    }
  }

  /**
   * Sanitize SQL query parameters
   */
  static sanitizeSQLParameter(param: any): string {
    if (typeof param === 'string') {
      return param
        .replace(/'/g, "''") // Escape single quotes
        .replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/\0/g, '') // Remove null bytes
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
    }
    return String(param);
  }

  /**
   * Sanitize HTML attributes
   */
  static sanitizeHTMLAttributes(attributes: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const allowedAttributes = [
      'class', 'id', 'title', 'alt', 'src', 'href', 'target', 'rel',
      'type', 'value', 'placeholder', 'disabled', 'readonly', 'required'
    ];

    Object.entries(attributes).forEach(([key, value]) => {
      if (allowedAttributes.includes(key.toLowerCase())) {
        sanitized[key] = this.sanitizeText(value);
      }
    });

    return sanitized;
  }

  /**
   * Sanitize CSS
   */
  static sanitizeCSS(css: string): string {
    return css
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/expression\s*\(/gi, '') // Remove expression() functions
      .replace(/url\s*\(/gi, '') // Remove url() functions
      .replace(/@import/gi, '') // Remove @import statements
      .replace(/behavior\s*:/gi, '') // Remove behavior property
      .replace(/binding\s*:/gi, '') // Remove binding property
      .replace(/moz-binding/gi, '') // Remove moz-binding property
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
  }

  /**
   * Sanitize JavaScript code (basic)
   */
  static sanitizeJavaScript(js: string): string {
    return js
      .replace(/eval\s*\(/gi, '') // Remove eval() calls
      .replace(/Function\s*\(/gi, '') // Remove Function() constructor
      .replace(/setTimeout\s*\(/gi, '') // Remove setTimeout() calls
      .replace(/setInterval\s*\(/gi, '') // Remove setInterval() calls
      .replace(/document\.write/gi, '') // Remove document.write calls
      .replace(/innerHTML/gi, '') // Remove innerHTML assignments
      .replace(/outerHTML/gi, '') // Remove outerHTML assignments
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
  }

  /**
   * Sanitize file path
   */
  static sanitizeFilePath(filePath: string): string {
    return filePath
      .replace(/\.\./g, '') // Remove parent directory references
      .replace(/[\/\\]/g, '/') // Normalize path separators
      .replace(/\/+/g, '/') // Remove multiple slashes
      .replace(/^\/+/, '') // Remove leading slashes
      .replace(/\/+$/, '') // Remove trailing slashes
      .replace(/[<>:"|?*]/g, '_') // Replace invalid characters
      .substring(0, 260); // Limit length
  }

  /**
   * Sanitize XML content
   */
  static sanitizeXML(xml: string): string {
    return xml
      .replace(/<!DOCTYPE[^>]*>/gi, '') // Remove DOCTYPE declarations
      .replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '') // Remove CDATA sections
      .replace(/<!--[\s\S]*?-->/gi, '') // Remove comments
      .replace(/<\?[\s\S]*?\?>/gi, '') // Remove processing instructions
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
  }

  /**
   * Sanitize markdown content
   */
  static sanitizeMarkdown(markdown: string): string {
    return markdown
      .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '') // Remove iframe tags
      .replace(/<object[\s\S]*?<\/object>/gi, '') // Remove object tags
      .replace(/<embed[\s\S]*?>/gi, '') // Remove embed tags
      .replace(/<applet[\s\S]*?<\/applet>/gi, '') // Remove applet tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  }

  /**
   * Sanitize user agent string
   */
  static sanitizeUserAgent(userAgent: string): string {
    return userAgent
      .substring(0, 500) // Limit length
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/[<>]/g, ''); // Remove angle brackets
  }

  /**
   * Sanitize search query
   */
  static sanitizeSearchQuery(query: string): string {
    return query
      .trim()
      .substring(0, 200) // Limit length
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
  }

  /**
   * Sanitize log message
   */
  static sanitizeLogMessage(message: string): string {
    return message
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\n/g, '\\n') // Escape newlines
      .replace(/\r/g, '\\r') // Escape carriage returns
      .replace(/\t/g, '\\t') // Escape tabs
      .substring(0, 1000); // Limit length
  }

  /**
   * Sanitize configuration value
   */
  static sanitizeConfigValue(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeText(value);
    }
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(item => this.sanitizeConfigValue(item));
      }
      const sanitized: Record<string, any> = {};
      Object.entries(value).forEach(([key, val]) => {
        sanitized[this.sanitizeText(key)] = this.sanitizeConfigValue(val);
      });
      return sanitized;
    }
    return value;
  }

  /**
   * Sanitize error message for logging
   */
  static sanitizeErrorMessage(message: string): string {
    return message
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 500); // Limit length
  }

  /**
   * Sanitize object properties recursively
   */
  static sanitizeObject(obj: any, maxDepth: number = 10): any {
    if (maxDepth <= 0) {
      return '[MAX_DEPTH_REACHED]';
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, maxDepth - 1));
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      Object.entries(obj).forEach(([key, value]) => {
        const sanitizedKey = this.sanitizeText(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value, maxDepth - 1);
      });
      return sanitized;
    }

    return obj;
  }

  /**
   * Remove sensitive data from object
   */
  static removeSensitiveData(obj: any, sensitiveKeys: string[] = [
    'password', 'token', 'secret', 'key', 'auth', 'authorization',
    'creditCard', 'ssn', 'socialSecurityNumber', 'apiKey'
  ]): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeSensitiveData(item, sensitiveKeys));
    }

    if (typeof obj === 'object') {
      const cleaned: Record<string, any> = {};
      Object.entries(obj).forEach(([key, value]) => {
        if (sensitiveKeys.some(sensitiveKey => 
          key.toLowerCase().includes(sensitiveKey.toLowerCase())
        )) {
          cleaned[key] = '[REDACTED]';
        } else {
          cleaned[key] = this.removeSensitiveData(value, sensitiveKeys);
        }
      });
      return cleaned;
    }

    return obj;
  }
}
