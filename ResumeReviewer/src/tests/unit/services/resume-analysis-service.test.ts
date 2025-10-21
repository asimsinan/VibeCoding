import { ResumeAnalysisService } from '../../../lib/resume-reviewer/services/resume-analysis-service';
import { ResumeAnalysisEngine } from '../../../lib/core/analysis/resume-analysis-engine';
import { TextProcessor } from '../../../lib/core/processing/text-processor';
import { ValidationEngine } from '../../../lib/core/validation/validation-engine';

// Mock the core modules
jest.mock('../../../lib/core/analysis/resume-analysis-engine');
jest.mock('../../../lib/core/processing/text-processor');
jest.mock('../../../lib/core/validation/validation-engine');

describe('ResumeAnalysisService', () => {
  let service: ResumeAnalysisService;
  let mockAnalysisEngine: jest.Mocked<ResumeAnalysisEngine>;
  let mockTextProcessor: jest.Mocked<TextProcessor>;
  let mockValidationEngine: jest.Mocked<ValidationEngine>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAnalysisEngine = new ResumeAnalysisEngine() as jest.Mocked<ResumeAnalysisEngine>;
    mockTextProcessor = new TextProcessor() as jest.Mocked<TextProcessor>;
    mockValidationEngine = new ValidationEngine() as jest.Mocked<ValidationEngine>;
    
    service = new ResumeAnalysisService(mockAnalysisEngine, mockTextProcessor, mockValidationEngine);
  });

  describe('Resume Processing', () => {
    it('should process resume text and return analysis result', async () => {
      const resumeText = 'John Doe\nSoftware Engineer\nExperience: 5 years';
      const mockAnalysisResult = {
        sections: { contact: { present: true }, experience: { present: true } },
        wordCount: 10,
        readabilityScore: 75,
        missingSections: [],
        formattingIssues: { inconsistentCapitalization: false },
        contactInfo: { name: 'John Doe', email: 'john@example.com' },
        experienceDepth: { totalYears: 5 },
        keywordAnalysis: { technicalSkills: ['JavaScript'] },
        contentQuality: { weakActionVerbsCount: 0 }
      };

      mockTextProcessor.cleanText.mockReturnValue(resumeText);
      mockValidationEngine.validateStructure.mockReturnValue({ isValid: true, errors: [], score: 100, suggestions: [] });
      mockAnalysisEngine.analyzeContent.mockReturnValue(mockAnalysisResult);

      const result = await service.processResume(resumeText);

      expect(mockTextProcessor.cleanText).toHaveBeenCalledWith(resumeText);
      expect(mockValidationEngine.validateStructure).toHaveBeenCalledWith(resumeText);
      expect(mockAnalysisEngine.analyzeContent).toHaveBeenCalledWith(resumeText);
      expect(result).toEqual(mockAnalysisResult);
    });

    it('should handle validation errors gracefully', async () => {
      const resumeText = 'Invalid resume';
      const validationErrors = ['Missing contact information', 'No work experience'];

      mockTextProcessor.cleanText.mockReturnValue(resumeText);
      mockValidationEngine.validateStructure.mockReturnValue({ 
        isValid: false, 
        errors: validationErrors,
        warnings: [],
        score: 0,
        suggestions: []
      });

      await expect(service.processResume(resumeText)).rejects.toThrow('Resume validation failed');
    });

    it('should handle text processing errors', async () => {
      const resumeText = '';

      mockTextProcessor.cleanText.mockImplementation(() => {
        throw new Error('Text processing failed');
      });

      await expect(service.processResume(resumeText)).rejects.toThrow('Resume text is required');
    });
  });

  describe('Analysis Orchestration', () => {
    it('should coordinate all analysis components', async () => {
      const resumeText = 'Complete resume text';
      const cleanedText = 'cleaned resume text';
      const analysisResult = { sections: {}, wordCount: 100 };

      mockTextProcessor.cleanText.mockReturnValue(cleanedText);
      mockValidationEngine.validateStructure.mockReturnValue({ isValid: true, errors: [], warnings: [], score: 100, suggestions: [] });
      mockAnalysisEngine.analyzeContent.mockReturnValue(analysisResult);

      await service.processResume(resumeText);

      expect(mockTextProcessor.cleanText).toHaveBeenCalledWith(resumeText);
      expect(mockValidationEngine.validateStructure).toHaveBeenCalledWith(cleanedText);
      expect(mockAnalysisEngine.analyzeContent).toHaveBeenCalledWith(cleanedText);
    });

    it('should provide analysis metadata', async () => {
      const resumeText = 'Test resume';
      const analysisResult = { sections: {}, wordCount: 50 };

      mockTextProcessor.cleanText.mockReturnValue(resumeText);
      mockValidationEngine.validateStructure.mockReturnValue({ isValid: true, errors: [], warnings: [], score: 100, suggestions: [] });
      mockAnalysisEngine.analyzeContent.mockReturnValue(analysisResult);

      const result = await service.processResume(resumeText);

      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('wordCount');
    });
  });

  describe('Error Handling', () => {
    it('should handle null input gracefully', async () => {
      await expect(service.processResume(null as any)).rejects.toThrow();
    });

    it('should handle undefined input gracefully', async () => {
      await expect(service.processResume(undefined as any)).rejects.toThrow();
    });

    it('should handle analysis engine errors', async () => {
      const resumeText = 'Valid resume text';

      mockTextProcessor.cleanText.mockReturnValue(resumeText);
      mockValidationEngine.validateStructure.mockReturnValue({ isValid: true, errors: [], warnings: [], score: 100, suggestions: [] });
      mockAnalysisEngine.analyzeContent.mockImplementation(() => {
        throw new Error('Analysis failed');
      });

      await expect(service.processResume(resumeText)).rejects.toThrow('Analysis failed');
    });
  });

  describe('Service Configuration', () => {
    it('should allow configuration of analysis parameters', () => {
      const config = { maxTextLength: 10000, minTextLength: 100 };
      
      expect(() => service.configureAnalysis(config)).not.toThrow();
    });

    it('should validate configuration parameters', () => {
      const invalidConfig = { maxTextLength: -1 };
      
      expect(() => service.configureAnalysis(invalidConfig)).toThrow('Invalid configuration');
    });
  });
});
