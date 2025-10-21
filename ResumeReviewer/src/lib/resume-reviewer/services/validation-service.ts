import { ValidationEngine, ValidationResult } from '../../core/validation/validation-engine';
import { TextProcessor } from '../../core/processing/text-processor';

export interface ValidationConfig {
  minTextLength?: number;
  maxTextLength?: number;
  requireContactInfo?: boolean;
  maxSkillsCount?: number;
  strictMode?: boolean;
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationDate: string;
  gpa?: string;
}

export interface Skills {
  technical: string[];
  soft: string[];
  languages: string[];
  tools: string[];
}

export class ValidationService {
  private validationEngine: ValidationEngine;
  private textProcessor: TextProcessor;
  private config: ValidationConfig;

  constructor(
    validationEngine?: ValidationEngine,
    textProcessor?: TextProcessor
  ) {
    this.validationEngine = validationEngine || new ValidationEngine();
    this.textProcessor = textProcessor || new TextProcessor();
    this.config = {
      minTextLength: 100,
      maxTextLength: 5000,
      requireContactInfo: true,
      maxSkillsCount: 30,
      strictMode: false
    };
  }

  async validateResume(resumeText: string): Promise<ValidationResult> {
    if (!resumeText) {
      throw new Error('Resume text is required');
    }

    try {
      // Step 1: Validate text length
      const isValidLength = this.textProcessor.validateTextLength(resumeText);
      if (!isValidLength) {
        throw new Error('Text length validation failed');
      }

      // Step 2: Validate resume structure
      const validationResult = this.validationEngine.validateStructure(resumeText);

      return validationResult;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Resume validation failed');
    }
  }

  async validateContactInfo(contactInfo: ContactInfo): Promise<ValidationResult> {
    const result = this.validationEngine.validateContactInfo(contactInfo);
    return result;
  }

  async validateWorkExperience(experienceData: WorkExperience): Promise<ValidationResult> {
    const result = this.validationEngine.validateExperience(experienceData);
    return result;
  }

  async validateEducation(educationData: Education): Promise<ValidationResult> {
    const result = this.validationEngine.validateEducation(educationData);
    return result;
  }

  async validateSkills(skillsData: Skills): Promise<ValidationResult> {
    const result = this.validationEngine.validateSkills(skillsData);
    return result;
  }

  configureValidation(config: ValidationConfig): void {
    this.validateConfiguration(config);
    this.config = { ...this.config, ...config };
  }

  private validateConfiguration(config: ValidationConfig): void {
    if (config.minTextLength !== undefined && config.minTextLength <= 0) {
      throw new Error('Invalid configuration: minTextLength must be positive');
    }
    if (config.maxTextLength !== undefined && config.maxTextLength <= 0) {
      throw new Error('Invalid configuration: maxTextLength must be positive');
    }
    if (config.minTextLength !== undefined && config.maxTextLength !== undefined) {
      if (config.maxTextLength <= config.minTextLength) {
        throw new Error('Invalid configuration: maxTextLength must be greater than minTextLength');
      }
    }
    if (config.maxSkillsCount !== undefined && config.maxSkillsCount <= 0) {
      throw new Error('Invalid configuration: maxSkillsCount must be positive');
    }
  }

  getConfiguration(): ValidationConfig {
    return { ...this.config };
  }

  resetConfiguration(): void {
    this.config = {
      minTextLength: 100,
      maxTextLength: 5000,
      requireContactInfo: true,
      maxSkillsCount: 30,
      strictMode: false
    };
  }
}
