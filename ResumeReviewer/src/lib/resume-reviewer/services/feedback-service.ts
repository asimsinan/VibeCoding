import { FeedbackGenerator, FeedbackResult } from '../../core/feedback/feedback-generator';
import { ScoringSystem } from '../../core/scoring/scoring-system';

export interface FeedbackConfig {
  defaultMaxSuggestions?: number;
  enableDetailedAnalysis?: boolean;
  scoringWeights?: {
    content: number;
    formatting: number;
    keywords: number;
  };
}

export interface FeedbackParams {
  includeDetailedAnalysis?: boolean;
  maxSuggestions?: number;
  focusAreas?: string[];
}

export class FeedbackService {
  private feedbackGenerator: FeedbackGenerator;
  private scoringSystem: ScoringSystem;
  private config: FeedbackConfig;

  constructor(
    feedbackGenerator?: FeedbackGenerator,
    scoringSystem?: ScoringSystem
  ) {
    this.feedbackGenerator = feedbackGenerator || new FeedbackGenerator();
    this.scoringSystem = scoringSystem || new ScoringSystem();
    this.config = {
      defaultMaxSuggestions: 5,
      enableDetailedAnalysis: true,
      scoringWeights: {
        content: 0.4,
        formatting: 0.3,
        keywords: 0.3
      }
    };
  }

  async generateFeedback(analysisResult: any, params?: FeedbackParams): Promise<FeedbackResult> {
    if (!analysisResult) {
      throw new Error('Analysis result is required');
    }

    try {
      // Step 1: Calculate scores
      const scores = {
        contentScore: this.scoringSystem.calculateContentScore(analysisResult),
        formattingScore: this.scoringSystem.calculateFormattingScore(analysisResult),
        keywordScore: this.scoringSystem.calculateKeywordScore(analysisResult)
      };
      
      // Step 2: Validate scores
      this.validateScores(scores);

      // Step 3: Generate feedback
      const feedback = this.feedbackGenerator.generateFeedback(analysisResult, scores);

      // Step 4: Apply custom parameters if provided
      if (params) {
        this.validateParameters(params);
        // Apply parameter customizations here if needed
      }

      return feedback;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Feedback generation failed');
    }
  }

  private validateScores(scores: { contentScore: number; formattingScore: number; keywordScore: number }): void {
    const { contentScore, formattingScore, keywordScore } = scores;
    
    if (contentScore < 0 || contentScore > 100) {
      throw new Error('Invalid scores: contentScore out of range');
    }
    if (formattingScore < 0 || formattingScore > 100) {
      throw new Error('Invalid scores: formattingScore out of range');
    }
    if (keywordScore < 0 || keywordScore > 100) {
      throw new Error('Invalid scores: keywordScore out of range');
    }
  }

  private validateParameters(params: FeedbackParams): void {
    if (params.maxSuggestions !== undefined && params.maxSuggestions < 0) {
      throw new Error('Invalid parameters: maxSuggestions must be non-negative');
    }
    if (params.focusAreas !== undefined && !Array.isArray(params.focusAreas)) {
      throw new Error('Invalid parameters: focusAreas must be an array');
    }
  }

  configureFeedback(config: FeedbackConfig): void {
    this.validateConfiguration(config);
    this.config = { ...this.config, ...config };
  }

  private validateConfiguration(config: FeedbackConfig): void {
    if (config.defaultMaxSuggestions !== undefined && config.defaultMaxSuggestions < 0) {
      throw new Error('Invalid configuration: defaultMaxSuggestions must be non-negative');
    }
    if (config.scoringWeights) {
      const { content, formatting, keywords } = config.scoringWeights;
      if (content < 0 || formatting < 0 || keywords < 0) {
        throw new Error('Invalid configuration: scoring weights must be non-negative');
      }
      const sum = content + formatting + keywords;
      if (Math.abs(sum - 1.0) > 0.001) {
        throw new Error('Invalid configuration: scoring weights must sum to 1');
      }
    }
  }

  getConfiguration(): FeedbackConfig {
    return { ...this.config };
  }

  resetConfiguration(): void {
    this.config = {
      defaultMaxSuggestions: 5,
      enableDetailedAnalysis: true,
      scoringWeights: {
        content: 0.4,
        formatting: 0.3,
        keywords: 0.3
      }
    };
  }
}
