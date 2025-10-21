import { describe, it, expect, beforeEach } from '@jest/globals';
import { ScoringSystem } from '@/lib/core/scoring/scoring-system';

// Scoring System Tests
describe('ScoringSystem', () => {
  let scoringSystem: ScoringSystem;

  beforeEach(() => {
    scoringSystem = new ScoringSystem();
  });

  describe('Content Score Calculation', () => {
    it('should calculate content score based on sections', () => {
      const analysisResult = {
        sections: {
          summary: { present: true, quality: 0.8 },
          experience: { present: true, quality: 0.9 },
          education: { present: true, quality: 0.7 },
          skills: { present: true, quality: 0.8 }
        },
        wordCount: 500,
        readabilityScore: 0.75
      };

      const score = scoringSystem.calculateContentScore(analysisResult);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeGreaterThan(70); // Should be high for good content
    });

    it('should penalize missing sections', () => {
      const analysisResult = {
        sections: {
          summary: { present: false, quality: 0 },
          experience: { present: true, quality: 0.9 },
          education: { present: false, quality: 0 },
          skills: { present: true, quality: 0.8 }
        },
        wordCount: 300,
        readabilityScore: 0.6
      };

      const score = scoringSystem.calculateContentScore(analysisResult);

      expect(score).toBeLessThan(60); // Should be lower due to missing sections
    });

    it('should handle empty analysis result', () => {
      expect(() => {
        scoringSystem.calculateContentScore(null);
      }).toThrow('Analysis result is required');
    });
  });

  describe('Formatting Score Calculation', () => {
    it('should calculate formatting score based on structure', () => {
      const formattingAnalysis = {
        consistentCapitalization: true,
        properBulletPoints: true,
        consistentSpacing: true,
        properHeadings: true,
        contactInfoFormatting: true,
        issues: []
      };

      const score = scoringSystem.calculateFormattingScore(formattingAnalysis);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeGreaterThan(80); // Should be high for good formatting
    });

    it('should penalize formatting issues', () => {
      const formattingAnalysis = {
        consistentCapitalization: false,
        properBulletPoints: false,
        consistentSpacing: false,
        properHeadings: false,
        contactInfoFormatting: false,
        issues: [
          'Inconsistent capitalization',
          'Missing bullet points',
          'Poor spacing',
          'No clear headings'
        ]
      };

      const score = scoringSystem.calculateFormattingScore(formattingAnalysis);

      expect(score).toBeLessThan(40); // Should be low due to many issues
    });

    it('should handle partial formatting issues', () => {
      const formattingAnalysis = {
        consistentCapitalization: true,
        properBulletPoints: false,
        consistentSpacing: true,
        properHeadings: true,
        contactInfoFormatting: true,
        issues: ['Missing bullet points']
      };

      const score = scoringSystem.calculateFormattingScore(formattingAnalysis);

      expect(score).toBeGreaterThan(60);
      expect(score).toBeLessThan(90);
    });
  });

  describe('Keyword Score Calculation', () => {
    it('should calculate keyword score based on relevance', () => {
      const keywordAnalysis = {
        technicalSkills: ['JavaScript', 'React', 'Node.js', 'Python'],
        cloudTechnologies: ['AWS', 'Docker'],
        methodologies: ['Agile', 'Scrum'],
        industryKeywords: ['API', 'Microservices', 'DevOps'],
        keywordDensity: {
          'JavaScript': 0.05,
          'React': 0.03,
          'Node.js': 0.04
        },
        missingKeywords: ['TypeScript', 'Kubernetes']
      };

      const score = scoringSystem.calculateKeywordScore(keywordAnalysis);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeGreaterThan(60); // Should be good for relevant keywords
    });

    it('should penalize missing important keywords', () => {
      const keywordAnalysis = {
        technicalSkills: ['HTML', 'CSS'],
        cloudTechnologies: [],
        methodologies: [],
        industryKeywords: [],
        keywordDensity: {},
        missingKeywords: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS']
      };

      const score = scoringSystem.calculateKeywordScore(keywordAnalysis);

      expect(score).toBeLessThan(30); // Should be low for missing important keywords
    });

    it('should reward high keyword density', () => {
      const keywordAnalysis = {
        technicalSkills: ['JavaScript', 'React', 'Node.js'],
        cloudTechnologies: ['AWS'],
        methodologies: ['Agile'],
        industryKeywords: ['API', 'Microservices'],
        keywordDensity: {
          'JavaScript': 0.08,
          'React': 0.06,
          'Node.js': 0.05,
          'AWS': 0.04
        },
        missingKeywords: []
      };

      const score = scoringSystem.calculateKeywordScore(keywordAnalysis);

      expect(score).toBeGreaterThan(80); // Should be high for good keyword density
    });
  });

  describe('Overall Score Calculation', () => {
    it('should calculate weighted overall score', () => {
      const scores = {
        contentScore: 85,
        formattingScore: 90,
        keywordScore: 75
      };

      const overallScore = scoringSystem.calculateOverallScore(scores);

      expect(overallScore).toBeGreaterThanOrEqual(0);
      expect(overallScore).toBeLessThanOrEqual(100);
      expect(overallScore).toBeCloseTo(83.5, 1); // Weighted average
    });

    it('should handle missing score components', () => {
      const scores = {
        contentScore: 85,
        formattingScore: null,
        keywordScore: 75
      };

      expect(() => {
        scoringSystem.calculateOverallScore(scores);
      }).toThrow('All score components are required');
    });

    it('should handle invalid score values', () => {
      const scores = {
        contentScore: 150, // Invalid: > 100
        formattingScore: 90,
        keywordScore: 75
      };

      expect(() => {
        scoringSystem.calculateOverallScore(scores);
      }).toThrow('Score values must be between 0 and 100');
    });
  });

  describe('Score Validation', () => {
    it('should validate score ranges', () => {
      expect(scoringSystem.validateScore(50)).toBe(true);
      expect(scoringSystem.validateScore(0)).toBe(true);
      expect(scoringSystem.validateScore(100)).toBe(true);
      expect(scoringSystem.validateScore(-1)).toBe(false);
      expect(scoringSystem.validateScore(101)).toBe(false);
    });

    it('should handle non-numeric scores', () => {
      expect(() => {
        scoringSystem.validateScore('invalid');
      }).toThrow('Score must be a number');
    });
  });

  describe('Score Categories', () => {
    it('should categorize scores correctly', () => {
      expect(scoringSystem.categorizeScore(95)).toBe('excellent');
      expect(scoringSystem.categorizeScore(85)).toBe('good');
      expect(scoringSystem.categorizeScore(70)).toBe('fair');
      expect(scoringSystem.categorizeScore(50)).toBe('poor');
      expect(scoringSystem.categorizeScore(30)).toBe('needs-improvement');
    });

    it('should handle edge cases in categorization', () => {
      expect(scoringSystem.categorizeScore(90)).toBe('excellent');
      expect(scoringSystem.categorizeScore(80)).toBe('good');
      expect(scoringSystem.categorizeScore(60)).toBe('fair');
      expect(scoringSystem.categorizeScore(40)).toBe('poor');
    });
  });

  describe('Score Breakdown', () => {
    it('should provide detailed score breakdown', () => {
      const analysisData = {
        content: { sections: { summary: { present: true, quality: 0.8 } } },
        formatting: { consistentCapitalization: true, issues: [] },
        keywords: { technicalSkills: ['JavaScript'], missingKeywords: [] }
      };

      const breakdown = scoringSystem.getScoreBreakdown(analysisData);

      expect(breakdown).toBeDefined();
      expect(breakdown.contentScore).toBeDefined();
      expect(breakdown.formattingScore).toBeDefined();
      expect(breakdown.keywordScore).toBeDefined();
      expect(breakdown.overallScore).toBeDefined();
      expect(breakdown.category).toBeDefined();
      expect(breakdown.recommendations).toBeDefined();
    });
  });
});
