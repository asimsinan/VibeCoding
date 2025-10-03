#!/usr/bin/env node
/**
 * Professional API Versioning Strategy
 * 
 * Implements comprehensive API versioning with URL path versioning,
 * backward compatibility, deprecation management, and migration support.
 * 
 * @fileoverview API versioning utilities and strategies
 */

// Express types are not needed for frontend
// import { Request, Response, any } from 'express'

export interface APIVersion {
  version: string
  releaseDate: string
  deprecationDate?: string
  sunsetDate?: string
  status: 'current' | 'deprecated' | 'sunset' | 'beta' | 'alpha'
  changes: APIVersionChange[]
  migrationGuide?: string
}

export interface APIVersionChange {
  type: 'breaking' | 'non-breaking' | 'addition' | 'removal'
  description: string
  affectedEndpoints: string[]
  migrationSteps?: string[]
}

export interface APIVersioningConfig {
  defaultVersion: string
  supportedVersions: string[]
  versioningStrategy: 'url-path' | 'header' | 'query-param'
  deprecationNoticePeriod: number // days
  sunsetNoticePeriod: number // days
  enableVersionHeader: boolean
  enableDeprecationWarnings: boolean
}

export class APIVersioningManager {
  private config: APIVersioningConfig
  private versions: Map<string, APIVersion> = new Map()

  constructor(config: APIVersioningConfig) {
    this.config = config
    this.initializeVersions()
  }

  /**
   * Initialize API versions
   */
  private initializeVersions(): void {
    // Version 1.0.0
    this.versions.set('v1', {
      version: '1.0.0',
      releaseDate: '2024-01-01',
      status: 'current',
      changes: [
        {
          type: 'addition',
          description: 'Initial API release',
          affectedEndpoints: ['*']
        }
      ]
    })

    // Version 1.1.0 (future)
    this.versions.set('v1.1', {
      version: '1.1.0',
      releaseDate: '2024-06-01',
      status: 'beta',
      changes: [
        {
          type: 'addition',
          description: 'Added event analytics endpoints',
          affectedEndpoints: ['/api/v1.1/events/{id}/analytics']
        },
        {
          type: 'non-breaking',
          description: 'Enhanced event filtering options',
          affectedEndpoints: ['/api/v1.1/events']
        }
      ]
    })

    // Version 2.0.0 (future)
    this.versions.set('v2', {
      version: '2.0.0',
      releaseDate: '2024-12-01',
      status: 'alpha',
      changes: [
        {
          type: 'breaking',
          description: 'Changed event ID format from string to UUID',
          affectedEndpoints: ['/api/v2/events/{id}'],
          migrationSteps: [
            'Update client code to handle UUID format',
            'Update database queries to use UUID type',
            'Update frontend components to display UUIDs'
          ]
        },
        {
          type: 'breaking',
          description: 'Restructured response format',
          affectedEndpoints: ['*'],
          migrationSteps: [
            'Update response parsing logic',
            'Update error handling',
            'Update frontend data binding'
          ]
        }
      ],
      migrationGuide: 'https://docs.eventorganizer.example.com/migration/v2'
    })
  }

  /**
   * Extract version from request
   */
  public extractVersion(req: any): string {
    switch (this.config.versioningStrategy) {
      case 'url-path':
        return this.extractVersionFromPath(req.path)
      case 'header':
        return this.extractVersionFromHeader(req)
      case 'query-param':
        return this.extractVersionFromQuery(req)
      default:
        return this.config.defaultVersion
    }
  }

  /**
   * Extract version from URL path
   */
  private extractVersionFromPath(path: string): string {
    const versionMatch = path.match(/^\/api\/(v\d+(?:\.\d+)?)/)
    return versionMatch ? versionMatch[1] : this.config.defaultVersion
  }

  /**
   * Extract version from header
   */
  private extractVersionFromHeader(req: any): string {
    const versionHeader = req.headers?.['api-version'] as string
    return versionHeader || this.config.defaultVersion
  }

  /**
   * Extract version from query parameter
   */
  private extractVersionFromQuery(req: any): string {
    const versionParam = req.query.version as string
    return versionParam || this.config.defaultVersion
  }

  /**
   * Validate API version
   */
  public validateVersion(version: string): { isValid: boolean; error?: string } {
    if (!this.versions.has(version)) {
      return {
        isValid: false,
        error: `Unsupported API version: ${version}. Supported versions: ${this.config.supportedVersions.join(', ')}`
      }
    }

    const versionInfo = this.versions.get(version)!
    
    if (versionInfo.status === 'sunset') {
      return {
        isValid: false,
        error: `API version ${version} has been sunset and is no longer available`
      }
    }

    return { isValid: true }
  }

  /**
   * Get version information
   */
  public getVersionInfo(version: string): APIVersion | null {
    return this.versions.get(version) || null
  }

  /**
   * Get all supported versions
   */
  public getSupportedVersions(): APIVersion[] {
    return Array.from(this.versions.values()).filter(v => 
      v.status !== 'sunset' && this.config.supportedVersions.includes(v.version)
    )
  }

  /**
   * Check if version is deprecated
   */
  public isVersionDeprecated(version: string): boolean {
    const versionInfo = this.versions.get(version)
    return versionInfo ? versionInfo.status === 'deprecated' : false
  }

  /**
   * Get deprecation warning
   */
  public getDeprecationWarning(version: string): string | null {
    const versionInfo = this.versions.get(version)
    if (!versionInfo || versionInfo.status !== 'deprecated') {
      return null
    }

    let warning = `⚠️ API version ${version} is deprecated`
    
    if (versionInfo.deprecationDate) {
      warning += ` since ${versionInfo.deprecationDate}`
    }
    
    if (versionInfo.sunsetDate) {
      warning += `. It will be sunset on ${versionInfo.sunsetDate}`
    }
    
    warning += `. Please migrate to a supported version.`
    
    return warning
  }

  /**
   * Add version headers to response
   */
  public addVersionHeaders(res: any, version: string): void {
    if (!this.config.enableVersionHeader) return

    const versionInfo = this.versions.get(version)
    if (!versionInfo) return

    res.set({
      'API-Version': versionInfo.version,
      'API-Status': versionInfo.status,
      'API-Release-Date': versionInfo.releaseDate
    })

    if (versionInfo.status === 'deprecated') {
      res.set('API-Deprecation-Date', versionInfo.deprecationDate || '')
      if (versionInfo.sunsetDate) {
        res.set('API-Sunset-Date', versionInfo.sunsetDate)
      }
    }

    if (this.config.enableDeprecationWarnings && this.isVersionDeprecated(version)) {
      const warning = this.getDeprecationWarning(version)
      if (warning) {
        res.set('Warning', `299 - "${warning}"`)
      }
    }
  }

  /**
   * Middleware for API versioning
   */
  public versioningMiddleware() {
    return (req: any, res: any, next: any) => {
      try {
        const version = this.extractVersion(req)
        
        // Validate version
        const validation = this.validateVersion(version)
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'UNSUPPORTED_VERSION',
              message: validation.error
            },
            supportedVersions: this.config.supportedVersions
          })
        }

        // Add version to request object
        req.apiVersion = version

        // Add version headers
        this.addVersionHeaders(res, version)

        next()
      } catch (error) {
        res.status(500).json({
          success: false,
          error: {
            code: 'VERSIONING_ERROR',
            message: 'Internal server error in API versioning'
          }
        })
      }
    }
  }

  /**
   * Route handler for version information
   */
  public getVersionInfoHandler() {
    return (req: any, res: any) => {
      const version = req.apiVersion || this.config.defaultVersion
      const versionInfo = this.getVersionInfo(version)
      
      if (!versionInfo) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'VERSION_NOT_FOUND',
            message: `Version ${version} not found`
          }
        })
      }

      res.json({
        success: true,
        data: {
          version: versionInfo.version,
          status: versionInfo.status,
          releaseDate: versionInfo.releaseDate,
          deprecationDate: versionInfo.deprecationDate,
          sunsetDate: versionInfo.sunsetDate,
          changes: versionInfo.changes,
          migrationGuide: versionInfo.migrationGuide
        }
      })
    }
  }

  /**
   * Route handler for supported versions
   */
  public getSupportedVersionsHandler() {
    return (req: any, res: any) => {
      const supportedVersions = this.getSupportedVersions()
      
      res.json({
        success: true,
        data: {
          versions: supportedVersions.map(v => ({
            version: v.version,
            status: v.status,
            releaseDate: v.releaseDate,
            deprecationDate: v.deprecationDate,
            sunsetDate: v.sunsetDate
          })),
          defaultVersion: this.config.defaultVersion,
          versioningStrategy: this.config.versioningStrategy
        }
      })
    }
  }

  /**
   * Create versioned route handler
   */
  public createVersionedHandler(
    handlers: Map<string, (req: any, res: any, next: any) => void>
  ) {
    return (req: any, res: any, next: any) => {
      const version = req.apiVersion || this.config.defaultVersion
      const handler = handlers.get(version)
      
      if (!handler) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'HANDLER_NOT_FOUND',
            message: `No handler found for version ${version}`
          }
        })
      }

      handler(req, res, next)
    }
  }

  /**
   * Generate migration guide
   */
  public generateMigrationGuide(fromVersion: string, toVersion: string): string {
    const fromInfo = this.getVersionInfo(fromVersion)
    const toInfo = this.getVersionInfo(toVersion)
    
    if (!fromInfo || !toInfo) {
      return 'Migration guide not available for the specified versions'
    }

    let guide = `# Migration Guide: ${fromVersion} → ${toVersion}\n\n`
    guide += `This guide helps you migrate from API version ${fromVersion} to ${toVersion}.\n\n`

    // Breaking changes
    const breakingChanges = toInfo.changes.filter(change => change.type === 'breaking')
    if (breakingChanges.length > 0) {
      guide += `## Breaking Changes\n\n`
      breakingChanges.forEach(change => {
        guide += `### ${change.description}\n\n`
        guide += `**Affected Endpoints:**\n`
        change.affectedEndpoints.forEach(endpoint => {
          guide += `- ${endpoint}\n`
        })
        guide += `\n`
        
        if (change.migrationSteps) {
          guide += `**Migration Steps:**\n`
          change.migrationSteps.forEach((step, index) => {
            guide += `${index + 1}. ${step}\n`
          })
          guide += `\n`
        }
      })
    }

    // Non-breaking changes
    const nonBreakingChanges = toInfo.changes.filter(change => change.type === 'non-breaking')
    if (nonBreakingChanges.length > 0) {
      guide += `## Non-Breaking Changes\n\n`
      nonBreakingChanges.forEach(change => {
        guide += `- ${change.description}\n`
      })
      guide += `\n`
    }

    // New features
    const newFeatures = toInfo.changes.filter(change => change.type === 'addition')
    if (newFeatures.length > 0) {
      guide += `## New Features\n\n`
      newFeatures.forEach(change => {
        guide += `- ${change.description}\n`
      })
      guide += `\n`
    }

    guide += `## Testing\n\n`
    guide += `After migration, thoroughly test your integration to ensure everything works as expected.\n\n`
    guide += `## Support\n\n`
    guide += `If you need help with migration, please contact our support team.\n`

    return guide
  }

  /**
   * Update version configuration
   */
  public updateConfig(newConfig: Partial<APIVersioningConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Add new version
   */
  public addVersion(version: string, versionInfo: APIVersion): void {
    this.versions.set(version, versionInfo)
    this.config.supportedVersions.push(versionInfo.version)
  }

  /**
   * Deprecate version
   */
  public deprecateVersion(version: string, deprecationDate: string, sunsetDate?: string): void {
    const versionInfo = this.versions.get(version)
    if (versionInfo) {
      versionInfo.status = 'deprecated'
      versionInfo.deprecationDate = deprecationDate
      if (sunsetDate) {
        versionInfo.sunsetDate = sunsetDate
      }
      this.versions.set(version, versionInfo)
    }
  }

  /**
   * Sunset version
   */
  public sunsetVersion(version: string): void {
    const versionInfo = this.versions.get(version)
    if (versionInfo) {
      versionInfo.status = 'sunset'
      this.versions.set(version, versionInfo)
      
      // Remove from supported versions
      const index = this.config.supportedVersions.indexOf(versionInfo.version)
      if (index > -1) {
        this.config.supportedVersions.splice(index, 1)
      }
    }
  }
}

// Default configuration
export const defaultAPIVersioningConfig: APIVersioningConfig = {
  defaultVersion: 'v1',
  supportedVersions: ['1.0.0'],
  versioningStrategy: 'url-path',
  deprecationNoticePeriod: 90, // 90 days
  sunsetNoticePeriod: 30, // 30 days
  enableVersionHeader: true,
  enableDeprecationWarnings: true
}

// Express middleware extension
declare global {
  namespace Express {
    interface Request {
      apiVersion?: string
    }
  }
}

// CLI interface
export class APIVersioningCLI {
  private manager: APIVersioningManager

  constructor(config: APIVersioningConfig = defaultAPIVersioningConfig) {
    this.manager = new APIVersioningManager(config)
  }

  public async run(args: string[]): Promise<void> {
    const command = args[0] || 'info'

    switch (command) {
      case 'info':
        this.showVersionInfo()
        break
      case 'list':
        this.listVersions()
        break
      case 'deprecate':
        if (args.length < 3) {
          return
        }
        this.manager.deprecateVersion(args[1], args[2], args[3])
        break
      case 'sunset':
        if (args.length < 2) {
          return
        }
        this.manager.sunsetVersion(args[1])
        break
      case 'migration':
        if (args.length < 3) {
          return
        }
        const guide = this.manager.generateMigrationGuide(args[1], args[2])
        break
      default:
    }
  }

  private showVersionInfo(): void {
    const supportedVersions = this.manager.getSupportedVersions()
    supportedVersions.forEach(version => {
      if (version.deprecationDate) {
      }
      if (version.sunsetDate) {
      }
    })
  }

  private listVersions(): void {
    const versions = Array.from(this.manager['versions'].entries())
    versions.forEach(([key, version]) => {
    })
  }
}

export default APIVersioningManager
