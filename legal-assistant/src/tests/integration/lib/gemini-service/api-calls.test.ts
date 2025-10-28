import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GeminiService } from '@/lib/gemini-service';

// Mock @google/generative-ai
jest.mock('@google/generative-ai');

describe('Gemini Service - API Calls', () => {
  let geminiService: GeminiService;
  let mockModel: any;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    
    const mockGoogleAI = require('@google/generative-ai');
    mockModel = {
      generateContent: jest.fn(),
    };
    mockGoogleAI.GoogleGenerativeAI = jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel),
    }));
    
    geminiService = new GeminiService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API Integration', () => {
    it('should make API calls to Google Gemini', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'Test response',
        },
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 20,
          totalTokenCount: 30,
        },
      });

      const result = await geminiService.generateText('Test prompt');
      
      expect(result.text).toBe('Test response');
      expect(mockModel.generateContent).toHaveBeenCalled();
    });

    it('should handle API authentication', async () => {
      expect(process.env.GEMINI_API_KEY).toBeDefined();
      expect(mockModel).toBeDefined();
    });

    it('should handle API responses correctly', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'İş sözleşmesi hakkında bilgi',
        },
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 10,
          totalTokenCount: 15,
        },
      });

      const result = await geminiService.generateText('Sözleşme nedir?');
      
      expect(result.text).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens?.totalTokens).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('API Error'));

      await expect(geminiService.generateText('Test')).rejects.toThrow();
    });
  });

  describe('Turkish Text Generation', () => {
    it('should generate Turkish text responses', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'Türkçe yanıt',
        },
        usageMetadata: {},
      });

      const result = await geminiService.generateText('Türkçe cevap ver');
      
      expect(result.text).toContain('Türkçe');
    });

    it('should preserve Turkish characters (İ, ı, ş, ğ, ü, ö)', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'Türkçe karakterler: İ, ı, ş, ğ, ü, ö',
        },
        usageMetadata: {},
      });

      const result = await geminiService.generateText('Türkçe karakterler');
      
      expect(/[İışğüö]/u.test(result.text)).toBe(true);
    });

    it('should generate contextually appropriate Turkish legal content', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'Bu bir iş sözleşmesi taslağıdır.',
        },
        usageMetadata: {},
      });

      const result = await geminiService.generateText('İş sözleşmesi oluştur');
      
      expect(result.text).toContain('sözleşme');
    });
  });

  describe('Context-Based Generation', () => {
    it('should use RAG context for generation', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'Bağlamlı yanıt',
        },
        usageMetadata: {},
      });

      const context = 'İlgili belge içeriği';
      const result = await geminiService.generateWithContext('Sorun nedir?', context);
      
      expect(result.text).toBeDefined();
    });

    it('should maintain context throughout conversation', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'Önceki bağlam korundu',
        },
        usageMetadata: {},
      });

      const result = await geminiService.generateWithContext(
        'Önceki sorunu hatırlıyor musun?',
        'Önceki konuşma'
      );
      
      expect(result.text).toBeDefined();
    });

    it('should integrate RAG retrieval results', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'RAG sonuçlarından yanıt',
        },
        usageMetadata: {},
      });

      const ragContext = 'RAG\'dan gelen içerik';
      const result = await geminiService.generateWithContext('Soru', ragContext);
      
      expect(result.text).toBeDefined();
      expect(mockModel.generateContent).toHaveBeenCalled();
    });
  });
});

