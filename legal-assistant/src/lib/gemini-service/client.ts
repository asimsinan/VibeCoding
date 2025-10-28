import { aiGatewayService } from '@/lib/ai-gateway/client';
import type { GeminiPromptOptions, GeminiResponse, GeminiCallOptions } from './types';

export class GeminiService {
  constructor() {
    // AI Gateway service is initialized via aiGatewayService singleton
  }

  /**
   * Generate Turkish text using AI Gateway
   */
  async generateText(
    prompt: string,
    options: GeminiPromptOptions = {}
  ): Promise<GeminiResponse> {
    const fullPrompt = this.buildPrompt(prompt, options);

    try {
      const result = await aiGatewayService.generateText(fullPrompt, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });

      return {
        text: result.text,
        tokens: {
          promptTokens: 0,
          responseTokens: result.tokens,
          totalTokens: result.tokens,
        },
      };
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate text with retry logic
   */
  async generateTextWithRetry(
    prompt: string,
    options: GeminiPromptOptions & GeminiCallOptions = {}
  ): Promise<GeminiResponse> {
    const { retryOnError = true, maxRetries = 3, ...promptOptions } = options;
    
    const fullPrompt = this.buildPrompt(prompt, promptOptions);
    
    try {
      const result = await aiGatewayService.generateTextWithRetry(fullPrompt, {
        temperature: promptOptions.temperature,
        maxTokens: promptOptions.maxTokens,
        maxRetries: retryOnError ? maxRetries : 1,
      });

      return {
        text: result.text,
        tokens: {
          promptTokens: 0,
          responseTokens: result.tokens,
          totalTokens: result.tokens,
        },
      };
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateWithContext(
    userPrompt: string,
    context: string,
    options: GeminiPromptOptions & GeminiCallOptions = {}
  ): Promise<GeminiResponse> {
    try {
      const result = await aiGatewayService.generateWithContext(
        userPrompt,
        context,
        {
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          language: options.language,
        }
      );

      return {
        text: result.text,
        tokens: {
          promptTokens: 0,
          responseTokens: result.tokens,
          totalTokens: result.tokens,
        },
      };
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build prompt with Turkish language specification
   */
  private buildPrompt(userPrompt: string, options: GeminiPromptOptions): string {
    const languageSpec = options.language || 'Türkçe';
    const contextPart = options.context ? `\n\nİçerik:\n${options.context}` : '';
    const maxTokens = options.maxTokens || 4096;
    
    return `Sen Türkçe hukuk metinleri üreten bir yapay zeka asistanısın. Aşağıdaki kurallara uyarak yanıtla:

1. Tam, tamamlanmış cümleler kullan
2. Asla cevabı yarıda kesme veya kırpma
3. Her paragrafı mantıklı bir sonla bitir
4. Maksimum ${maxTokens} token sınırı içinde kal
5. Token sınırına yaklaşırsan yumuşak bir geçişle bitir, "..." gibi kesinlikle kullanma

${languageSpec} olarak yanıtla.${contextPart}\n\nSoru: ${userPrompt}`;
  }

  /**
   * Build contextual prompt for RAG
   */
  private buildContextualPrompt(
    userQuery: string,
    context: string,
    options: GeminiPromptOptions
  ): string {
    const maxTokens = options.maxTokens || 4096;
    return `Aşağıdaki kurallara uyarak belgelerden yararlanarak soruyu yanıtla:

1. Tam, tamamlanmış cümleler kullan
2. Asla cevabı yarıda kesme veya kırpma
3. Her paragrafı mantıklı bir sonla bitir
4. Maksimum ${maxTokens} token sınırı içinde kal
5. Token sınırına yaklaşırsan yumuşak bir geçişle bitir, "..." gibi kesinlikle kullanma

İlgili Belge Bölümleri:\n${context}\n\nSoru: ${userQuery}

Türkçe ve net bir şekilde cevap ver. Cevabın tamamlanmış olmalı, eksik bırakma.`;
  }

  /**
   * Count tokens in text (estimation)
   */
  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for Turkish text
    return Math.ceil(text.length / 4);
  }
}

export const geminiService = new GeminiService();

