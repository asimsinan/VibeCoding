import { scanService, ScanRequest } from '../api/ScanService';
import { FoodScan } from '../../models/FoodScan';
import { BaseController, ControllerResponse } from './BaseController';
import { Sanitizers } from '../../utils/sanitization';
import { securityMiddleware } from '../security/SecurityMiddleware';

export interface CreateScanRequest {
  userId: string;
  image: string;
  language?: string;
}

export interface GetScanHistoryRequest {
  userId: string;
  page?: number;
  limit?: number;
}

/**
 * ScanController - handles scan-related requests
 * Improved request/response handling with security and input sanitization
 */
export class ScanController extends BaseController {
  /**
   * Handle scan creation request with authentication and input sanitization
   */
  public async createScan(
    request: CreateScanRequest
  ): Promise<ControllerResponse> {
    try {
      // Require authentication and scan:create permission
      const context = await securityMiddleware.requirePermission('scan:create');

      // Verify user owns this request
      if (context.userId !== request.userId) {
        return this.formatErrorResponse(
          new Error('Cannot create scan for another user')
        );
      }

      // Sanitize inputs
      const sanitizedImage = Sanitizers.base64Image(request.image);
      const sanitizedLanguage = request.language 
        ? Sanitizers.string(request.language, 2) 
        : 'en';

      if (sanitizedLanguage !== 'en' && sanitizedLanguage !== 'tr') {
        return this.formatValidationError('Language must be "en" or "tr"');
      }

      const scanRequest: ScanRequest = {
        image: sanitizedImage,
        language: sanitizedLanguage as 'en' | 'tr',
      };

      const response = await scanService.createScan(request.userId, scanRequest);

      return this.formatSuccessResponse(response);
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Handle get scan request with authentication and ownership check
   */
  public async getScan(scanId: string): Promise<ControllerResponse<FoodScan>> {
    try {
      // Require authentication and scan:read permission
      const context = await securityMiddleware.requirePermission('scan:read');

      // Sanitize scanId
      const sanitizedScanId = Sanitizers.string(scanId, 100);

      const scan = await scanService.getScan(sanitizedScanId);

      if (!scan) {
        return this.formatNotFoundResponse('Scan');
      }

      // Check ownership or admin role
      await securityMiddleware.requireOwnership(scan.userId);

      return this.formatSuccessResponse(scan);
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Handle get scan history request with authentication
   */
  public async getScanHistory(
    request: GetScanHistoryRequest
  ): Promise<ControllerResponse<FoodScan[]>> {
    try {
      // Require authentication and scan:history permission
      const context = await securityMiddleware.requirePermission('scan:history');

      // Verify user owns this request
      if (context.userId !== request.userId) {
        return this.formatErrorResponse(
          new Error('Cannot access another user\'s scan history')
        );
      }

      // Sanitize pagination parameters
      const page = Sanitizers.number(request.page || 1, 1, 1000);
      const limit = Sanitizers.number(request.limit || 20, 1, 100);

      const scans = await scanService.getScanHistory(
        request.userId,
        page,
        limit
      );

      return this.formatSuccessResponse(scans);
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Handle delete scan request with authentication and ownership check
   */
  public async deleteScan(scanId: string): Promise<ControllerResponse> {
    try {
      // Require authentication and scan:delete permission
      const context = await securityMiddleware.requirePermission('scan:delete');

      // Sanitize scanId
      const sanitizedScanId = Sanitizers.string(scanId, 100);

      // Get scan to check ownership
      const scan = await scanService.getScan(sanitizedScanId);
      if (scan) {
        await securityMiddleware.requireOwnership(scan.userId);
      }

      await scanService.deleteScan(sanitizedScanId);

      return this.formatSuccessResponse(undefined, 'Scan deleted successfully');
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
    }
  }

  /**
   * Handle process scan request
   */
  public async processScan(scanId: string): Promise<ControllerResponse> {
    try {
      await scanService.processScan(scanId);

      return this.formatSuccessResponse(undefined, 'Scan processed successfully');
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
    }
  }
}

