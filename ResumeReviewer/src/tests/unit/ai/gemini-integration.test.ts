import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { generateFeedbackViaGemini, AnalysisContext } from '../../lib/ai/gemini';
import { GeminiAnalysisSchema } from '../../lib/ai/schemas';
import { generateResumeVariants, generateSpecificVariants, VariantContext } from '../../lib/ai/variants';
import { ATSAnalyzer } from '../../lib/ats/analyzer';
import { PerformanceMonitor, GeminiPerformanceTracker } from '../../lib/performance/monitor';
import { withRetry, GeminiErrorHandler, RetryableError } from '../../lib/ai/error-handler';

// Mock the new GoogleGenAI SDK
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn(),
      generateContentStream: jest.fn()
    }
  }))
}));

describe('Gemini Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  describe('generateFeedbackViaGemini', () => {
    it('should generate valid feedback with proper schema validation', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockClient = new GoogleGenAI();
      
      mockClient.models.generateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          scores: {
            overall: 85,
            content: 80,
            formatting: 90,
            keywords: 85,
            impact: 88,
            readability: 82
          },
          sections: [{
            name: 'Experience',
            score: 85,
            issues: [{
              id: 'issue-1',
              severity: 'medium',
              text: 'Missing quantified achievements',
              evidence: 'No metrics found in experience section'
            }],
            fixes: [{
              id: 'fix-1',
              action: 'Add specific metrics',
              example: 'Increased sales by 25%'
            }]
          }],
          ats: {
            keywordMatches: ['JavaScript', 'React'],
            missingKeywords: ['TypeScript'],
            syntaxFlags: [],
            compatibilityScore: 80
          },
          recruiterView: {
            sixSecondScan: 'Strong technical background',
            redFlags: [],
            highlights: ['5+ years experience'],
            firstImpression: 'good'
          },
          summary: {
            elevatorPitch: 'Experienced software engineer',
            priorityFixes: [{
              id: 'priority-1',
              impact: 'high',
              difficulty: 'easy',
              description: 'Add TypeScript to skills',
              example: 'TypeScript, React, Node.js'
            }],
            versioningRecommendation: 'reverse-chronological'
          },
          suggestions: ['Add more quantified achievements'],
          strengths: ['Strong technical skills'],
          improvements: ['Add TypeScript experience'],
          metadata: {
            analysisVersion: '2.0',
            generatedAt: new Date().toISOString(),
            modelUsed: 'gemini-2.5-flash'
          }
        })
      });

      const context: AnalysisContext = {
        targetRole: 'Software Engineer',
        industry: 'Technology',
        seniority: 'senior'
      };

      const result = await generateFeedbackViaGemini('test-resume.pdf', 'Sample resume content', context);

      expect(result).toBeDefined();
      expect(result.scores.overall).toBe(85);
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].name).toBe('Experience');
      expect(result.ats.keywordMatches).toContain('JavaScript');
      expect(result.metadata.modelUsed).toBe('gemini-2.5-flash');
    });

    it('should handle API errors gracefully', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockClient = new GoogleGenAI();
      
      mockClient.models.generateContent.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      await expect(generateFeedbackViaGemini('test-resume.pdf')).rejects.toThrow('Rate limit exceeded');
    });

    it('should validate schema and throw on invalid response', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockClient = new GoogleGenAI();
      
      mockClient.models.generateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          scores: {
            overall: 'invalid', // Should be number
            content: 80,
            formatting: 90,
            keywords: 85
          }
        })
      });

      await expect(generateFeedbackViaGemini('test-resume.pdf')).rejects.toThrow();
    });
  });

  describe('generateResumeVariants', () => {
    it('should generate variants with tournament ranking', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                variants: [
                  {
                    id: 'variant-1',
                    type: 'headline',
                    content: 'Senior Software Engineer',
                    rationale: 'Clear and professional'
                  },
                  {
                    id: 'variant-2',
                    type: 'headline',
                    content: 'Full-Stack Developer',
                    rationale: 'Emphasizes technical breadth'
                  }
                ],
                tournament: {
                  ranking: [
                    {
                      id: 'variant-1',
                      score: 85,
                      reasons: ['Clear title', 'Professional tone']
                    },
                    {
                      id: 'variant-2',
                      score: 80,
                      reasons: ['Technical focus', 'Modern terminology']
                    }
                  ],
                  winner: {
                    id: 'variant-1',
                    score: 85
                  },
                  improvements: [
                    {
                      variantId: 'variant-2',
                      changes: ['Add more specific technologies']
                    }
                  ]
                }
              })
            }]
          }
        }]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const context: VariantContext = {
        targetRole: 'Software Engineer',
        industry: 'Technology'
      };

      const result = await generateResumeVariants('Sample resume content', context);

      expect(result).toBeDefined();
      expect(result.variants).toHaveLength(2);
      expect(result.tournament.winner.id).toBe('variant-1');
      expect(result.tournament.ranking[0].score).toBe(85);
    });
  });

  describe('ATSAnalyzer', () => {
    it('should analyze resume for ATS compatibility', () => {
      const resumeText = `
        John Doe
        Software Engineer
        Experience: 5 years JavaScript, React, Node.js
        Education: Computer Science Degree
        Skills: Programming, Problem Solving
      `;

      const result = ATSAnalyzer.analyze(resumeText);

      expect(result.score).toBeGreaterThan(0);
      expect(result.keywordAnalysis.found).toContain('JavaScript');
      expect(result.keywordAnalysis.found).toContain('React');
      expect(result.issues).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should identify missing keywords', () => {
      const resumeText = 'Basic resume without technical keywords';
      const jobDescription = 'Looking for JavaScript, Python, React developer';

      const result = ATSAnalyzer.analyze(resumeText, jobDescription);

      expect(result.keywordAnalysis.missing.length).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(50);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track Gemini request metrics', () => {
      const monitor = PerformanceMonitor.getInstance();
      monitor.clearMetrics();

      GeminiPerformanceTracker.trackRequest(
        'gemini-1.5-pro-latest',
        100,
        200,
        1500,
        true
      );

      const metrics = monitor.getGeminiMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].model).toBe('gemini-1.5-pro-latest');
      expect(metrics[0].totalTokens).toBe(300);
      expect(metrics[0].latency).toBe(1500);
      expect(metrics[0].success).toBe(true);
    });

    it('should calculate performance summary', () => {
      const monitor = PerformanceMonitor.getInstance();
      monitor.clearMetrics();

      // Add some test metrics
      const operationId = monitor.startOperation('test-operation');
      monitor.endOperation(operationId, true);

      const summary = monitor.getPerformanceSummary();
      expect(summary.totalOperations).toBe(1);
      expect(summary.successRate).toBe(100);
      expect(summary.averageLatency).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should retry on retryable errors', async () => {
      let attemptCount = 0;
      const mockOperation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new RetryableError('Temporary error', true);
        }
        return 'success';
      });

      const result = await withRetry(mockOperation, { maxRetries: 3 });
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const mockOperation = jest.fn().mockImplementation(() => {
        throw new RetryableError('Authentication failed', false);
      });

      await expect(withRetry(mockOperation)).rejects.toThrow('Authentication failed');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle different error types correctly', () => {
      const timeoutError = GeminiErrorHandler.handleError(new Error('Request timeout'));
      expect(timeoutError.retryable).toBe(true);

      const authError = GeminiErrorHandler.handleError(new Error('401 Unauthorized'));
      expect(authError.retryable).toBe(false);

      const schemaError = GeminiErrorHandler.handleError(new Error('Schema validation failed'));
      expect(schemaError.retryable).toBe(false);
    });
  });
});
