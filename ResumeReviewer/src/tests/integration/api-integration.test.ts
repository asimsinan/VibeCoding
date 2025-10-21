import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST as uploadHandler } from '../../../app/api/v1/upload/route';
import { POST as variantsHandler } from '../../../app/api/v1/variants/route';
import { POST as atsHandler } from '../../../app/api/v1/ats/analyze/route';
import { GET as metricsHandler } from '../../../app/api/v1/metrics/route';

// Mock the AI modules
jest.mock('../../lib/ai/gemini', () => ({
  generateFeedbackViaGemini: jest.fn()
}));

jest.mock('../../lib/ai/variants', () => ({
  generateResumeVariants: jest.fn(),
  generateSpecificVariants: jest.fn()
}));

jest.mock('../../lib/ats/analyzer', () => ({
  ATSAnalyzer: {
    analyze: jest.fn()
  }
}));

jest.mock('../../lib/performance/monitor', () => ({
  PerformanceMonitor: {
    getInstance: jest.fn(() => ({
      getPerformanceSummary: jest.fn(() => ({
        totalOperations: 10,
        averageLatency: 1500,
        successRate: 95,
        topSlowOperations: [],
        errorRate: 5
      })),
      getAPIMetrics: jest.fn(() => []),
      getGeminiMetrics: jest.fn(() => []),
      clearMetrics: jest.fn()
    }))
  }
}));

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  describe('Upload API', () => {
    it('should handle file upload and generate feedback', async () => {
      const { generateFeedbackViaGemini } = require('../../lib/ai/gemini');
      generateFeedbackViaGemini.mockResolvedValueOnce({
        scores: { overall: 85, content: 80, formatting: 90, keywords: 85 },
        sections: [],
        ats: { keywordMatches: [], missingKeywords: [], syntaxFlags: [], compatibilityScore: 80 },
        recruiterView: { sixSecondScan: 'Good', redFlags: [], highlights: [], firstImpression: 'good' },
        summary: { elevatorPitch: 'Good candidate', priorityFixes: [], versioningRecommendation: 'reverse-chronological' },
        suggestions: [],
        strengths: [],
        improvements: [],
        metadata: { analysisVersion: '1.0', generatedAt: new Date().toISOString(), modelUsed: 'gemini-1.5-pro-latest' }
      });

      const formData = new FormData();
      const file = new File(['test content'], 'test-resume.pdf', { type: 'application/pdf' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/v1/upload', {
        method: 'POST',
        body: formData
      });

      const response = await uploadHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.aiProvider).toBe('gemini');
      expect(data.uploadId).toBeDefined();
    });

    it('should handle rate limiting', async () => {
      // Mock rate limiter to return false
      jest.doMock('../../lib/security', () => ({
        analysisRateLimiter: {
          isAllowed: jest.fn(() => false)
        },
        InputValidator: {
          validateFileName: jest.fn(() => true),
          validateFileType: jest.fn(() => true),
          validateFileSize: jest.fn(() => true)
        },
        addSecurityHeaders: jest.fn((res) => res),
        logSecurityEvent: jest.fn()
      }));

      const formData = new FormData();
      const file = new File(['test content'], 'test-resume.pdf', { type: 'application/pdf' });
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/v1/upload', {
        method: 'POST',
        body: formData
      });

      const response = await uploadHandler(request);
      expect(response.status).toBe(429);
    });
  });

  describe('Variants API', () => {
    it('should generate resume variants', async () => {
      const { generateResumeVariants } = require('../../lib/ai/variants');
      generateResumeVariants.mockResolvedValueOnce({
        variants: [
          { id: 'v1', type: 'headline', content: 'Senior Engineer', rationale: 'Clear title' }
        ],
        tournament: {
          ranking: [{ id: 'v1', score: 85, reasons: ['Professional'] }],
          winner: { id: 'v1', score: 85 },
          improvements: []
        }
      });

      const request = new NextRequest('http://localhost:3000/api/v1/variants', {
        method: 'POST',
        body: JSON.stringify({
          resumeContent: 'Sample resume content',
          context: { targetRole: 'Software Engineer' }
        })
      });

      const response = await variantsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.variants).toHaveLength(1);
      expect(data.tournament.winner.id).toBe('v1');
    });
  });

  describe('ATS Analysis API', () => {
    it('should perform ATS analysis', async () => {
      const { ATSAnalyzer } = require('../../lib/ats/analyzer');
      ATSAnalyzer.analyze.mockReturnValueOnce({
        score: 85,
        issues: [],
        recommendations: [],
        keywordAnalysis: { found: ['JavaScript'], missing: [], density: {}, suggestions: [] },
        formattingIssues: []
      });

      const request = new NextRequest('http://localhost:3000/api/v1/ats/analyze', {
        method: 'POST',
        body: JSON.stringify({
          resumeText: 'Sample resume text',
          jobDescription: 'Looking for JavaScript developer'
        })
      });

      const response = await atsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.analysis.score).toBe(85);
      expect(data.analysis.keywordAnalysis.found).toContain('JavaScript');
    });
  });

  describe('Metrics API', () => {
    it('should return performance metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/metrics', {
        method: 'GET'
      });

      const response = await metricsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.performance.summary.totalOperations).toBe(10);
      expect(data.performance.summary.successRate).toBe(95);
    });

    it('should clear metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/metrics', {
        method: 'DELETE'
      });

      const response = await metricsHandler(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Performance metrics cleared');
    });
  });
});
