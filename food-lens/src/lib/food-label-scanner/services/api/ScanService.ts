/**
 * Scan Service
 * Handles food label scanning operations
 * FR-002, FR-003, FR-004: Scan processing
 */

import { FoodScan, ImageMetadata } from '../../models/FoodScan';
import { NutritionInfo } from '../../models/NutritionInfo';
import { AllergenInfo } from '../../models/AllergenInfo';
import { firestoreService } from '../database/FirestoreService';
import { aiService } from '../ai/AIService';

export interface ScanRequest {
  image: string; // base64
  language: 'en' | 'tr';
}

export interface ScanResponse {
  scanId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
}

export class ScanService {
  private readonly MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

  // Consolidated initialization - extracted to avoid duplication
  private async ensureFirestoreInitialized(): Promise<void> {
    await firestoreService.initialize();
  }

  /**
   * Create a new scan
   * Security: Validates image data and size before processing
   * Performance: Stores base64 directly, processes asynchronously
   * 
   * @param userId - User ID creating the scan
   * @param request - Scan request with image data and language
   * @returns Scan response with scan ID and status
   * @throws Error if image validation fails
   */
  public async createScan(
    userId: string,
    request: ScanRequest
  ): Promise<ScanResponse> {
    // Validate and sanitize input
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
    
    this.validateImageRequest(request.image);

    const scanId = this.generateScanId();
    const imageMetadata = this.createImageMetadata(request.image);
    // Store base64 image directly - no Firebase Storage needed
    const imageUrl = 'data:placeholder'; // Placeholder since we store base64 directly

    const scan = new FoodScan(
      scanId,
      userId,
      imageUrl,
      imageMetadata,
      request.language,
      'pending',
      undefined, // createdAt
      undefined, // processedAt
      undefined, // nutritionData
      undefined, // allergens
      undefined, // alternatives
      undefined, // error
      request.image // Store base64 image data directly
    );

    await this.ensureFirestoreInitialized();
    await firestoreService.createScan(scan);

    // Automatically process the scan with AI Gateway
    // Process in background without blocking the response
    this.processScan(scanId).catch((error) => {
      console.error('Failed to process scan:', error);
      // Error is already logged and scan is marked as failed in processScan
    });

    return {
      scanId,
      status: 'pending',
      message: 'Scan accepted for processing',
    };
  }

  /**
   * Get scan by ID
   */
  public async getScan(scanId: string): Promise<FoodScan | null> {
    await this.ensureFirestoreInitialized();
    return await firestoreService.getScan(scanId);
  }

  /**
   * Get user's scan history
   */
  public async getScanHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<FoodScan[]> {
    await this.ensureFirestoreInitialized();
    return await firestoreService.getScansByUser(userId, page, limit);
  }

  /**
   * Delete scan
   */
  public async deleteScan(scanId: string): Promise<void> {
    await this.ensureFirestoreInitialized();
    await firestoreService.deleteScan(scanId);
  }

  /**
   * Process scan with AI (simulated)
   * Refactored: extracted complex logic into separate methods
   */
  public async processScan(scanId: string): Promise<void> {
    await this.ensureFirestoreInitialized();
    const scan = await this.validateAndPrepareScan(scanId);

    try {
      // Process with AI using base64 image data directly
      const { nutritionData, allergens } = await this.processWithAI(scan);
      this.completeScanProcessing(scan, nutritionData, allergens);
      await firestoreService.updateScan(scan);
    } catch (error: any) {
      this.handleProcessingError(scan, error);
      await firestoreService.updateScan(scan);
      throw error;
    }
  }

  // Extracted validation methods for cleaner organization
  /**
   * Validate image request
   * Security: Checks size limits and format to prevent abuse
   * 
   * @param image - Base64 encoded image string
   * @throws Error if validation fails
   */
  private validateImageRequest(image: string): void {
    if (!image || typeof image !== 'string' || image.trim().length === 0) {
      throw new Error('Image data is required');
    }

    const imageSize = this.getBase64Size(image);
    if (imageSize > this.MAX_IMAGE_SIZE) {
      throw new Error(`Image size exceeds ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB limit`);
    }

    if (imageSize === 0) {
      throw new Error('Image data is empty');
    }

    if (!this.isValidBase64Image(image)) {
      throw new Error('Invalid image format. Only JPEG and PNG are supported.');
    }
  }

  private async validateAndPrepareScan(scanId: string): Promise<FoodScan> {
    const scan = await firestoreService.getScan(scanId);
    if (!scan) {
      throw new Error('Scan not found');
    }

    if (scan.status !== 'pending') {
      throw new Error('Scan is not in pending status');
    }

    scan.markAsProcessing();
    await firestoreService.updateScan(scan);
    return scan;
  }

  private async processWithAI(scan: FoodScan): Promise<{
    nutritionData: NutritionInfo;
    allergens: AllergenInfo[];
  }> {
    // Send base64 image directly to AI Gateway (no Firebase Storage needed)
    if (!scan.imageData) {
      throw new Error('Image data is required for processing');
    }

    // Process nutrition and allergens in parallel using base64 image data
    const [nutritionData, allergens] = await Promise.all([
      aiService.processNutrition(scan.imageData),
      aiService.processAllergens(scan.imageData),
    ]);

    return { nutritionData, allergens };
  }

  private completeScanProcessing(
    scan: FoodScan,
    nutritionData: NutritionInfo,
    allergens: AllergenInfo[]
  ): void {
    scan.markAsCompleted(nutritionData, allergens);
  }

  private handleProcessingError(scan: FoodScan, error: any): void {
    scan.markAsFailed({
      code: 'PROCESSING_ERROR',
      message: error.message || 'Failed to process scan',
      timestamp: new Date(),
    });
  }

  // Extracted utility methods
  private generateScanId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createImageMetadata(image: string): ImageMetadata {
    return {
      size: this.getBase64Size(image),
      format: this.detectImageFormat(image),
      width: 1920, // Would extract from actual image
      height: 1080, // Would extract from actual image
      uploadedAt: new Date(),
    };
  }

  private generateImageUrl(scanId: string): string {
    return `https://storage.googleapis.com/scans/${scanId}.jpg`;
  }

  private getBase64Size(base64: string): number {
    const padding = (base64.match(/=/g) || []).length;
    return (base64.length * 3) / 4 - padding;
  }

  private isValidBase64Image(base64: string): boolean {
    const base64Regex = /^data:image\/(jpeg|jpg|png);base64,/;
    return base64Regex.test(base64) || /^[A-Za-z0-9+/=]+$/.test(base64);
  }

  private detectImageFormat(base64: string): 'jpeg' | 'png' {
    if (base64.startsWith('data:image/jpeg') || base64.startsWith('/9j/')) {
      return 'jpeg';
    }
    if (base64.startsWith('data:image/png') || base64.startsWith('iVBORw0KGgo')) {
      return 'png';
    }
    return 'jpeg';
  }
}

export const scanService = new ScanService();

