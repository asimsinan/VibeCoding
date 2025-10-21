import { TextProcessor, ResumeSections, TechnicalSkills } from '../../core/processing/text-processor';

export interface ProcessingConfig {
  maxTextLength?: number;
  minTextLength?: number;
  enableSpamDetection?: boolean;
  preserveFormatting?: boolean;
  strictMode?: boolean;
}

export class TextProcessingService {
  private textProcessor: TextProcessor;
  private config: ProcessingConfig;

  constructor(textProcessor?: TextProcessor) {
    this.textProcessor = textProcessor || new TextProcessor();
    this.config = {
      maxTextLength: 10000,
      minTextLength: 100,
      enableSpamDetection: true,
      preserveFormatting: true,
      strictMode: false
    };
  }

  async cleanText(rawText: string): Promise<string> {
    if (!rawText) {
      throw new Error('Text is required');
    }

    try {
      return this.textProcessor.cleanText(rawText);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Text processing failed');
    }
  }

  async detectSections(resumeText: string): Promise<ResumeSections> {
    return this.textProcessor.detectSections(resumeText);
  }

  async extractEmails(resumeText: string): Promise<string[]> {
    return this.textProcessor.extractEmails(resumeText);
  }

  async extractPhoneNumbers(resumeText: string): Promise<string[]> {
    return this.textProcessor.extractPhoneNumbers(resumeText);
  }

  async extractLinkedInProfiles(resumeText: string): Promise<string[]> {
    return this.textProcessor.extractLinkedInProfiles(resumeText);
  }

  async extractGitHubProfiles(resumeText: string): Promise<string[]> {
    return this.textProcessor.extractGitHubProfiles(resumeText);
  }

  async extractTechnicalSkills(resumeText: string): Promise<TechnicalSkills> {
    return this.textProcessor.extractTechnicalSkills(resumeText);
  }

  async extractSoftSkills(resumeText: string): Promise<string[]> {
    return this.textProcessor.extractSoftSkills(resumeText);
  }

  async extractIndustryKeywords(resumeText: string): Promise<string[]> {
    return this.textProcessor.extractIndustryKeywords(resumeText);
  }

  async getWordCount(resumeText: string): Promise<number> {
    return this.textProcessor.getWordCount(resumeText);
  }

  async calculateReadabilityScore(resumeText: string): Promise<number> {
    return this.textProcessor.calculateReadability(resumeText);
  }

  async detectActionVerbs(resumeText: string): Promise<string[]> {
    return this.textProcessor.extractActionVerbs(resumeText);
  }

  async extractQuantifiedAchievements(resumeText: string): Promise<string[]> {
    return this.textProcessor.extractQuantifiedAchievements(resumeText);
  }

  async validateTextLength(resumeText: string): Promise<boolean> {
    return this.textProcessor.validateTextLength(resumeText);
  }

  async detectSpamContent(resumeText: string): Promise<boolean> {
    // This would be implemented based on spam detection logic
    // For now, return false as a placeholder
    return false;
  }

  async handleEncodingIssues(textWithIssues: string): Promise<string> {
    // This would handle encoding issues like accented characters
    // For now, return the text as-is
    return textWithIssues;
  }

  configureProcessing(config: ProcessingConfig): void {
    this.validateConfiguration(config);
    this.config = { ...this.config, ...config };
  }

  private validateConfiguration(config: ProcessingConfig): void {
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

  getConfiguration(): ProcessingConfig {
    return { ...this.config };
  }

  resetConfiguration(): void {
    this.config = {
      maxTextLength: 10000,
      minTextLength: 100,
      enableSpamDetection: true,
      preserveFormatting: true,
      strictMode: false
    };
  }
}
