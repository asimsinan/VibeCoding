/**
 * FoodScan Model
 * Contains scanned image data, timestamp, processing status, and associated nutrition information
 * FR-002: Food label image capture
 * FR-003: Secure image transmission
 */

import { NutritionInfo } from './NutritionInfo';
import { AllergenInfo } from './AllergenInfo';
import { AlternativeSuggestion } from './AlternativeSuggestion';

export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ImageMetadata {
  size: number; // bytes
  format: 'jpeg' | 'png';
  width: number;
  height: number;
  uploadedAt: Date;
}

export interface ScanError {
  code: string;
  message: string;
  timestamp: Date;
}

export class FoodScan {
  public scanId: string;
  public userId: string;
  public status: ScanStatus;
  public imageUrl: string; // Optional: can be a placeholder or data URL
  public imageData?: string; // Base64 image data (stored directly, no Firebase Storage)
  public imageMetadata: ImageMetadata;
  public language: 'en' | 'tr';
  public createdAt: Date;
  public processedAt: Date | null;
  public nutritionData: NutritionInfo | null;
  public allergens: AllergenInfo[];
  public alternatives: AlternativeSuggestion[] | null;
  public error: ScanError | null;

  constructor(
    scanId: string,
    userId: string,
    imageUrl: string,
    imageMetadata: ImageMetadata,
    language: 'en' | 'tr' = 'en',
    status: ScanStatus = 'pending',
    createdAt?: Date,
    processedAt?: Date | null,
    nutritionData?: NutritionInfo | null,
    allergens?: AllergenInfo[],
    alternatives?: AlternativeSuggestion[] | null,
    error?: ScanError | null,
    imageData?: string // Optional base64 image data
  ) {
    this.scanId = this.validateScanId(scanId);
    this.userId = this.validateUserId(userId);
    this.imageUrl = imageUrl || 'data:placeholder'; // Allow placeholder if no URL
    this.imageMetadata = this.validateImageMetadata(imageMetadata);
    this.imageData = imageData; // Store base64 directly
    this.language = this.validateLanguage(language);
    this.status = this.validateStatus(status);
    this.createdAt = createdAt || new Date();
    this.processedAt = processedAt || null;
    this.nutritionData = nutritionData || null;
    this.allergens = allergens || [];
    this.alternatives = alternatives || null;
    this.error = error || null;
  }

  // Validation methods
  private validateScanId(scanId: string): string {
    if (!scanId || scanId.trim().length === 0) {
      throw new Error('Scan ID cannot be empty');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(scanId)) {
      throw new Error('Scan ID must contain only alphanumeric characters, underscores, and hyphens');
    }
    return scanId.trim();
  }

  private validateUserId(userId: string): string {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
    return userId.trim();
  }

  private validateImageUrl(imageUrl: string): string {
    // Allow placeholder URLs or data URLs since we're not using Firebase Storage
    if (!imageUrl || imageUrl.trim().length === 0) {
      return 'data:placeholder'; // Allow placeholder
    }
    
    // Allow data URLs or placeholder
    if (imageUrl.startsWith('data:') || imageUrl === 'data:placeholder') {
      return imageUrl;
    }
    
    // Validate HTTP URLs if provided
    try {
      new URL(imageUrl);
      return imageUrl.trim();
    } catch {
      // Allow placeholder instead of throwing error
      return 'data:placeholder';
    }
  }

  private validateImageMetadata(metadata: ImageMetadata): ImageMetadata {
    if (metadata.size <= 0) {
      throw new Error('Image size must be greater than 0');
    }
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (metadata.size > maxSizeBytes) {
      throw new Error(`Image size cannot exceed ${maxSizeBytes} bytes (10MB)`);
    }
    if (metadata.format !== 'jpeg' && metadata.format !== 'png') {
      throw new Error('Image format must be jpeg or png');
    }
    if (metadata.width <= 0 || metadata.height <= 0) {
      throw new Error('Image width and height must be greater than 0');
    }
    return metadata;
  }

  private validateLanguage(language: string): 'en' | 'tr' {
    if (language !== 'en' && language !== 'tr') {
      throw new Error('Language must be either "en" or "tr"');
    }
    return language as 'en' | 'tr';
  }

  private validateStatus(status: string): ScanStatus {
    const validStatuses: ScanStatus[] = ['pending', 'processing', 'completed', 'failed'];
    if (!validStatuses.includes(status as ScanStatus)) {
      throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
    }
    return status as ScanStatus;
  }

  // Business logic methods
  public markAsProcessing(): void {
    if (this.status !== 'pending') {
      throw new Error('Only pending scans can be marked as processing');
    }
    this.status = 'processing';
  }

  public markAsCompleted(nutritionData: NutritionInfo, allergens: AllergenInfo[]): void {
    if (this.status !== 'processing') {
      throw new Error('Only processing scans can be marked as completed');
    }
    this.status = 'completed';
    this.nutritionData = nutritionData;
    this.allergens = allergens;
    this.processedAt = new Date();
    this.error = null;
  }

  public markAsFailed(error: ScanError): void {
    this.status = 'failed';
    this.error = {
      code: error.code,
      message: error.message,
      timestamp: new Date(),
    };
    this.processedAt = new Date();
  }

  public addAlternatives(alternatives: AlternativeSuggestion[]): void {
    if (this.status !== 'completed') {
      throw new Error('Alternatives can only be added to completed scans');
    }
    this.alternatives = alternatives;
  }

  public hasHighSeverityAllergens(): boolean {
    return this.allergens.some(allergen => allergen.severity === 'high');
  }

  public getPrimaryAllergens(): AllergenInfo[] {
    return this.allergens.filter(allergen => allergen.severity === 'high');
  }

  // Health Scoring
  public getHealthScore(): number {
    if (!this.nutritionData) {
      return 50; // Default score if no nutrition data
    }

    let score = this.nutritionData.getHealthScore();

    // Penalize high severity allergens
    const allergenPenalty = this.getAllergenRiskScore() * 2;
    score -= Math.min(allergenPenalty, 30); // Max 30 point penalty

    return Math.max(0, Math.min(100, score));
  }

  public getHealthScoreWithoutAllergens(): number {
    if (!this.nutritionData) {
      return 50;
    }
    return this.nutritionData.getHealthScore();
  }

  public getAllergenRiskScore(): number {
    return this.allergens.reduce((total, allergen) => {
      return total + allergen.getSeverityScore();
    }, 0);
  }

  // User Dietary Restriction Matching
  public containsRestrictedAllergens(userRestrictions: string[]): boolean {
    return this.allergens.some(allergen => 
      allergen.matchesUserRestriction(userRestrictions)
    );
  }

  public getMatchingRestrictedAllergens(userRestrictions: string[]): AllergenInfo[] {
    return this.allergens.filter(allergen => 
      allergen.matchesUserRestriction(userRestrictions)
    );
  }

  public getSafetyScoreForUser(userRestrictions: string[]): number {
    if (!this.nutritionData) {
      return 50;
    }

    let score = this.nutritionData.getHealthScore();

    // Heavy penalty if contains restricted allergens
    if (this.containsRestrictedAllergens(userRestrictions)) {
      const matchingAllergens = this.getMatchingRestrictedAllergens(userRestrictions);
      const riskScore = matchingAllergens.reduce((total, allergen) => {
        return total + allergen.getSeverityScore();
      }, 0);
      
      score -= riskScore * 5; // Heavy penalty for restricted allergens
    }

    return Math.max(0, Math.min(100, score));
  }

  // Nutrition Analysis
  public isSuitableForDiet(dietType: 'keto' | 'low-carb' | 'high-protein' | 'low-fat'): boolean {
    if (!this.nutritionData) {
      return false;
    }

    switch (dietType) {
      case 'keto':
        return this.nutritionData.isLowCarb() && !this.nutritionData.isLowFat();
      case 'low-carb':
        return this.nutritionData.isLowCarb();
      case 'high-protein':
        return this.nutritionData.isHighProtein();
      case 'low-fat':
        return this.nutritionData.isLowFat();
      default:
        return false;
    }
  }

  public getNutritionalCompletenessScore(): number {
    if (!this.nutritionData) {
      return 0;
    }

    let score = 0;

    // Check macronutrients
    const hasProtein = this.nutritionData.nutrients.protein > 10;
    const hasCarbs = this.nutritionData.nutrients.carbs > 0;
    const hasFat = this.nutritionData.nutrients.fat > 0;
    const hasFiber = this.nutritionData.nutrients.fiber > 5;

    if (hasProtein) score += 20;
    if (hasCarbs) score += 15;
    if (hasFat) score += 10;
    if (hasFiber) score += 15;

    // Check vitamins
    if (this.nutritionData.vitamins && this.nutritionData.vitamins.length > 0) {
      score += Math.min(this.nutritionData.vitamins.length * 5, 20);
    }

    // Check minerals
    if (this.nutritionData.minerals && this.nutritionData.minerals.length > 0) {
      score += Math.min(this.nutritionData.minerals.length * 5, 20);
    }

    return Math.min(100, score);
  }

  // Recommendation Logic
  public shouldShowAlternatives(): boolean {
    if (!this.nutritionData || this.status !== 'completed') {
      return false;
    }

    // Show alternatives if food is unhealthy
    const healthScore = this.nutritionData.getHealthScore();
    if (healthScore < 50) {
      return true;
    }

    // Show if has high severity allergens
    if (this.hasHighSeverityAllergens()) {
      return true;
    }

    // Show if has multiple warnings
    const warnings = this.nutritionData.getNutritionWarnings();
    if (warnings.length >= 2) {
      return true;
    }

    return false;
  }

  public getAlternativeShowUrgency(): number {
    if (!this.nutritionData || this.status !== 'completed') {
      return 0;
    }

    let urgency = 0;

    // Base urgency on health score
    const healthScore = this.nutritionData.getHealthScore();
    if (healthScore < 30) urgency += 4;
    else if (healthScore < 50) urgency += 3;
    else if (healthScore < 70) urgency += 2;

    // Add urgency for high severity allergens
    if (this.hasHighSeverityAllergens()) {
      urgency += 3;
    }

    // Add urgency for trans fat
    if (this.nutritionData.hasTransFat()) {
      urgency += 2;
    }

    // Add urgency for multiple warnings
    const warnings = this.nutritionData.getNutritionWarnings();
    urgency += Math.min(warnings.length, 3);

    return Math.min(10, urgency);
  }

  // Serialization methods
  public toJSON(): Record<string, unknown> {
    return {
      scanId: this.scanId,
      userId: this.userId,
      status: this.status,
      imageUrl: this.imageUrl,
      imageData: this.imageData || null, // Include base64 image data
      imageMetadata: {
        ...this.imageMetadata,
        uploadedAt: this.imageMetadata.uploadedAt.toISOString(),
      },
      language: this.language,
      createdAt: this.createdAt.toISOString(),
      processedAt: this.processedAt?.toISOString() ?? null,
      nutritionData: this.nutritionData?.toJSON() ?? null,
      allergens: this.allergens.map(a => a.toJSON()),
      alternatives: this.alternatives?.map(a => a.toJSON()) ?? null,
      error: this.error ? {
        ...this.error,
        timestamp: this.error.timestamp.toISOString(),
      } : null,
    };
  }

  public static fromJSON(data: Record<string, unknown>): FoodScan {
    const { NutritionInfo } = require('./NutritionInfo');
    const { AllergenInfo } = require('./AllergenInfo');
    const { AlternativeSuggestion } = require('./AlternativeSuggestion');

    return new FoodScan(
      data.scanId as string,
      data.userId as string,
      data.imageUrl as string || 'data:placeholder',
      {
        ...(data.imageMetadata as ImageMetadata),
        uploadedAt: typeof (data.imageMetadata as ImageMetadata).uploadedAt === 'string'
          ? new Date((data.imageMetadata as ImageMetadata).uploadedAt as unknown as string)
          : ((data.imageMetadata as ImageMetadata).uploadedAt as Date),
      },
      data.language as 'en' | 'tr',
      data.status as ScanStatus,
      data.createdAt ? new Date(data.createdAt as string) : undefined,
      data.processedAt ? new Date(data.processedAt as string) : null,
      data.nutritionData ? NutritionInfo.fromJSON(data.nutritionData as Record<string, unknown>) : null,
      (data.allergens as Record<string, unknown>[])?.map(a => AllergenInfo.fromJSON(a)) ?? [],
      (data.alternatives as Record<string, unknown>[])?.map(a => AlternativeSuggestion.fromJSON(a)) ?? null,
      data.error ? {
        code: (data.error as ScanError).code,
        message: (data.error as ScanError).message,
        timestamp: typeof (data.error as ScanError).timestamp === 'string' 
          ? new Date((data.error as ScanError).timestamp as unknown as string)
          : ((data.error as ScanError).timestamp as Date),
      } : null,
      data.imageData as string | undefined // Include base64 image data
    );
  }
}

