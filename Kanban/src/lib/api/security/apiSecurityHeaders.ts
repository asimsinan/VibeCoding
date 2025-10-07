/**
 * API Security Headers - Security headers implementation
 * FR-001: API-First Design - Security headers implementation
 */

export interface SecurityHeadersConfig {
  contentSecurityPolicy: string;
  xFrameOptions: string;
  xContentTypeOptions: string;
  xXssProtection: string;
  referrerPolicy: string;
  strictTransportSecurity: string;
  permissionsPolicy: string;
  crossOriginEmbedderPolicy: string;
  crossOriginOpenerPolicy: string;
  crossOriginResourcePolicy: string;
}

export interface SecurityHeadersOptions {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXSSProtection: boolean;
  enableFrameOptions: boolean;
  enableContentTypeOptions: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
  enableCOEP: boolean;
  enableCOOP: boolean;
  enableCORP: boolean;
  cspDirectives: Record<string, string[]>;
  hstsMaxAge: number;
  hstsIncludeSubDomains: boolean;
  hstsPreload: boolean;
  frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  referrerPolicy: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  permissionsPolicyDirectives: Record<string, string[]>;
}

export class ApiSecurityHeaders {
  private static instance: ApiSecurityHeaders;
  private config: SecurityHeadersOptions;

  constructor() {
    this.config = {
      enableCSP: true,
      enableHSTS: true,
      enableXSSProtection: true,
      enableFrameOptions: true,
      enableContentTypeOptions: true,
      enableReferrerPolicy: true,
      enablePermissionsPolicy: true,
      enableCOEP: false,
      enableCOOP: false,
      enableCORP: false,
      cspDirectives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'https:', 'data:'],
        'connect-src': ["'self'"],
        'media-src': ["'self'"],
        'object-src': ["'none'"],
        'child-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'form-action': ["'self'"],
        'base-uri': ["'self'"],
        'manifest-src': ["'self'"],
        'worker-src': ["'self'"],
        'frame-src': ["'none'"],
      },
      hstsMaxAge: 31536000, // 1 year
      hstsIncludeSubDomains: true,
      hstsPreload: true,
      frameOptions: 'DENY',
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicyDirectives: {
        'camera': [],
        'microphone': [],
        'geolocation': [],
        'payment': [],
        'usb': [],
        'magnetometer': [],
        'gyroscope': [],
        'accelerometer': [],
        'ambient-light-sensor': [],
        'autoplay': [],
        'battery': [],
        'display-capture': [],
        'document-domain': [],
        'encrypted-media': [],
        'fullscreen': [],
        'gamepad': [],
        'midi': [],
        'notifications': [],
        'picture-in-picture': [],
        'publickey-credentials-get': [],
        'screen-wake-lock': [],
        'sync-xhr': [],
        'web-share': [],
        'xr-spatial-tracking': [],
      },
    };
  }

  public static getInstance(): ApiSecurityHeaders {
    if (!ApiSecurityHeaders.instance) {
      ApiSecurityHeaders.instance = new ApiSecurityHeaders();
    }
    return ApiSecurityHeaders.instance;
  }

  public updateConfig(config: Partial<SecurityHeadersOptions>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): SecurityHeadersOptions {
    return { ...this.config };
  }

  public getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.enableCSP) {
      headers['Content-Security-Policy'] = this.buildCSP();
    }

    if (this.config.enableHSTS) {
      headers['Strict-Transport-Security'] = this.buildHSTS();
    }

    if (this.config.enableXSSProtection) {
      headers['X-XSS-Protection'] = '1; mode=block';
    }

    if (this.config.enableFrameOptions) {
      headers['X-Frame-Options'] = this.config.frameOptions;
    }

    if (this.config.enableContentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    if (this.config.enableReferrerPolicy) {
      headers['Referrer-Policy'] = this.config.referrerPolicy;
    }

    if (this.config.enablePermissionsPolicy) {
      headers['Permissions-Policy'] = this.buildPermissionsPolicy();
    }

    if (this.config.enableCOEP) {
      headers['Cross-Origin-Embedder-Policy'] = 'require-corp';
    }

    if (this.config.enableCOOP) {
      headers['Cross-Origin-Opener-Policy'] = 'same-origin';
    }

    if (this.config.enableCORP) {
      headers['Cross-Origin-Resource-Policy'] = 'same-origin';
    }

    // Additional security headers
    headers['X-DNS-Prefetch-Control'] = 'off';
    headers['X-Download-Options'] = 'noopen';
    headers['X-Permitted-Cross-Domain-Policies'] = 'none';

    return headers;
  }

  private buildCSP(): string {
    const directives: string[] = [];
    
    Object.entries(this.config.cspDirectives).forEach(([directive, values]) => {
      if (values.length > 0) {
        directives.push(`${directive} ${values.join(' ')}`);
      } else {
        directives.push(directive);
      }
    });

    return directives.join('; ');
  }

  private buildHSTS(): string {
    let hsts = `max-age=${this.config.hstsMaxAge}`;
    
    if (this.config.hstsIncludeSubDomains) {
      hsts += '; includeSubDomains';
    }
    
    if (this.config.hstsPreload) {
      hsts += '; preload';
    }
    
    return hsts;
  }

  private buildPermissionsPolicy(): string {
    const directives: string[] = [];
    
    Object.entries(this.config.permissionsPolicyDirectives).forEach(([feature, allowlist]) => {
      if (allowlist.length === 0) {
        directives.push(`${feature}=()`);
      } else {
        directives.push(`${feature}=(${allowlist.join(' ')})`);
      }
    });

    return directives.join(', ');
  }

  public middleware() {
    return (req: any, res: any, next: any) => {
      const headers = this.getSecurityHeaders();
      
      Object.entries(headers).forEach(([name, value]) => {
        res.setHeader(name, value);
      });

      next();
    };
  }

  public setDevelopmentMode(): void {
    this.config.enableHSTS = false;
    this.config.cspDirectives = {
      'default-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:', 'http:'],
      'font-src': ["'self'", 'https:', 'http:', 'data:'],
      'connect-src': ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
      'media-src': ["'self'", 'data:', 'https:', 'http:'],
      'object-src': ["'none'"],
      'child-src': ["'self'", 'blob:'],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'", 'blob:'],
      'frame-src': ["'none'"],
    };
  }

  public setProductionMode(): void {
    this.config.enableHSTS = true;
    this.config.enableCSP = true;
    this.config.cspDirectives = {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'https:', 'data:'],
      'connect-src': ["'self'", 'https:'],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'child-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'"],
      'frame-src': ["'none'"],
    };
  }

  public setStagingMode(): void {
    this.config.enableHSTS = true;
    this.config.enableCSP = true;
    this.config.cspDirectives = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'", 'https:', 'data:'],
      'connect-src': ["'self'", 'https:'],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'child-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'"],
      'frame-src': ["'none'"],
    };
  }

  public addCSPDirective(directive: string, values: string[]): void {
    this.config.cspDirectives[directive] = values;
  }

  public removeCSPDirective(directive: string): void {
    delete this.config.cspDirectives[directive];
  }

  public addPermissionsPolicyDirective(feature: string, allowlist: string[]): void {
    this.config.permissionsPolicyDirectives[feature] = allowlist;
  }

  public removePermissionsPolicyDirective(feature: string): void {
    delete this.config.permissionsPolicyDirectives[feature];
  }

  public validateCSP(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for required directives
    const requiredDirectives = ['default-src'];
    requiredDirectives.forEach(directive => {
      if (!this.config.cspDirectives[directive]) {
        errors.push(`Missing required CSP directive: ${directive}`);
      }
    });

    // Check for unsafe directives
    const unsafeDirectives = ['unsafe-inline', 'unsafe-eval'];
    Object.entries(this.config.cspDirectives).forEach(([directive, values]) => {
      values.forEach(value => {
        if (unsafeDirectives.includes(value)) {
          errors.push(`Unsafe CSP value in ${directive}: ${value}`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  public getSecurityReport(): {
    score: number;
    recommendations: string[];
    headers: Record<string, string>;
  } {
    const headers = this.getSecurityHeaders();
    const cspValidation = this.validateCSP();
    const recommendations: string[] = [];
    let score = 100;

    // Check for missing security headers
    const requiredHeaders = [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
    ];

    requiredHeaders.forEach(header => {
      if (!headers[header]) {
        score -= 20;
        recommendations.push(`Add ${header} header`);
      }
    });

    // Check CSP validation
    if (!cspValidation.valid) {
      score -= 30;
      recommendations.push(...cspValidation.errors);
    }

    // Check for unsafe CSP values
    if (headers['Content-Security-Policy']?.includes('unsafe-inline')) {
      score -= 10;
      recommendations.push('Remove unsafe-inline from CSP');
    }

    if (headers['Content-Security-Policy']?.includes('unsafe-eval')) {
      score -= 10;
      recommendations.push('Remove unsafe-eval from CSP');
    }

    return {
      score: Math.max(0, score),
      recommendations,
      headers,
    };
  }
}

// Export singleton instance
export const apiSecurityHeaders = ApiSecurityHeaders.getInstance();
