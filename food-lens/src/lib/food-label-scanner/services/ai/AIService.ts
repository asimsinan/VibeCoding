/**
 * AI Service
 * Handles AI processing for nutrition data extraction and allergen detection
 * Uses Vercel AI SDK for unified AI interactions
 * FR-006: AI-powered nutrition analysis
 */

import { NutritionInfo } from '../../models/NutritionInfo';
import { AllergenInfo } from '../../models/AllergenInfo';
import { AlternativeSuggestion } from '../../models/AlternativeSuggestion';
import { createAIGatewayModel, callAIGateway } from './VercelAIGatewayProvider';

export interface AINutritionResponse {
  foodName: string;
  brand?: string;
  servingSize: string;
  calories: number;
  nutrients: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
    sugar: number;
    saturatedFat: number;
    transFat: number;
  };
  vitamins?: Array<{ name: string; amount: number; unit: string; dailyValue: number }>;
  minerals?: Array<{ name: string; amount: number; unit: string; dailyValue: number }>;
}

export interface AIAllergenResponse {
  name: string;
  severity: 'high' | 'medium' | 'low';
  description?: string;
}

export class AIService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms
  private nutritionModel: ReturnType<typeof createAIGatewayModel>;
  private allergenModel: ReturnType<typeof createAIGatewayModel>;

  constructor() {
    // Vercel AI Gateway base URL: https://ai-gateway.vercel.sh/v1
    // See: https://vercel.com/docs/ai-gateway
    this.apiUrl = process.env.EXPO_PUBLIC_AI_GATEWAY_URL || 'https://ai-gateway.vercel.sh/v1';
    this.apiKey = process.env.EXPO_PUBLIC_AI_GATEWAY_KEY || '';
    
    // Create model instances using AI SDK with Anthropic Claude Sonnet 4.5
    this.nutritionModel = createAIGatewayModel(
      { apiUrl: this.apiUrl, apiKey: this.apiKey },
      'anthropic/claude-sonnet-4.5'
    );
    this.allergenModel = createAIGatewayModel(
      { apiUrl: this.apiUrl, apiKey: this.apiKey },
      'anthropic/claude-sonnet-4.5'
    );
  }

  /**
   * Process image and extract nutrition data
   */
  public async processNutrition(imageData: string): Promise<NutritionInfo> {
    this.validateImage(imageData);

    try {
      const response = await this.callAIWithRetry(
        () => this.callNutritionAPI(imageData),
        this.maxRetries
      );

      return this.formatNutritionResponse(response);
    } catch (error: any) {
      if (error.message?.includes('rate limit')) {
        throw new Error('Rate limit exceeded');
      }
      throw error;
    }
  }

  /**
   * Extract allergen information from processed data
   */
  public async processAllergens(imageData: string): Promise<AllergenInfo[]> {
    this.validateImage(imageData);

    try {
      const response = await this.callAIWithRetry(
        () => this.callAllergenAPI(imageData),
        this.maxRetries
      );

      return this.formatAllergenResponse(response);
    } catch (error: any) {
      throw new Error(`Failed to process allergens: ${error.message}`);
    }
  }

  /**
   * Process with retry logic
   */
  public async processNutritionWithRetry(
    imageData: string,
    maxRetries: number
  ): Promise<NutritionInfo> {
    return this.callAIWithRetry(
      () => this.processNutrition(imageData),
      maxRetries
    );
  }

  /**
   * Format AI response into NutritionInfo model
   */
  public async formatNutritionResponse(
    rawResponse: any
  ): Promise<NutritionInfo> {
    // Validate response structure before processing
    this.validateAIResponse(rawResponse);

    // Extract foodName - prefer foodName, fallback to name, validate it's not empty
    let foodName = rawResponse.foodName || rawResponse.name || '';
    
    // If foodName is empty or just whitespace, use fallback
    if (!foodName || foodName.trim() === '' || foodName === 'Unknown Food') {
      console.warn('⚠️ Food name not found in AI response, using fallback');
      // Try to infer from brand or other fields
      foodName = rawResponse.brand 
        ? `${rawResponse.brand} Product` 
        : 'Food Product';
    }
    
    // Ensure calories exists - provide default if missing
    const calories = rawResponse.calories ?? 0;

    // Filter out invalid vitamins (empty names, negative amounts)
    const validVitamins = (rawResponse.vitamins || []).filter((v: any) => {
      return v && 
             v.name && 
             typeof v.name === 'string' && 
             v.name.trim().length > 0 &&
             (v.amount === undefined || v.amount === null || (typeof v.amount === 'number' && v.amount >= 0));
    });

    // Filter out invalid minerals (empty names, negative amounts)
    const validMinerals = (rawResponse.minerals || []).filter((m: any) => {
      return m && 
             m.name && 
             typeof m.name === 'string' && 
             m.name.trim().length > 0 &&
             (m.amount === undefined || m.amount === null || (typeof m.amount === 'number' && m.amount >= 0));
    });

    return new NutritionInfo(
      foodName,
      rawResponse.servingSize || '100g',
      calories,
      rawResponse.nutrients || {
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sodium: 0,
        sugar: 0,
        saturatedFat: 0,
        transFat: 0,
      },
      validVitamins,
      validMinerals,
      rawResponse.brand || null
    );
  }

  /**
   * Generate alternative food suggestions
   */
  public async suggestAlternatives(
    currentNutrition: NutritionInfo,
    dietaryRestrictions: string[] = []
  ): Promise<AlternativeSuggestion[]> {
    return this.generateAlternatives(currentNutrition, dietaryRestrictions);
  }

  /**
   * Generate alternative food suggestions
   * Internal method that does the actual work
   */
  private async generateAlternatives(
    nutritionData: NutritionInfo,
    dietaryRestrictions: string[] = []
  ): Promise<AlternativeSuggestion[]> {
    // Simulate AI-generated alternatives
    // In production, this would call the AI API
    const alternatives: AlternativeSuggestion[] = [];

    // Generate healthier alternatives based on nutrition profile
    if (nutritionData.calories > 400) {
      alternatives.push(
        new AlternativeSuggestion(
          'alt1',
          'Grilled Chicken Salad',
          'Lower calories and fat',
          {
            calories: { current: nutritionData.calories, alternative: nutritionData.calories - 200, difference: -200 },
            protein: { current: nutritionData.nutrients.protein, alternative: nutritionData.nutrients.protein + 10, difference: 10 },
            carbs: { current: nutritionData.nutrients.carbs, alternative: nutritionData.nutrients.carbs - 20, difference: -20 },
            fat: { current: nutritionData.nutrients.fat, alternative: nutritionData.nutrients.fat - 15, difference: -15 },
            fiber: { current: nutritionData.nutrients.fiber, alternative: nutritionData.nutrients.fiber + 5, difference: 5 },
            sodium: { current: nutritionData.nutrients.sodium, alternative: nutritionData.nutrients.sodium - 300, difference: -300 },
          }
        )
      );
    }

    return alternatives;
  }

  /**
   * Compare nutrition between current and alternative
   */
  public async compareNutrition(
    current: any,
    alternative: any
  ): Promise<AlternativeSuggestion['nutritionComparison']> {
    return {
      calories: {
        current: current.calories,
        alternative: alternative.calories,
        difference: alternative.calories - current.calories,
      },
      protein: {
        current: current.nutrients?.protein || 0,
        alternative: alternative.nutrients?.protein || 0,
        difference: (alternative.nutrients?.protein || 0) - (current.nutrients?.protein || 0),
      },
      carbs: {
        current: current.nutrients?.carbs || 0,
        alternative: alternative.nutrients?.carbs || 0,
        difference: (alternative.nutrients?.carbs || 0) - (current.nutrients?.carbs || 0),
      },
      fat: {
        current: current.nutrients?.fat || 0,
        alternative: alternative.nutrients?.fat || 0,
        difference: (alternative.nutrients?.fat || 0) - (current.nutrients?.fat || 0),
      },
      fiber: {
        current: current.nutrients?.fiber || 0,
        alternative: alternative.nutrients?.fiber || 0,
        difference: (alternative.nutrients?.fiber || 0) - (current.nutrients?.fiber || 0),
      },
      sodium: {
        current: current.nutrients?.sodium || 0,
        alternative: alternative.nutrients?.sodium || 0,
        difference: (alternative.nutrients?.sodium || 0) - (current.nutrients?.sodium || 0),
      },
    };
  }

  /**
   * Validate AI response structure
   */
  public async validateAIResponse(response: any): Promise<void> {
    if (!response || typeof response !== 'object') {
      console.error('Invalid response structure - not an object:', response);
      throw new Error('Invalid response structure: Response is not an object');
    }

    // More lenient validation - allow missing foodName if calories exists, or vice versa
    const hasFoodName = response.foodName || response.name;
    const hasCalories = typeof response.calories === 'number' || response.calories !== undefined;
    
    if (!hasFoodName && !hasCalories) {
      console.error('Invalid response structure - missing required fields:', {
        response,
        hasFoodName,
        hasCalories,
        keys: Object.keys(response),
      });
      throw new Error('Invalid response structure: Missing both foodName and calories');
    }
  }

  // Private helper methods
  private validateImage(imageData: string): void {
    if (!imageData || typeof imageData !== 'string') {
      throw new Error('Invalid image data');
    }

    const base64Regex = /^data:image\/(jpeg|jpg|png);base64,|^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(imageData)) {
      throw new Error('Invalid image format');
    }
  }

  private async callAIWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          await this.delay(this.retryDelay * (attempt + 1));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  private async callNutritionAPI(imageData: string): Promise<AINutritionResponse> {
    // Return mock data for testing when no API key
    if (!this.apiKey) {
      return {
        foodName: 'Sample Food',
        servingSize: '100g',
        calories: 250,
        nutrients: {
          protein: 10,
          carbs: 30,
          fat: 8,
          fiber: 5,
          sodium: 500,
          sugar: 15,
          saturatedFat: 3,
          transFat: 0,
        },
      };
    }

    try {
      // Prepare base64 image data (remove data URL prefix if present)
      const base64Data = imageData.includes(',') 
        ? imageData.split(',')[1] 
        : imageData;

      console.log('🔍 AI SDK Request (Nutrition):', {
        model: 'anthropic/claude-sonnet-4.5',
        hasApiKey: !!this.apiKey,
        apiKeyPrefix: this.apiKey ? `${this.apiKey.substring(0, 15)}...` : 'missing',
      });

      // Use Vercel AI SDK pattern with AI Gateway
      const content = await callAIGateway(
        this.nutritionModel,
        [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this food label image and extract nutrition information. Identify the PRODUCT NAME from the label (e.g., "Yogurt", "Cereal", "Pasta", "Chocolate Bar"). You MUST return ONLY valid JSON (no markdown, no code blocks, just raw JSON) with these exact fields: {"foodName": "string (PRODUCT NAME from label - REQUIRED, cannot be empty or Unknown Food)", "servingSize": "string", "calories": number, "nutrients": {"protein": number, "carbs": number, "fat": number, "fiber": number, "sodium": number, "sugar": number, "saturatedFat": number, "transFat": number}, "brand": "string or null (brand name if visible)", "vitamins": [], "minerals": []}. IMPORTANT: Extract the actual product name from the food label, not Unknown Food.',
              },
              {
                type: 'image',
                image: `data:image/jpeg;base64,${base64Data}`,
              },
            ],
          },
        ],
        1000
      );

      console.log('🔍 AI SDK Response (Nutrition):', {
        hasContent: !!content,
        contentPreview: content?.substring(0, 100),
      });

      if (!content) {
        throw new Error('Invalid response format from AI Gateway: No content in response');
      }

      // Parse JSON response
      let nutritionData: AINutritionResponse;
      
      // Clean content - remove markdown code blocks if present
      let cleanedContent = content.trim();
      
      // Remove markdown code block markers
      if (cleanedContent.startsWith('```')) {
        // Remove opening ```json or ```
        cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/, '');
        // Remove closing ```
        cleanedContent = cleanedContent.replace(/\n?```\s*$/, '');
        cleanedContent = cleanedContent.trim();
      }
      
      try {
        // Try to parse as JSON
        nutritionData = JSON.parse(cleanedContent);
      } catch (parseError) {
        // If direct parse fails, try to extract JSON object/array from text
        // Match JSON objects (handles multi-line)
        const jsonObjectMatch = cleanedContent.match(/(\{[\s\S]*\})/);
        // Match JSON arrays
        const jsonArrayMatch = cleanedContent.match(/(\[[\s\S]*\])/);
        
        const jsonMatch = jsonObjectMatch || jsonArrayMatch;
        
        if (jsonMatch) {
          try {
            // Try to find the complete JSON (handle unclosed braces)
            let jsonCandidate = jsonMatch[1];
            
            // If JSON appears incomplete, try to find the full object
            let openBraces = (jsonCandidate.match(/\{/g) || []).length;
            let closeBraces = (jsonCandidate.match(/\}/g) || []).length;
            
            // If missing closing braces, try to find them later in the content
            if (openBraces > closeBraces) {
              const startIndex = cleanedContent.indexOf('{');
              if (startIndex !== -1) {
                let braceCount = 0;
                let endIndex = startIndex;
                for (let i = startIndex; i < cleanedContent.length; i++) {
                  if (cleanedContent[i] === '{') braceCount++;
                  if (cleanedContent[i] === '}') braceCount--;
                  if (braceCount === 0 && cleanedContent[i] === '}') {
                    endIndex = i;
                    break;
                  }
                }
                if (endIndex > startIndex) {
                  jsonCandidate = cleanedContent.substring(startIndex, endIndex + 1);
                }
              }
            }
            
            nutritionData = JSON.parse(jsonCandidate);
          } catch (extractError) {
            console.error('Failed to parse extracted JSON:', {
              originalContent: content.substring(0, 200),
              cleanedContent: cleanedContent.substring(0, 200),
              error: extractError,
            });
            throw new Error(`AI Gateway did not return valid JSON. Content: ${content.substring(0, 300)}`);
          }
        } else {
          console.error('No JSON found in response:', {
            fullContent: content.substring(0, 500),
            cleanedContent: cleanedContent.substring(0, 500),
          });
          throw new Error(`AI Gateway did not return valid JSON. Content: ${content.substring(0, 300)}`);
        }
      }

      // Log parsed nutrition data for debugging
      console.log('📊 Parsed Nutrition Data:', {
        foodName: nutritionData.foodName,
        calories: nutritionData.calories,
        servingSize: nutritionData.servingSize,
        hasNutrients: !!nutritionData.nutrients,
        vitaminsCount: nutritionData.vitamins?.length || 0,
        mineralsCount: nutritionData.minerals?.length || 0,
      });

      // Validate and clean vitamins/minerals arrays
      if (nutritionData.vitamins && Array.isArray(nutritionData.vitamins)) {
        nutritionData.vitamins = nutritionData.vitamins.filter((v: any) => 
          v && v.name && typeof v.name === 'string' && v.name.trim().length > 0
        );
      }
      if (nutritionData.minerals && Array.isArray(nutritionData.minerals)) {
        nutritionData.minerals = nutritionData.minerals.filter((m: any) => 
          m && m.name && typeof m.name === 'string' && m.name.trim().length > 0
        );
      }

      // Validate parsed data has required fields
      if (!nutritionData.foodName && !nutritionData.calories) {
        console.error('Invalid nutrition data structure:', nutritionData);
        throw new Error('AI Gateway response missing required fields (foodName or calories)');
      }

      // Warn if foodName is still "Unknown Food" after parsing
      if (nutritionData.foodName === 'Unknown Food' || !nutritionData.foodName || nutritionData.foodName.trim() === '') {
        console.warn('⚠️ AI returned "Unknown Food" - food name may not be visible in image');
      }

      return nutritionData;
    } catch (error: any) {
      if (error.message?.includes('rate limit')) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  private async callAllergenAPI(imageData: string): Promise<AIAllergenResponse[]> {
    // Return mock data for testing when no API key
    if (!this.apiKey) {
      return [
        {
          name: 'Gluten',
          severity: 'high',
          description: 'Contains wheat',
        },
      ];
    }

    try {
      // Prepare base64 image data
      const base64Data = imageData.includes(',') 
        ? imageData.split(',')[1] 
        : imageData;

      console.log('🔍 AI SDK Request (Allergen):', {
        model: 'anthropic/claude-sonnet-4.5',
        hasApiKey: !!this.apiKey,
      });

      // Use Vercel AI SDK pattern with AI Gateway
      const content = await callAIGateway(
        this.allergenModel,
        [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this food label image and identify allergens. Return JSON array with name, severity (high/medium/low), and optional description.',
              },
              {
                type: 'image',
                image: `data:image/jpeg;base64,${base64Data}`,
              },
            ],
          },
        ],
        500
      );

      if (!content) {
        throw new Error('Invalid response from AI Gateway');
      }

      // Parse JSON response
      let allergens: AIAllergenResponse[];
      
      // Clean content - remove markdown code blocks if present
      let cleanedContent = content.trim();
      
      // Remove markdown code block markers
      if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```(?:json)?\s*\n?/, '');
        cleanedContent = cleanedContent.replace(/\n?```\s*$/, '');
        cleanedContent = cleanedContent.trim();
      }
      
      try {
        allergens = JSON.parse(cleanedContent);
      } catch {
        // If parsing fails, try to extract JSON array from text
        const jsonArrayMatch = cleanedContent.match(/(\[[\s\S]*\])/);
        if (jsonArrayMatch) {
          try {
            // Try to find complete array
            let jsonCandidate = jsonArrayMatch[1];
            let openBrackets = (jsonCandidate.match(/\[/g) || []).length;
            let closeBrackets = (jsonCandidate.match(/\]/g) || []).length;
            
            if (openBrackets > closeBrackets) {
              const startIndex = cleanedContent.indexOf('[');
              if (startIndex !== -1) {
                let bracketCount = 0;
                let endIndex = startIndex;
                for (let i = startIndex; i < cleanedContent.length; i++) {
                  if (cleanedContent[i] === '[') bracketCount++;
                  if (cleanedContent[i] === ']') bracketCount--;
                  if (bracketCount === 0 && cleanedContent[i] === ']') {
                    endIndex = i;
                    break;
                  }
                }
                if (endIndex > startIndex) {
                  jsonCandidate = cleanedContent.substring(startIndex, endIndex + 1);
                }
              }
            }
            
            allergens = JSON.parse(jsonCandidate);
          } catch {
            return [];
          }
        } else {
          return [];
        }
      }

      return Array.isArray(allergens) ? allergens : [];
    } catch (error: any) {
      // Log error but don't fail completely - return empty array
      console.warn('Allergen detection failed:', error);
      return [];
    }
  }

  private formatAllergenResponse(response: AIAllergenResponse[]): AllergenInfo[] {
    return response.map(item => 
      new AllergenInfo(item.name, item.severity, item.description)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiService = new AIService();

