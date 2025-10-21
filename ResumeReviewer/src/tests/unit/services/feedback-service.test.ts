import { FeedbackService } from '../../../lib/resume-reviewer/services/feedback-service';
import { FeedbackGenerator } from '../../../lib/core/feedback/feedback-generator';
import { ScoringSystem } from '../../../lib/core/scoring/scoring-system';

// Mock the core modules
jest.mock('../../../lib/core/feedback/feedback-generator');
jest.mock('../../../lib/core/scoring/scoring-system');

describe('FeedbackService', () => {
  let service: FeedbackService;
  let mockFeedbackGenerator: jest.Mocked<FeedbackGenerator>;
  let mockScoringSystem: jest.Mocked<ScoringSystem>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFeedbackGenerator = new FeedbackGenerator() as jest.Mocked<FeedbackGenerator>;
    mockScoringSystem = new ScoringSystem() as jest.Mocked<ScoringSystem>;
    
    service = new FeedbackService(mockFeedbackGenerator, mockScoringSystem);
  });

  describe('Feedback Generation', () => {
    it('should generate comprehensive feedback from analysis result', async () => {
      const analysisResult = {
        sections: { contact: { present: true }, experience: { present: true } },
        wordCount: 500,
        readabilityScore: 75,
        missingSections: [],
        formattingIssues: { inconsistentCapitalization: false },
        contactInfo: { name: 'John Doe' },
        experienceDepth: { totalYears: 5 },
        keywordAnalysis: { technicalSkills: ['JavaScript', 'React'] },
        contentQuality: { weakActionVerbsCount: 0 }
      };

      const mockScores = { contentScore: 85, formattingScore: 90, keywordScore: 80 };
      const mockFeedback = {
        overallScore: 85,
        contentScore: 85,
        formattingScore: 90,
        keywordScore: 80,
        suggestions: ['Add more quantified achievements'],
        strengths: ['Strong technical skills'],
        improvements: ['Improve keyword density'],
        analysis: { wordCount: 500 }
      };

      mockScoringSystem.calculateContentScore.mockReturnValue(mockScores.contentScore);
      mockScoringSystem.calculateFormattingScore.mockReturnValue(mockScores.formattingScore);
      mockScoringSystem.calculateKeywordScore.mockReturnValue(mockScores.keywordScore);
      mockFeedbackGenerator.generateFeedback.mockReturnValue(mockFeedback);

      const result = await service.generateFeedback(analysisResult);

      expect(mockScoringSystem.calculateContentScore).toHaveBeenCalledWith(analysisResult);
      expect(mockScoringSystem.calculateFormattingScore).toHaveBeenCalledWith(analysisResult);
      expect(mockScoringSystem.calculateKeywordScore).toHaveBeenCalledWith(analysisResult);
      expect(mockFeedbackGenerator.generateFeedback).toHaveBeenCalledWith(analysisResult, mockScores);
      expect(result).toEqual(mockFeedback);
    });

    it('should handle scoring errors gracefully', async () => {
      const analysisResult = { sections: {} };

      mockScoringSystem.calculateContentScore.mockImplementation(() => {
        throw new Error('Scoring failed');
      });

      await expect(service.generateFeedback(analysisResult)).rejects.toThrow('Scoring failed');
    });

    it('should handle feedback generation errors', async () => {
      const analysisResult = { sections: {} };
      const mockScores = { contentScore: 50, formattingScore: 60, keywordScore: 70 };

      mockScoringSystem.calculateContentScore.mockReturnValue(mockScores.contentScore);
      mockScoringSystem.calculateFormattingScore.mockReturnValue(mockScores.formattingScore);
      mockScoringSystem.calculateKeywordScore.mockReturnValue(mockScores.keywordScore);
      mockFeedbackGenerator.generateFeedback.mockImplementation(() => {
        throw new Error('Feedback generation failed');
      });

      await expect(service.generateFeedback(analysisResult)).rejects.toThrow('Feedback generation failed');
    });
  });

  describe('Score Calculation', () => {
    it('should calculate scores using scoring system', async () => {
      const analysisResult = {
        sections: { contact: { present: true } },
        wordCount: 300,
        formattingIssues: { inconsistentCapitalization: false },
        keywordAnalysis: { technicalSkills: ['Python'] }
      };

      const expectedScores = { contentScore: 75, formattingScore: 85, keywordScore: 70 };
      mockScoringSystem.calculateContentScore.mockReturnValue(expectedScores.contentScore);
      mockScoringSystem.calculateFormattingScore.mockReturnValue(expectedScores.formattingScore);
      mockScoringSystem.calculateKeywordScore.mockReturnValue(expectedScores.keywordScore);
      mockFeedbackGenerator.generateFeedback.mockReturnValue({
        overallScore: 75,
        contentScore: 75,
        formattingScore: 85,
        keywordScore: 70,
        suggestions: [],
        strengths: [],
        improvements: [],
        analysis: {},
        recommendations: { high: [], medium: [], low: [] }
      });

      await service.generateFeedback(analysisResult);

      expect(mockScoringSystem.calculateContentScore).toHaveBeenCalledWith(analysisResult);
      expect(mockScoringSystem.calculateFormattingScore).toHaveBeenCalledWith(analysisResult);
      expect(mockScoringSystem.calculateKeywordScore).toHaveBeenCalledWith(analysisResult);
    });

    it('should validate score ranges', async () => {
      const analysisResult = { sections: {} };
      const invalidScores = { contentScore: 150, formattingScore: -10, keywordScore: 200 };

      mockScoringSystem.calculateContentScore.mockReturnValue(invalidScores.contentScore);
      mockScoringSystem.calculateFormattingScore.mockReturnValue(invalidScores.formattingScore);
      mockScoringSystem.calculateKeywordScore.mockReturnValue(invalidScores.keywordScore);

      await expect(service.generateFeedback(analysisResult)).rejects.toThrow('Invalid scores');
    });
  });

  describe('Feedback Customization', () => {
    it('should allow customization of feedback parameters', async () => {
      const analysisResult = { sections: {} };
      const customParams = { 
        includeDetailedAnalysis: true, 
        maxSuggestions: 10,
        focusAreas: ['content', 'formatting'] 
      };

      const mockScores = { contentScore: 80, formattingScore: 85, keywordScore: 75 };
      const mockFeedback = {
        overallScore: 80,
        contentScore: 80,
        formattingScore: 85,
        keywordScore: 75,
        suggestions: [],
        strengths: [],
        improvements: [],
        analysis: {}
      };

      mockScoringSystem.calculateContentScore.mockReturnValue(mockScores.contentScore);
      mockScoringSystem.calculateFormattingScore.mockReturnValue(mockScores.formattingScore);
      mockScoringSystem.calculateKeywordScore.mockReturnValue(mockScores.keywordScore);
      mockFeedbackGenerator.generateFeedback.mockReturnValue({...mockFeedback, recommendations: { high: [], medium: [], low: [] }});

      const result = await service.generateFeedback(analysisResult, customParams);

      expect(result).toBeDefined();
    });

    it('should validate customization parameters', async () => {
      const analysisResult = { sections: {} };
      const invalidParams = { maxSuggestions: -1 };

      await expect(service.generateFeedback(analysisResult, invalidParams)).rejects.toThrow('Invalid parameters');
    });
  });

  describe('Error Handling', () => {
    it('should handle null analysis result', async () => {
      await expect(service.generateFeedback(null as any)).rejects.toThrow('Analysis result is required');
    });

    it('should handle undefined analysis result', async () => {
      await expect(service.generateFeedback(undefined as any)).rejects.toThrow('Analysis result is required');
    });

    it('should handle empty analysis result', async () => {
      const emptyResult = {};
      
      const mockScores = { contentScore: 0, formattingScore: 0, keywordScore: 0 };
      const mockFeedback = {
        overallScore: 0,
        contentScore: 0,
        formattingScore: 0,
        keywordScore: 0,
        suggestions: [],
        strengths: [],
        improvements: [],
        analysis: {}
      };

      mockScoringSystem.calculateContentScore.mockReturnValue(mockScores.contentScore);
      mockScoringSystem.calculateFormattingScore.mockReturnValue(mockScores.formattingScore);
      mockScoringSystem.calculateKeywordScore.mockReturnValue(mockScores.keywordScore);
      mockFeedbackGenerator.generateFeedback.mockReturnValue({...mockFeedback, recommendations: { high: [], medium: [], low: [] }});

      const result = await service.generateFeedback(emptyResult);
      expect(result).toBeDefined();
    });
  });

  describe('Service Configuration', () => {
    it('should allow configuration of feedback parameters', () => {
      const config = { 
        defaultMaxSuggestions: 5,
        enableDetailedAnalysis: true,
        scoringWeights: { content: 0.4, formatting: 0.3, keywords: 0.3 }
      };
      
      expect(() => service.configureFeedback(config)).not.toThrow();
    });

    it('should validate configuration parameters', () => {
      const invalidConfig = { defaultMaxSuggestions: -1 };
      
      expect(() => service.configureFeedback(invalidConfig)).toThrow('Invalid configuration');
    });
  });
});
