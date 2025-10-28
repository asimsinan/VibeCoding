import { describe, it, expect, beforeEach } from '@jest/globals';
import { KVKKAnalyzer } from '@/lib/kvkk-analyzer';

// Mock Gemini service
jest.mock('@/lib/gemini-service', () => ({
  geminiService: {
    generateText: jest.fn(),
  },
}));

describe('KVKK Analyzer - Compliance Checking', () => {
  let kvkkAnalyzer: KVKKAnalyzer;

  beforeEach(() => {
    kvkkAnalyzer = new KVKKAnalyzer();
  });

  describe('Compliance Rules', () => {
    it('should check KVKK compliance against Turkish data protection laws', async () => {
      const documentText = 'Bu belgede veri toplama için hukuki dayanak bulunmaktadır.';
      
      const result = await kvkkAnalyzer.analyzeDocument({
        documentText,
        documentId: 'test-doc-1',
      });

      expect(result.documentId).toBe('test-doc-1');
      expect(result.overallStatus).toBeDefined();
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });

    it('should evaluate data collection practices', async () => {
      const documentText = 'Veri toplama işlemi gerçekleştirilecektir.';
      
      const result = await kvkkAnalyzer.analyzeDocument({
        documentText,
        documentId: 'test-doc-2',
      });

      expect(result.findings).toBeDefined();
      expect(Array.isArray(result.findings)).toBe(true);
    });

    it('should check data processing consent requirements', async () => {
      const documentText = 'Açık rıza gereklidir.';
      
      const result = await kvkkAnalyzer.analyzeDocument({
        documentText,
        documentId: 'test-doc-3',
      });

      expect(result.overallStatus).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should verify data storage security requirements', async () => {
      const documentText = 'Veri güvenliği şifreleme ile sağlanacaktır.';
      
      const result = await kvkkAnalyzer.analyzeDocument({
        documentText,
        documentId: 'test-doc-4',
      });

      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Finding Generation', () => {
    it('should generate specific compliance findings', async () => {
      const documentText = 'Belgede hukuki dayanak eksik.';
      
      const result = await kvkkAnalyzer.analyzeDocument({
        documentText,
        documentId: 'test-doc-5',
      });

      expect(result.findings.length).toBeGreaterThan(0);
      if (result.findings.length > 0) {
        expect(result.findings[0].ruleId).toBeDefined();
        expect(result.findings[0].severity).toBeDefined();
      }
    });

    it('should provide actionable recommendations', async () => {
      const documentText = 'Test document';
      
      const result = await kvkkAnalyzer.analyzeDocument({
        documentText,
        documentId: 'test-doc-6',
      });

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should assess risk levels', async () => {
      const documentText = 'Riskli belge içeriği.';
      
      const result = await kvkkAnalyzer.analyzeDocument({
        documentText,
        documentId: 'test-doc-7',
      });

      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Risk Assessment', () => {
    it('should calculate risk scores', async () => {
      const documentText = 'Yüksek riskli belge';
      
      const result = await kvkkAnalyzer.analyzeDocument({
        documentText,
        documentId: 'test-doc-8',
      });

      expect(typeof result.riskScore).toBe('number');
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
    });

    it('should identify high-risk compliance gaps', async () => {
      const documentText = 'Hukuki dayanak yok, rıza yok, güvenlik yok.';
      
      const result = await kvkkAnalyzer.analyzeDocument({
        documentText,
        documentId: 'test-doc-9',
      });

      const highRiskFindings = result.findings.filter(f => f.severity === 'high');
      expect(highRiskFindings.length).toBeGreaterThan(0);
    });

    it('should provide Turkish language risk reports', async () => {
      const documentText = 'Türkçe belge analizi';
      
      const result = await kvkkAnalyzer.analyzeDocument({
        documentText,
        documentId: 'test-doc-10',
      });

      expect(result.overallStatus).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].length).toBeGreaterThan(0);
    });
  });
});

