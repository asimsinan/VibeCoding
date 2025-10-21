import { ResumeAnalysisEngine, ResumeAnalysisResult } from '../../core/analysis/resume-analysis-engine';
import { TextProcessor } from '../../core/processing/text-processor';
import { ValidationEngine } from '../../core/validation/validation-engine';

export interface AnalysisConfig {
  maxTextLength?: number;
  minTextLength?: number;
  enableValidation?: boolean;
  strictMode?: boolean;
}

export class ResumeAnalysisService {
  private analysisEngine: ResumeAnalysisEngine;
  private textProcessor: TextProcessor;
  private validationEngine: ValidationEngine;
  private config: AnalysisConfig;

  constructor(
    analysisEngine?: ResumeAnalysisEngine,
    textProcessor?: TextProcessor,
    validationEngine?: ValidationEngine
  ) {
    this.analysisEngine = analysisEngine || new ResumeAnalysisEngine();
    this.textProcessor = textProcessor || new TextProcessor();
    this.validationEngine = validationEngine || new ValidationEngine();
    this.config = {
      maxTextLength: 5000,
      minTextLength: 50,
      enableValidation: true,
      strictMode: false
    };
  }

  async processResume(resumeText: string): Promise<ResumeAnalysisResult> {
    if (!resumeText) {
      throw new Error('Resume text is required');
    }

    try {
      // Step 1: Clean and normalize text
      const cleanedText = this.textProcessor.cleanText(resumeText);
      
      // Step 2: Validate resume structure (if enabled)
      if (this.config.enableValidation) {
        const validationResult = this.validationEngine.validateStructure(cleanedText);
        if (!validationResult.isValid) {
          throw new Error('Resume validation failed');
        }
      }

      // Step 3: Perform comprehensive analysis
      const analysisResult = this.analysisEngine.analyzeContent(cleanedText);

      return analysisResult;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Resume processing failed');
    }
  }

  configureAnalysis(config: AnalysisConfig): void {
    this.validateConfiguration(config);
    this.config = { ...this.config, ...config };
  }

  private validateConfiguration(config: AnalysisConfig): void {
    if (config.maxTextLength !== undefined && config.maxTextLength <= 0) {
      throw new Error('Invalid configuration: maxTextLength must be positive');
    }
    if (config.minTextLength !== undefined && config.minTextLength <= 0) {
      throw new Error('Invalid configuration: minTextLength must be positive');
    }
    if (config.maxTextLength !== undefined && config.minTextLength !== undefined) {
      if (config.maxTextLength <= config.minTextLength) {
        throw new Error('Invalid configuration: maxTextLength must be greater than minTextLength');
      }
    }
  }

  getConfiguration(): AnalysisConfig {
    return { ...this.config };
  }

  resetConfiguration(): void {
    this.config = {
      maxTextLength: 5000,
      minTextLength: 50,
      enableValidation: true,
      strictMode: false
    };
  }
}
