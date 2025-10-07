/**
 * API Versioning - API version management and compatibility
 * FR-001: API-First Design - API versioning implementation
 */

export interface ApiVersion {
  version: string;
  releaseDate: string;
  status: 'stable' | 'deprecated' | 'sunset';
  deprecationDate?: string;
  sunsetDate?: string;
  changes: VersionChange[];
}

export interface VersionChange {
  type: 'breaking' | 'feature' | 'bugfix' | 'deprecation';
  description: string;
  affectedEndpoints?: string[];
  migrationGuide?: string;
}

export interface VersionCompatibility {
  minVersion: string;
  maxVersion: string;
  supportedVersions: string[];
  deprecatedVersions: string[];
  sunsetVersions: string[];
}

export class ApiVersioning {
  private static instance: ApiVersioning;
  private versions: Map<string, ApiVersion> = new Map();
  private compatibility: VersionCompatibility;

  constructor() {
    this.compatibility = {
      minVersion: '1.0.0',
      maxVersion: '2.0.0',
      supportedVersions: ['1.0.0', '1.1.0', '1.2.0'],
      deprecatedVersions: ['0.9.0'],
      sunsetVersions: ['0.8.0'],
    };

    this.initializeVersions();
  }

  public static getInstance(): ApiVersioning {
    if (!ApiVersioning.instance) {
      ApiVersioning.instance = new ApiVersioning();
    }
    return ApiVersioning.instance;
  }

  private initializeVersions(): void {
    // Version 1.0.0 - Initial release
    this.versions.set('1.0.0', {
      version: '1.0.0',
      releaseDate: '2023-01-01',
      status: 'stable',
      changes: [
        {
          type: 'feature',
          description: 'Initial API release with authentication, workspaces, boards, and tasks',
          affectedEndpoints: ['/auth/*', '/workspaces/*', '/boards/*', '/tasks/*'],
        },
      ],
    });

    // Version 1.1.0 - Feature additions
    this.versions.set('1.1.0', {
      version: '1.1.0',
      releaseDate: '2023-02-01',
      status: 'stable',
      changes: [
        {
          type: 'feature',
          description: 'Added real-time updates for tasks and boards',
          affectedEndpoints: ['/tasks/*', '/boards/*'],
        },
        {
          type: 'feature',
          description: 'Added task filtering and search capabilities',
          affectedEndpoints: ['/tasks'],
        },
        {
          type: 'bugfix',
          description: 'Fixed pagination issue in workspace listing',
          affectedEndpoints: ['/workspaces'],
        },
      ],
    });

    // Version 1.2.0 - Enhanced features
    this.versions.set('1.2.0', {
      version: '1.2.0',
      releaseDate: '2023-03-01',
      status: 'stable',
      changes: [
        {
          type: 'feature',
          description: 'Added user management and team collaboration features',
          affectedEndpoints: ['/users/*', '/workspaces/*'],
        },
        {
          type: 'feature',
          description: 'Added advanced task filtering and sorting',
          affectedEndpoints: ['/tasks'],
        },
        {
          type: 'deprecation',
          description: 'Deprecated legacy task status values',
          affectedEndpoints: ['/tasks'],
          migrationGuide: 'Replace "pending" with "todo" and "completed" with "done"',
        },
      ],
    });

    // Version 2.0.0 - Breaking changes
    this.versions.set('2.0.0', {
      version: '2.0.0',
      releaseDate: '2023-06-01',
      status: 'stable',
      changes: [
        {
          type: 'breaking',
          description: 'Changed authentication flow to use JWT tokens instead of session cookies',
          affectedEndpoints: ['/auth/*'],
          migrationGuide: 'Update client to handle JWT tokens in Authorization header',
        },
        {
          type: 'breaking',
          description: 'Restructured task response format',
          affectedEndpoints: ['/tasks/*'],
          migrationGuide: 'Update client to handle new task response structure',
        },
        {
          type: 'feature',
          description: 'Added support for custom fields in tasks',
          affectedEndpoints: ['/tasks/*'],
        },
      ],
    });
  }

  public getVersion(version: string): ApiVersion | undefined {
    return this.versions.get(version);
  }

  public getAllVersions(): ApiVersion[] {
    return Array.from(this.versions.values());
  }

  public getSupportedVersions(): string[] {
    return this.compatibility.supportedVersions;
  }

  public getDeprecatedVersions(): string[] {
    return this.compatibility.deprecatedVersions;
  }

  public getSunsetVersions(): string[] {
    return this.compatibility.sunsetVersions;
  }

  public isVersionSupported(version: string): boolean {
    return this.compatibility.supportedVersions.includes(version);
  }

  public isVersionDeprecated(version: string): boolean {
    return this.compatibility.deprecatedVersions.includes(version);
  }

  public isVersionSunset(version: string): boolean {
    return this.compatibility.sunsetVersions.includes(version);
  }

  public getVersionStatus(version: string): 'supported' | 'deprecated' | 'sunset' | 'unknown' {
    if (this.isVersionSunset(version)) return 'sunset';
    if (this.isVersionDeprecated(version)) return 'deprecated';
    if (this.isVersionSupported(version)) return 'supported';
    return 'unknown';
  }

  public getLatestVersion(): string {
    const versions = this.getAllVersions()
      .filter(v => v.status === 'stable')
      .sort((a, b) => this.compareVersions(b.version, a.version));
    
    return versions[0]?.version || '1.0.0';
  }

  public getVersionHeaders(version: string): Record<string, string> {
    const status = this.getVersionStatus(version);
    const headers: Record<string, string> = {
      'API-Version': version,
      'API-Latest-Version': this.getLatestVersion(),
    };

    if (status === 'deprecated') {
      headers['API-Deprecation-Warning'] = 'This API version is deprecated and will be removed in a future release';
      headers['API-Sunset-Date'] = this.getVersion(version)?.sunsetDate || 'TBD';
    }

    if (status === 'sunset') {
      headers['API-Sunset-Warning'] = 'This API version has been sunset and is no longer supported';
    }

    return headers;
  }

  public validateVersion(version: string): { valid: boolean; error?: string } {
    if (!version) {
      return { valid: false, error: 'API version is required' };
    }

    const status = this.getVersionStatus(version);
    
    if (status === 'unknown') {
      return { valid: false, error: `Unsupported API version: ${version}` };
    }

    if (status === 'sunset') {
      return { valid: false, error: `API version ${version} has been sunset and is no longer supported` };
    }

    return { valid: true };
  }

  public getMigrationGuide(fromVersion: string, toVersion: string): string[] {
    const from = this.getVersion(fromVersion);
    const to = this.getVersion(toVersion);
    
    if (!from || !to) {
      return ['Migration guide not available for the specified versions'];
    }

    const guide: string[] = [];
    
    // Get all changes between versions
    const fromIndex = this.compatibility.supportedVersions.indexOf(fromVersion);
    const toIndex = this.compatibility.supportedVersions.indexOf(toVersion);
    
    if (fromIndex === -1 || toIndex === -1) {
      return ['Migration guide not available for the specified versions'];
    }

    for (let i = fromIndex + 1; i <= toIndex; i++) {
      const version = this.compatibility.supportedVersions[i];
      const versionInfo = this.getVersion(version);
      
      if (versionInfo) {
        versionInfo.changes.forEach(change => {
          if (change.type === 'breaking' || change.type === 'deprecation') {
            guide.push(`Version ${version}: ${change.description}`);
            if (change.migrationGuide) {
              guide.push(`  Migration: ${change.migrationGuide}`);
            }
          }
        });
      }
    }

    return guide.length > 0 ? guide : ['No migration required'];
  }

  public getVersionedEndpoint(baseEndpoint: string, version: string): string {
    const versionedEndpoint = `/v${version.split('.')[0]}/${baseEndpoint.replace(/^\//, '')}`;
    return versionedEndpoint;
  }

  public getVersionFromEndpoint(endpoint: string): string | null {
    const match = endpoint.match(/^\/v(\d+)\//);
    if (match) {
      const majorVersion = match[1];
      // Find the latest version for this major version
      const versions = this.getAllVersions()
        .filter(v => v.version.startsWith(`${majorVersion}.`) && v.status === 'stable')
        .sort((a, b) => this.compareVersions(b.version, a.version));
      
      return versions[0]?.version || null;
    }
    return null;
  }

  public getCompatibilityMatrix(): Record<string, Record<string, boolean>> {
    const matrix: Record<string, Record<string, boolean>> = {};
    const allVersions = this.getAllVersions().map(v => v.version);
    
    allVersions.forEach(fromVersion => {
      matrix[fromVersion] = {};
      allVersions.forEach(toVersion => {
        // Simple compatibility check - in reality, this would be more complex
        matrix[fromVersion][toVersion] = this.isVersionSupported(toVersion);
      });
    });
    
    return matrix;
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  public addVersion(version: ApiVersion): void {
    this.versions.set(version.version, version);
    
    // Update compatibility
    if (version.status === 'stable') {
      if (!this.compatibility.supportedVersions.includes(version.version)) {
        this.compatibility.supportedVersions.push(version.version);
        this.compatibility.supportedVersions.sort((a, b) => this.compareVersions(a, b));
      }
    } else if (version.status === 'deprecated') {
      if (!this.compatibility.deprecatedVersions.includes(version.version)) {
        this.compatibility.deprecatedVersions.push(version.version);
      }
    } else if (version.status === 'sunset') {
      if (!this.compatibility.sunsetVersions.includes(version.version)) {
        this.compatibility.sunsetVersions.push(version.version);
      }
    }
  }

  public deprecateVersion(version: string, deprecationDate: string, sunsetDate?: string): void {
    const versionInfo = this.getVersion(version);
    if (versionInfo) {
      versionInfo.status = 'deprecated';
      versionInfo.deprecationDate = deprecationDate;
      versionInfo.sunsetDate = sunsetDate;
      
      // Move from supported to deprecated
      const supportedIndex = this.compatibility.supportedVersions.indexOf(version);
      if (supportedIndex > -1) {
        this.compatibility.supportedVersions.splice(supportedIndex, 1);
      }
      
      if (!this.compatibility.deprecatedVersions.includes(version)) {
        this.compatibility.deprecatedVersions.push(version);
      }
    }
  }

  public sunsetVersion(version: string, sunsetDate: string): void {
    const versionInfo = this.getVersion(version);
    if (versionInfo) {
      versionInfo.status = 'sunset';
      versionInfo.sunsetDate = sunsetDate;
      
      // Move from deprecated to sunset
      const deprecatedIndex = this.compatibility.deprecatedVersions.indexOf(version);
      if (deprecatedIndex > -1) {
        this.compatibility.deprecatedVersions.splice(deprecatedIndex, 1);
      }
      
      if (!this.compatibility.sunsetVersions.includes(version)) {
        this.compatibility.sunsetVersions.push(version);
      }
    }
  }
}

// Export singleton instance
export const apiVersioning = ApiVersioning.getInstance();
