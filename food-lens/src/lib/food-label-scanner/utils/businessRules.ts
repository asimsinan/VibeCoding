/**
 * Business Rules Validation
 * Validates data against business-specific rules and constraints
 */

import { ValidationError } from './errors';
import { NutritionInfo } from '../models/NutritionInfo';
import { FoodScan } from '../models/FoodScan';

export class BusinessRules {
  /**
   * Validate scan image size (max 10MB)
   */
  public static validateImageSize(base64Image: string): void {
    const sizeInBytes = (base64Image.length * 3) / 4;
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    if (sizeInBytes > maxSizeBytes) {
      throw new ValidationError(
        `Image size exceeds maximum of ${maxSizeBytes / 1024 / 1024}MB`
      );
    }
  }

  /**
   * Validate nutrition data values are within reasonable ranges
   */
  public static validateNutritionData(nutrition: NutritionInfo): void {
    if (nutrition.calories < 0 || nutrition.calories > 10000) {
      throw new ValidationError('Calories must be between 0 and 10,000');
    }

    const nutrients = nutrition.nutrients;
    if (nutrients.protein < 0 || nutrients.protein > 500) {
      throw new ValidationError('Protein must be between 0 and 500g');
    }

    if (nutrients.carbs < 0 || nutrients.carbs > 1000) {
      throw new ValidationError('Carbs must be between 0 and 1,000g');
    }

    if (nutrients.fat < 0 || nutrients.fat > 500) {
      throw new ValidationError('Fat must be between 0 and 500g');
    }

    if (nutrients.sodium < 0 || nutrients.sodium > 10000) {
      throw new ValidationError('Sodium must be between 0 and 10,000mg');
    }

    if (nutrients.sugar < 0 || nutrients.sugar > 500) {
      throw new ValidationError('Sugar must be between 0 and 500g');
    }
  }

  /**
   * Validate scan status transition
   */
  public static validateScanStatusTransition(
    currentStatus: FoodScan['status'],
    newStatus: FoodScan['status']
  ): void {
    const validTransitions: Record<FoodScan['status'], FoodScan['status'][]> = {
      pending: ['processing', 'failed'],
      processing: ['completed', 'failed'],
      completed: [], // Final state
      failed: ['pending'], // Can retry
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Validate user scan limit (premium users get unlimited)
   */
  public static validateScanLimit(
    userScans: number,
    userIsPremium: boolean,
    maxScansPerDay: number = 50
  ): void {
    if (userIsPremium) {
      return; // Premium users have unlimited scans
    }

    if (userScans >= maxScansPerDay) {
      throw new ValidationError(
        `Daily scan limit of ${maxScansPerDay} reached. Upgrade to premium for unlimited scans.`
      );
    }
  }

  /**
   * Validate pagination parameters
   */
  public static validatePagination(
    page: number,
    limit: number,
    maxLimit: number = 100
  ): void {
    if (page < 1) {
      throw new ValidationError('Page must be at least 1');
    }

    if (limit < 1) {
      throw new ValidationError('Limit must be at least 1');
    }

    if (limit > maxLimit) {
      throw new ValidationError(`Limit cannot exceed ${maxLimit}`);
    }
  }

  /**
   * Validate alternative suggestion score
   */
  public static validateAlternativeScore(score: number): void {
    if (score < 0 || score > 100) {
      throw new ValidationError('Health improvement score must be between 0 and 100');
    }
  }
}

