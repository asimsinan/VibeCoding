import { aiService } from '../ai/AIService';
import { AlternativeSuggestion } from '../../models/AlternativeSuggestion';
import { NutritionInfo } from '../../models/NutritionInfo';
import { BaseController, ControllerResponse } from './BaseController';

export interface GetAlternativesRequest {
  currentNutrition: NutritionInfo;
  dietaryRestrictions: string[];
}

/**
 * AlternativeController - handles alternative suggestion requests
 * Improved request/response handling and validation using base controller
 */
export class AlternativeController extends BaseController {
  /**
   * Handle get alternatives request
   */
  public async getAlternatives(
    request: GetAlternativesRequest
  ): Promise<ControllerResponse<AlternativeSuggestion[]>> {
    try {
      if (!request.currentNutrition) {
        return this.formatValidationError('Nutrition data is required');
      }

      const alternatives = await aiService.suggestAlternatives(
        request.currentNutrition,
        request.dietaryRestrictions || []
      );

      return this.formatSuccessResponse(alternatives);
    } catch (error: unknown) {
      return this.formatErrorResponse(error);
    }
  }
}

