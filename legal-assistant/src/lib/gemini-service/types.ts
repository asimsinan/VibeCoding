export interface GeminiPromptOptions {
  context?: string;
  language?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GeminiResponse {
  text: string;
  tokens?: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
}

export interface GeminiCallOptions {
  retryOnError?: boolean;
  maxRetries?: number;
}

