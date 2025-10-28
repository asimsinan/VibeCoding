/**
 * AI Gateway Service - Uses Vercel AI Gateway for all AI operations
 * Configures OpenAI-compatible API with AI Gateway base URL
 */

import OpenAI from 'openai';

// @ts-ignore - OpenAI types

// Get AI Gateway API key
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY;
const AI_GATEWAY_BASE_URL = 'https://ai-gateway.vercel.sh';

export class AIGatewayService {
  private openai: OpenAI | null = null;
  
  constructor() {
    if (!AI_GATEWAY_API_KEY) {
      console.warn('AI_GATEWAY_API_KEY not set. AI Gateway features will not work.');
      return;
    }
    
    // Initialize OpenAI client with AI Gateway
    this.openai = new OpenAI({
      apiKey: AI_GATEWAY_API_KEY,
      baseURL: AI_GATEWAY_BASE_URL,
    });
  }

  /**
   * Generate text using AI SDK with AI Gateway
   */
  async generateText(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    } = {}
  ): Promise<{ text: string; tokens: number }> {
    const model = options.model || 'minimax/minimax-m2';
    
    try {
      // Use AI SDK's generateText which works with AI Gateway
      const { generateText } = await import('ai');
      
      const result = await generateText({
        model: model,
        prompt,
        temperature: options.temperature || 0.7,
      });

      return {
        text: result.text,
        tokens: result.usage?.totalTokens || 0,
      };
    } catch (error) {
      console.error('AI Gateway generateText error:', error);
      throw error;
    }
  }

  /**
   * Generate text with retry logic
   */
  async generateTextWithRetry(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
      maxRetries?: number;
    } = {}
  ): Promise<{ text: string; tokens: number }> {
    const maxRetries = options.maxRetries || 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.generateText(prompt, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`Attempt ${attempt + 1} failed, retrying...`);
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Failed to generate text after retries');
  }

  /**
   * Generate text with context (for RAG)
   */
  async generateWithContext(
    userPrompt: string,
    context: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      language?: string;
    } = {}
  ): Promise<{ text: string; tokens: number }> {
    const fullPrompt = `Aşağıdaki bağlamı kullanarak kullanıcının sorusunu cevaplayın:
    
Bağlam:
${context}

Kullanıcı Sorusu: ${userPrompt}

${options.language ? `Lütfen ${options.language} dilinde cevap verin.` : ''}
Cevap:`;

    return this.generateText(fullPrompt, {
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 4096,
    });
  }

  /**
   * Generate embeddings using AI SDK with AI Gateway
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use AI SDK's embed function which works with AI Gateway
      const { embed } = await import('ai');
      
      const result = await embed({
        model: 'openai/text-embedding-3-small',
        value: text,
      });

      return result.embedding;
    } catch (error) {
      console.error('AI Gateway embedding error:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch with rate limiting)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const BATCH_SIZE = 5;
      const DELAY_MS = 1000;
      const embeddings: number[][] = [];

      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        console.log(`Processing embedding batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(texts.length / BATCH_SIZE)}`);

        const batchPromises = batch.map(text => this.generateEmbedding(text));
        const batchResults = await Promise.all(batchPromises);

        embeddings.push(...batchResults);

        if (i + BATCH_SIZE < texts.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
      }

      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }
}

export const aiGatewayService = new AIGatewayService();
