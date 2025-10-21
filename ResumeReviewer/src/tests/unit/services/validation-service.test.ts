import { ValidationService } from '../../../lib/resume-reviewer/services/validation-service';
import { ValidationEngine } from '../../../lib/core/validation/validation-engine';
import { TextProcessor } from '../../../lib/core/processing/text-processor';

// Mock the core modules
jest.mock('../../../lib/core/validation/validation-engine');
jest.mock('../../../lib/core/processing/text-processor');

describe('ValidationService', () => {
  let service: ValidationService;
  let mockValidationEngine: jest.Mocked<ValidationEngine>;
  let mockTextProcessor: jest.Mocked<TextProcessor>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockValidationEngine = new ValidationEngine() as jest.Mocked<ValidationEngine>;
    mockTextProcessor = new TextProcessor() as jest.Mocked<TextProcessor>;
    
    service = new ValidationService(mockValidationEngine, mockTextProcessor);
  });

  describe('Resume Validation', () => {
    it('should validate resume structure and content', async () => {
      const resumeText = 'John Doe\nSoftware Engineer\njohn@example.com\n(555) 123-4567';
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: ['Consider adding a professional summary'],
        score: 85
      };

      mockTextProcessor.validateTextLength.mockReturnValue(true);
      mockValidationEngine.validateStructure.mockReturnValue(mockValidationResult);

      const result = await service.validateResume(resumeText);

      expect(mockTextProcessor.validateTextLength).toHaveBeenCalledWith(resumeText);
      expect(mockValidationEngine.validateStructure).toHaveBeenCalledWith(resumeText);
      expect(result).toEqual(mockValidationResult);
    });

    it('should handle text length validation failures', async () => {
      const shortText = 'Too short';
      const longText = 'A'.repeat(10000);

      mockTextProcessor.validateTextLength.mockReturnValue(false);

      await expect(service.validateResume(shortText)).rejects.toThrow('Text length validation failed');
      await expect(service.validateResume(longText)).rejects.toThrow('Text length validation failed');
    });

    it('should handle validation engine errors', async () => {
      const resumeText = 'Valid length text';

      mockTextProcessor.validateTextLength.mockReturnValue(true);
      mockValidationEngine.validateStructure.mockImplementation(() => {
        throw new Error('Validation engine failed');
      });

      await expect(service.validateResume(resumeText)).rejects.toThrow('Validation engine failed');
    });
  });

  describe('Contact Information Validation', () => {
    it('should validate contact information format', async () => {
      const contactInfo = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        linkedin: 'https://linkedin.com/in/johndoe'
      };

      const mockResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      mockValidationEngine.validateContactInfo.mockReturnValue(mockResult);

      const result = await service.validateContactInfo(contactInfo);

      expect(mockValidationEngine.validateContactInfo).toHaveBeenCalledWith(contactInfo);
      expect(result).toEqual(mockResult);
    });

    it('should flag invalid email formats', async () => {
      const invalidContactInfo = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '(555) 123-4567'
      };

      const mockResult = {
        isValid: false,
        errors: ['Invalid email format'],
        warnings: []
      };

      mockValidationEngine.validateContactInfo.mockReturnValue(mockResult);

      const result = await service.validateContactInfo(invalidContactInfo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should flag invalid phone formats', async () => {
      const invalidContactInfo = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: 'invalid-phone'
      };

      const mockResult = {
        isValid: false,
        errors: ['Invalid phone number format'],
        warnings: []
      };

      mockValidationEngine.validateContactInfo.mockReturnValue(mockResult);

      const result = await service.validateContactInfo(invalidContactInfo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid phone number format');
    });
  });

  describe('Experience Validation', () => {
    it('should validate work experience format', async () => {
      const experienceData = {
        company: 'Tech Corp',
        position: 'Software Engineer',
        startDate: '2020-01',
        endDate: '2023-12',
        description: 'Developed web applications using React and Node.js'
      };

      const mockResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      mockValidationEngine.validateExperience.mockReturnValue(mockResult);

      const result = await service.validateWorkExperience(experienceData);

      expect(mockValidationEngine.validateExperience).toHaveBeenCalledWith(experienceData);
      expect(result).toEqual(mockResult);
    });

    it('should detect employment gaps', async () => {
      const experienceData = {
        company: 'Tech Corp',
        position: 'Software Engineer',
        startDate: '2020-01',
        endDate: '2023-12',
        description: 'Worked on various projects'
      };

      const mockResult = {
        isValid: true,
        errors: [],
        warnings: ['Employment gap detected between positions']
      };

      mockValidationEngine.validateExperience.mockReturnValue(mockResult);

      const result = await service.validateWorkExperience(experienceData);

      expect(result.warnings).toContain('Employment gap detected between positions');
    });

    it('should flag missing job descriptions', async () => {
      const incompleteExperience = {
        company: 'Tech Corp',
        position: 'Software Engineer',
        startDate: '2020-01',
        endDate: '2023-12',
        description: ''
      };

      const mockResult = {
        isValid: false,
        errors: ['Job description is required'],
        warnings: []
      };

      mockValidationEngine.validateExperience.mockReturnValue(mockResult);

      const result = await service.validateWorkExperience(incompleteExperience);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Job description is required');
    });
  });

  describe('Education Validation', () => {
    it('should validate education entries', async () => {
      const educationData = {
        institution: 'University of Technology',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        graduationDate: '2019-05',
        gpa: '3.8'
      };

      const mockResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      mockValidationEngine.validateEducation.mockReturnValue(mockResult);

      const result = await service.validateEducation(educationData);

      expect(mockValidationEngine.validateEducation).toHaveBeenCalledWith(educationData);
      expect(result).toEqual(mockResult);
    });

    it('should flag invalid GPA formats', async () => {
      const invalidEducation = {
        institution: 'University',
        degree: 'Bachelor',
        field: 'Computer Science',
        graduationDate: '2019-05',
        gpa: 'invalid-gpa'
      };

      const mockResult = {
        isValid: false,
        errors: ['Invalid GPA format'],
        warnings: []
      };

      mockValidationEngine.validateEducation.mockReturnValue(mockResult);

      const result = await service.validateEducation(invalidEducation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid GPA format');
    });
  });

  describe('Skills Validation', () => {
    it('should validate skills categorization', async () => {
      const skillsData = {
        technical: ['JavaScript', 'Python', 'React'],
        soft: ['Leadership', 'Communication'],
        languages: ['English', 'Spanish']
      };

      const mockResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      mockValidationEngine.validateSkills.mockReturnValue(mockResult);

      const result = await service.validateSkills(skillsData);

      expect(mockValidationEngine.validateSkills).toHaveBeenCalledWith(skillsData);
      expect(result).toEqual(mockResult);
    });

    it('should flag too many skills', async () => {
      const excessiveSkills = {
        technical: Array(50).fill('Skill'),
        soft: Array(20).fill('Soft Skill'),
        languages: ['English']
      };

      const mockResult = {
        isValid: false,
        errors: ['Too many skills listed'],
        warnings: []
      };

      mockValidationEngine.validateSkills.mockReturnValue(mockResult);

      const result = await service.validateSkills(excessiveSkills);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Too many skills listed');
    });
  });

  describe('Error Handling', () => {
    it('should handle null input gracefully', async () => {
      await expect(service.validateResume(null as any)).rejects.toThrow();
    });

    it('should handle undefined input gracefully', async () => {
      await expect(service.validateResume(undefined as any)).rejects.toThrow();
    });

    it('should handle empty input gracefully', async () => {
      const emptyText = '';
      
      mockTextProcessor.validateTextLength.mockReturnValue(false);

      await expect(service.validateResume(emptyText)).rejects.toThrow('Resume text is required');
    });
  });

  describe('Service Configuration', () => {
    it('should allow configuration of validation rules', () => {
      const config = {
        minTextLength: 100,
        maxTextLength: 5000,
        requireContactInfo: true,
        maxSkillsCount: 30
      };
      
      expect(() => service.configureValidation(config)).not.toThrow();
    });

    it('should validate configuration parameters', () => {
      const invalidConfig = { minTextLength: -1 };
      
      expect(() => service.configureValidation(invalidConfig)).toThrow('Invalid configuration');
    });
  });
});
