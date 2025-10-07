/**
 * API CORS Configuration - Cross-Origin Resource Sharing configuration
 * FR-001: API-First Design - CORS implementation
 */

export interface CorsConfig {
  origin: string | string[] | boolean | ((origin: string | undefined) => boolean);
  methods: string | string[];
  allowedHeaders: string | string[];
  exposedHeaders: string | string[];
  credentials: boolean;
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
}

export interface CorsOptions {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
  preflightContinue: boolean;
  optionsSuccessStatus: number;
}

export class ApiCors {
  private static instance: ApiCors;
  private config: CorsOptions;

  constructor() {
    this.config = {
      allowedOrigins: ['http://localhost:3000', 'https://kanban-app.com'],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Request-ID',
        'X-API-Version',
        'X-Client-Version',
      ],
      exposedHeaders: [
        'X-Request-ID',
        'X-API-Version',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Retry-After',
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 200,
    };
  }

  public static getInstance(): ApiCors {
    if (!ApiCors.instance) {
      ApiCors.instance = new ApiCors();
    }
    return ApiCors.instance;
  }

  public updateConfig(config: Partial<CorsOptions>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): CorsOptions {
    return { ...this.config };
  }

  public isOriginAllowed(origin: string | undefined): boolean {
    if (!origin) return false;
    
    if (this.config.allowedOrigins.includes('*')) return true;
    
    return this.config.allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin === '*') return true;
      if (allowedOrigin === origin) return true;
      
      // Support for wildcard subdomains
      if (allowedOrigin.startsWith('*.')) {
        const domain = allowedOrigin.substring(2);
        return origin.endsWith(domain);
      }
      
      return false;
    });
  }

  public getCorsHeaders(origin: string | undefined): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.isOriginAllowed(origin)) {
      headers['Access-Control-Allow-Origin'] = origin || '*';
    } else {
      headers['Access-Control-Allow-Origin'] = 'null';
    }

    headers['Access-Control-Allow-Methods'] = Array.isArray(this.config.allowedMethods)
      ? this.config.allowedMethods.join(', ')
      : this.config.allowedMethods;

    headers['Access-Control-Allow-Headers'] = Array.isArray(this.config.allowedHeaders)
      ? this.config.allowedHeaders.join(', ')
      : this.config.allowedHeaders;

    if (this.config.exposedHeaders.length > 0) {
      headers['Access-Control-Expose-Headers'] = Array.isArray(this.config.exposedHeaders)
        ? this.config.exposedHeaders.join(', ')
        : this.config.exposedHeaders;
    }

    if (this.config.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    headers['Access-Control-Max-Age'] = this.config.maxAge.toString();

    return headers;
  }

  public handlePreflightRequest(origin: string | undefined): {
    status: number;
    headers: Record<string, string>;
  } {
    const headers = this.getCorsHeaders(origin);
    
    return {
      status: this.config.optionsSuccessStatus,
      headers,
    };
  }

  public handleActualRequest(origin: string | undefined): {
    headers: Record<string, string>;
  } {
    const headers = this.getCorsHeaders(origin);
    
    return {
      headers,
    };
  }

  public middleware() {
    return (req: any, res: any, next: any) => {
      const origin = req.headers.origin;
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        const { status, headers } = this.handlePreflightRequest(origin);
        
        Object.entries(headers).forEach(([name, value]) => {
          res.setHeader(name, value);
        });
        
        if (this.config.preflightContinue) {
          next();
        } else {
          res.status(status).end();
        }
        return;
      }

      // Handle actual requests
      const { headers } = this.handleActualRequest(origin);
      
      Object.entries(headers).forEach(([name, value]) => {
        res.setHeader(name, value);
      });

      next();
    };
  }

  public addAllowedOrigin(origin: string): void {
    if (!this.config.allowedOrigins.includes(origin)) {
      this.config.allowedOrigins.push(origin);
    }
  }

  public removeAllowedOrigin(origin: string): void {
    const index = this.config.allowedOrigins.indexOf(origin);
    if (index > -1) {
      this.config.allowedOrigins.splice(index, 1);
    }
  }

  public addAllowedMethod(method: string): void {
    if (!this.config.allowedMethods.includes(method)) {
      this.config.allowedMethods.push(method);
    }
  }

  public removeAllowedMethod(method: string): void {
    const index = this.config.allowedMethods.indexOf(method);
    if (index > -1) {
      this.config.allowedMethods.splice(index, 1);
    }
  }

  public addAllowedHeader(header: string): void {
    if (!this.config.allowedHeaders.includes(header)) {
      this.config.allowedHeaders.push(header);
    }
  }

  public removeAllowedHeader(header: string): void {
    const index = this.config.allowedHeaders.indexOf(header);
    if (index > -1) {
      this.config.allowedHeaders.splice(index, 1);
    }
  }

  public addExposedHeader(header: string): void {
    if (!this.config.exposedHeaders.includes(header)) {
      this.config.exposedHeaders.push(header);
    }
  }

  public removeExposedHeader(header: string): void {
    const index = this.config.exposedHeaders.indexOf(header);
    if (index > -1) {
      this.config.exposedHeaders.splice(index, 1);
    }
  }

  public validateOrigin(origin: string): boolean {
    return this.isOriginAllowed(origin);
  }

  public getCorsConfig(): CorsConfig {
    return {
      origin: this.config.allowedOrigins,
      methods: this.config.allowedMethods,
      allowedHeaders: this.config.allowedHeaders,
      exposedHeaders: this.config.exposedHeaders,
      credentials: this.config.credentials,
      maxAge: this.config.maxAge,
      preflightContinue: this.config.preflightContinue,
      optionsSuccessStatus: this.config.optionsSuccessStatus,
    };
  }

  public setDevelopmentMode(): void {
    this.config.allowedOrigins = ['*'];
    this.config.credentials = false;
  }

  public setProductionMode(): void {
    this.config.allowedOrigins = ['https://kanban-app.com'];
    this.config.credentials = true;
  }

  public setStagingMode(): void {
    this.config.allowedOrigins = [
      'https://staging.kanban-app.com',
      'https://kanban-app.com',
    ];
    this.config.credentials = true;
  }
}

// Export singleton instance
export const apiCors = ApiCors.getInstance();
