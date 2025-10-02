import { NextRequest } from 'next/server';

export interface ApiVersion {
  version: string;
  supported: boolean;
  deprecated: boolean;
  deprecationDate?: string;
  sunsetDate?: string;
  migrationGuide?: string;
}

export const API_VERSIONS: Record<string, ApiVersion> = {
  'v1': {
    version: 'v1',
    supported: true,
    deprecated: false,
  },
  'v2': {
    version: 'v2',
    supported: false,
    deprecated: false,
  },
};

export function getApiVersion(request: NextRequest): string {
  const pathname = request.nextUrl.pathname;
  const versionMatch = pathname.match(/^\/api\/(v\d+)/);
  
  if (versionMatch && versionMatch[1]) {
    return versionMatch[1];
  }
  
  return 'v1';
}

export function validateApiVersion(version: string): boolean {
  return version in API_VERSIONS && (API_VERSIONS[version]?.supported ?? false);
}

export function getVersionHeaders(version: string): Record<string, string> {
  const apiVersion = API_VERSIONS[version];
  
  if (!apiVersion) {
    return {
      'API-Version': version,
      'API-Supported': 'false',
    };
  }
  
  const headers: Record<string, string> = {
    'API-Version': version,
    'API-Supported': apiVersion.supported.toString(),
  };
  
  if (apiVersion.deprecated) {
    headers['API-Deprecated'] = 'true';
    if (apiVersion.deprecationDate) {
      headers['API-Deprecation-Date'] = apiVersion.deprecationDate;
    }
    if (apiVersion.sunsetDate) {
      headers['API-Sunset-Date'] = apiVersion.sunsetDate;
    }
    if (apiVersion.migrationGuide) {
      headers['API-Migration-Guide'] = apiVersion.migrationGuide;
    }
  }
  
  return headers;
}

export function handleVersionError(version: string): { error: any; status: number } {
  const apiVersion = API_VERSIONS[version];
  
  if (!apiVersion) {
    return {
      error: {
        error: 'Unsupported API version',
        message: `API version ${version} is not supported`,
        supportedVersions: Object.keys(API_VERSIONS).filter(v => API_VERSIONS[v]?.supported),
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
      status: 400
    };
  }
  
  if (!apiVersion.supported) {
    return {
      error: {
        error: 'Unsupported API version',
        message: `API version ${version} is not supported`,
        supportedVersions: Object.keys(API_VERSIONS).filter(v => API_VERSIONS[v]?.supported),
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
      status: 400
    };
  }
  
  if (apiVersion.deprecated) {
    return {
      error: {
        error: 'Deprecated API version',
        message: `API version ${version} is deprecated`,
        deprecationDate: apiVersion.deprecationDate,
        sunsetDate: apiVersion.sunsetDate,
        migrationGuide: apiVersion.migrationGuide,
        timestamp: new Date().toISOString(),
        version: 'v1',
      },
      status: 410
    };
  }
  
  return {
    error: {
      error: 'Unknown API version error',
      message: 'An unknown error occurred with API version validation',
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
    status: 500
  };
}

export function withVersioning(handler: (request: NextRequest, version: string) => Promise<any>) {
  return async (request: NextRequest): Promise<any> => {
    const version = getApiVersion(request);
    
    if (!validateApiVersion(version)) {
      return handleVersionError(version);
    }
    
    const response = await handler(request, version);
    
    const versionHeaders = getVersionHeaders(version);
    Object.entries(versionHeaders).forEach(([key, value]) => {
      if (response.headers) {
        response.headers.set(key, value);
      }
    });
    
    return response;
  };
}

export function getVersionInfo(): Record<string, ApiVersion> {
  return API_VERSIONS;
}

export function getSupportedVersions(): string[] {
  return Object.keys(API_VERSIONS).filter(version => API_VERSIONS[version]?.supported);
}

export function getDeprecatedVersions(): string[] {
  return Object.keys(API_VERSIONS).filter(version => API_VERSIONS[version]?.deprecated);
}
