import { ScoringService } from '../../../lib/resume-reviewer/services/scoring-service';
import { ScoringSystem } from '../../../lib/core/scoring/scoring-system';

// Mock the core modules
jest.mock('../../../lib/core/scoring/scoring-system');

describe('ScoringService', () => {
  let service: ScoringService;
  let mockScoringSystem: jest.Mocked<ScoringSystem>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockScoringSystem = new ScoringSystem() as jest.Mocked<ScoringSystem>;
    
    service = new ScoringService(mockScoringSystem);
  });

  describe('Score Calculation', () => {
    it('should calculate comprehensive scores from analysis result', async () => {
      const analysisResult = {
        sections: { contact: { present: true }, experience: { present: true } },
        wordCount: 500,
        readabilityScore: 75,
        missingSections: [],
        formattingIssues: { inconsistentCapitalization: false },
        contactInfo: { name: 'John Doe', email: 'john@example.com' },
        experienceDepth: { totalYears: 5 },
        keywordAnalysis: { technicalSkills: ['JavaScript', 'React'] },
        contentQuality: { weakActionVerbsCount: 0 }
      };

      const expectedScores = {
        contentScore: 85,
        formattingScore: 90,
        keywordScore: 80,
        overallScore: 85
      };

      mockScoringSystem.calculateContentScore.mockReturnValue(85);
      mockScoringSystem.calculateFormattingScore.mockReturnValue(90);
      mockScoringSystem.calculateKeywordScore.mockReturnValue(80);
      mockScoringSystem.calculateOverallScore.mockReturnValue(85);

      const result = await service.calculateScores(analysisResult);

      expect(mockScoringSystem.calculateContentScore).toHaveBeenCalledWith(analysisResult);
      expect(mockScoringSystem.calculateFormattingScore).toHaveBeenCalledWith(analysisResult);
      expect(mockScoringSystem.calculateKeywordScore).toHaveBeenCalledWith(analysisResult);
      expect(mockScoringSystem.calculateOverallScore).toHaveBeenCalledWith({ contentScore: 85, formattingScore: 90, keywordScore: 80 });
      expect(result).toEqual(expectedScores);
    });

    it('should handle individual score calculation errors', async () => {
      const analysisResult = { sections: {} };

      mockScoringSystem.calculateContentScore.mockImplementation(() => {
        throw new Error('Content scoring failed');
      });

      await expect(service.calculateScores(analysisResult)).rejects.toThrow('Content scoring failed');
    });

    it('should validate score ranges', async () => {
      const analysisResult = { sections: {} };

      mockScoringSystem.calculateContentScore.mockReturnValue(150); // Invalid score
      mockScoringSystem.calculateFormattingScore.mockReturnValue(90);
      mockScoringSystem.calculateKeywordScore.mockReturnValue(80);

      await expect(service.calculateScores(analysisResult)).rejects.toThrow('Invalid score range');
    });
  });

  describe('Content Scoring', () => {
    it('should score content based on sections and quality', async () => {
      const analysisResult = {
        sections: { 
          contact: { present: true }, 
          experience: { present: true },
          education: { present: true },
          skills: { present: true }
        },
        wordCount: 500,
        contentQuality: { weakActionVerbsCount: 0 }
      };

      mockScoringSystem.calculateContentScore.mockReturnValue(90);

      const result = await service.calculateContentScore(analysisResult);

      expect(mockScoringSystem.calculateContentScore).toHaveBeenCalledWith(analysisResult);
      expect(result).toBe(90);
    });

    it('should penalize missing sections', async () => {
      const analysisResult = {
        sections: { contact: { present: true } }, // Missing other sections
        wordCount: 200,
        contentQuality: { weakActionVerbsCount: 5 }
      };

      mockScoringSystem.calculateContentScore.mockReturnValue(40);

      const result = await service.calculateContentScore(analysisResult);

      expect(result).toBeLessThan(50);
    });
  });

  describe('Formatting Scoring', () => {
    it('should score formatting based on structure and consistency', async () => {
      const analysisResult = {
        formattingIssues: {
          inconsistentCapitalization: false,
          missingBulletPoints: false,
          poorSpacing: false,
          noClearHeadings: false
        }
      };

      mockScoringSystem.calculateFormattingScore.mockReturnValue(95);

      const result = await service.calculateFormattingScore(analysisResult);

      expect(mockScoringSystem.calculateFormattingScore).toHaveBeenCalledWith(analysisResult);
      expect(result).toBe(95);
    });

    it('should penalize formatting issues', async () => {
      const analysisResult = {
        formattingIssues: {
          inconsistentCapitalization: true,
          missingBulletPoints: true,
          poorSpacing: true,
          noClearHeadings: true
        }
      };

      mockScoringSystem.calculateFormattingScore.mockReturnValue(30);

      const result = await service.calculateFormattingScore(analysisResult);

      expect(result).toBeLessThan(50);
    });
  });

  describe('Keyword Scoring', () => {
    it('should score keywords based on relevance and density', async () => {
      const analysisResult = {
        keywordAnalysis: {
          technicalSkills: ['JavaScript', 'React', 'Node.js', 'Python'],
          cloudTechnologies: ['AWS', 'Docker'],
          methodologies: ['Agile', 'Scrum'],
          industryKeywords: ['REST APIs', 'Microservices'],
          keywordDensity: { 'JavaScript': 0.05, 'React': 0.03 }
        }
      };

      mockScoringSystem.calculateKeywordScore.mockReturnValue(85);

      const result = await service.calculateKeywordScore(analysisResult);

      expect(mockScoringSystem.calculateKeywordScore).toHaveBeenCalledWith(analysisResult);
      expect(result).toBe(85);
    });

    it('should penalize missing important keywords', async () => {
      const analysisResult = {
        keywordAnalysis: {
          technicalSkills: [],
          cloudTechnologies: [],
          methodologies: [],
          industryKeywords: [],
          keywordDensity: {}
        }
      };

      mockScoringSystem.calculateKeywordScore.mockReturnValue(20);

      const result = await service.calculateKeywordScore(analysisResult);

      expect(result).toBeLessThan(30);
    });
  });

  describe('Score Categories', () => {
    it('should categorize scores correctly', async () => {
      const scores = { contentScore: 85, formattingScore: 90, keywordScore: 80 };

      mockScoringSystem.categorizeScore.mockReturnValue('good');

      const result = await service.categorizeScore(scores.contentScore);

      expect(mockScoringSystem.categorizeScore).toHaveBeenCalledWith(85);
      expect(result).toBe('good');
    });

    it('should handle edge cases in categorization', async () => {
      const edgeScores = [0, 50, 100];

      edgeScores.forEach(score => {
        mockScoringSystem.categorizeScore.mockReturnValue('needs-improvement');
        const result = service.categorizeScore(score);
        expect(result).toBeDefined();
      });
    });
  });

  describe('Score Breakdown', () => {
    it('should provide detailed score breakdown', async () => {
      const analysisResult = { sections: {} };
      const scores = { contentScore: 85, formattingScore: 90, keywordScore: 80 };

      mockScoringSystem.calculateContentScore.mockReturnValue(85);
      mockScoringSystem.calculateFormattingScore.mockReturnValue(90);
      mockScoringSystem.calculateKeywordScore.mockReturnValue(80);
      mockScoringSystem.calculateOverallScore.mockReturnValue(85);

      const result = await service.getScoreBreakdown(analysisResult);

      expect(result).toHaveProperty('contentScore');
      expect(result).toHaveProperty('formattingScore');
      expect(result).toHaveProperty('keywordScore');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('breakdown');
    });

    it('should include score explanations', async () => {
      const analysisResult = { sections: {} };

      mockScoringSystem.calculateContentScore.mockReturnValue(85);
      mockScoringSystem.calculateFormattingScore.mockReturnValue(90);
      mockScoringSystem.calculateKeywordScore.mockReturnValue(80);
      mockScoringSystem.calculateOverallScore.mockReturnValue(85);

      const result = await service.getScoreBreakdown(analysisResult);

      expect(result.breakdown).toHaveProperty('contentExplanation');
      expect(result.breakdown).toHaveProperty('formattingExplanation');
      expect(result.breakdown).toHaveProperty('keywordExplanation');
    });
  });

  describe('Error Handling', () => {
    it('should handle null analysis result', async () => {
      await expect(service.calculateScores(null as any)).rejects.toThrow('Analysis result is required');
    });

    it('should handle undefined analysis result', async () => {
      await expect(service.calculateScores(undefined as any)).rejects.toThrow('Analysis result is required');
    });

    it('should handle empty analysis result', async () => {
      const emptyResult = {};

      mockScoringSystem.calculateContentScore.mockReturnValue(0);
      mockScoringSystem.calculateFormattingScore.mockReturnValue(0);
      mockScoringSystem.calculateKeywordScore.mockReturnValue(0);
      mockScoringSystem.calculateOverallScore.mockReturnValue(0);

      const result = await service.calculateScores(emptyResult);

      expect(result).toBeDefined();
      expect(result.overallScore).toBe(0);
    });
  });

  describe('Service Configuration', () => {
    it('should allow configuration of scoring weights', () => {
      const config = {
        contentWeight: 0.4,
        formattingWeight: 0.3,
        keywordWeight: 0.3,
        minScoreThreshold: 30,
        maxScoreThreshold: 100
      };
      
      expect(() => service.configureScoring(config)).not.toThrow();
    });

    it('should validate configuration parameters', () => {
      const invalidConfig = { contentWeight: 1.5 }; // Invalid weight
      
      expect(() => service.configureScoring(invalidConfig)).toThrow('Invalid configuration');
    });

    it('should validate weight sum equals 1', () => {
      const invalidConfig = {
        contentWeight: 0.5,
        formattingWeight: 0.3,
        keywordWeight: 0.3 // Sum > 1
      };
      
      expect(() => service.configureScoring(invalidConfig)).toThrow('Weights must sum to 1');
    });
  });
});
