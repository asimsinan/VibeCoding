import { ScoringSystem } from '../../core/scoring/scoring-system';

export interface ScoringConfig {
  contentWeight?: number;
  formattingWeight?: number;
  keywordWeight?: number;
  minScoreThreshold?: number;
  maxScoreThreshold?: number;
}

export interface ScoreBreakdown {
  contentScore: number;
  formattingScore: number;
  keywordScore: number;
  overallScore: number;
  breakdown: {
    contentExplanation: string;
    formattingExplanation: string;
    keywordExplanation: string;
  };
}

export class ScoringService {
  private scoringSystem: ScoringSystem;
  private config: ScoringConfig;

  constructor(scoringSystem?: ScoringSystem) {
    this.scoringSystem = scoringSystem || new ScoringSystem();
    this.config = {
      contentWeight: 0.4,
      formattingWeight: 0.3,
      keywordWeight: 0.3,
      minScoreThreshold: 30,
      maxScoreThreshold: 100
    };
  }

  async calculateScores(analysisResult: any): Promise<{ contentScore: number; formattingScore: number; keywordScore: number; overallScore: number }> {
    if (!analysisResult) {
      throw new Error('Analysis result is required');
    }

    try {
      // Calculate individual scores
      const contentScore = this.scoringSystem.calculateContentScore(analysisResult);
      const formattingScore = this.scoringSystem.calculateFormattingScore(analysisResult);
      const keywordScore = this.scoringSystem.calculateKeywordScore(analysisResult);

      // Validate score ranges
      this.validateScoreRange(contentScore, 'contentScore');
      this.validateScoreRange(formattingScore, 'formattingScore');
      this.validateScoreRange(keywordScore, 'keywordScore');

      // Calculate overall score
      const overallScore = this.scoringSystem.calculateOverallScore({ contentScore, formattingScore, keywordScore });

      return {
        contentScore,
        formattingScore,
        keywordScore,
        overallScore
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Score calculation failed');
    }
  }

  async calculateContentScore(analysisResult: any): Promise<number> {
    const score = this.scoringSystem.calculateContentScore(analysisResult);
    this.validateScoreRange(score, 'contentScore');
    return score;
  }

  async calculateFormattingScore(analysisResult: any): Promise<number> {
    const score = this.scoringSystem.calculateFormattingScore(analysisResult);
    this.validateScoreRange(score, 'formattingScore');
    return score;
  }

  async calculateKeywordScore(analysisResult: any): Promise<number> {
    const score = this.scoringSystem.calculateKeywordScore(analysisResult);
    this.validateScoreRange(score, 'keywordScore');
    return score;
  }

  async categorizeScore(score: number): Promise<string> {
    return this.scoringSystem.categorizeScore(score);
  }

  async getScoreBreakdown(analysisResult: any): Promise<ScoreBreakdown> {
    const scores = await this.calculateScores(analysisResult);
    
    const breakdown = {
      contentExplanation: this.getScoreExplanation(scores.contentScore, 'content'),
      formattingExplanation: this.getScoreExplanation(scores.formattingScore, 'formatting'),
      keywordExplanation: this.getScoreExplanation(scores.keywordScore, 'keyword')
    };

    return {
      ...scores,
      breakdown
    };
  }

  private validateScoreRange(score: number, scoreType: string): void {
    if (score < 0 || score > 100) {
      throw new Error(`Invalid score range: ${scoreType} must be between 0 and 100`);
    }
  }

  private getScoreExplanation(score: number, type: string): string {
    if (score >= 90) return `Excellent ${type} with outstanding quality`;
    if (score >= 80) return `Good ${type} with solid quality`;
    if (score >= 70) return `Fair ${type} with room for improvement`;
    if (score >= 60) return `Poor ${type} with significant issues`;
    return `${type} needs major improvement`;
  }

  configureScoring(config: ScoringConfig): void {
    this.validateConfiguration(config);
    this.config = { ...this.config, ...config };
  }

  private validateConfiguration(config: ScoringConfig): void {
    if (config.contentWeight !== undefined && (config.contentWeight < 0 || config.contentWeight > 1)) {
      throw new Error('Invalid configuration: contentWeight must be between 0 and 1');
    }
    if (config.formattingWeight !== undefined && (config.formattingWeight < 0 || config.formattingWeight > 1)) {
      throw new Error('Invalid configuration: formattingWeight must be between 0 and 1');
    }
    if (config.keywordWeight !== undefined && (config.keywordWeight < 0 || config.keywordWeight > 1)) {
      throw new Error('Invalid configuration: keywordWeight must be between 0 and 1');
    }

    // Validate weight sum
    const weights = [
      config.contentWeight ?? this.config.contentWeight!,
      config.formattingWeight ?? this.config.formattingWeight!,
      config.keywordWeight ?? this.config.keywordWeight!
    ];
    
    const sum = weights.reduce((acc, weight) => acc + weight, 0);
    if (Math.abs(sum - 1.0) > 0.001) {
      throw new Error('Weights must sum to 1');
    }

    if (config.minScoreThreshold !== undefined && (config.minScoreThreshold < 0 || config.minScoreThreshold > 100)) {
      throw new Error('Invalid configuration: minScoreThreshold must be between 0 and 100');
    }
    if (config.maxScoreThreshold !== undefined && (config.maxScoreThreshold < 0 || config.maxScoreThreshold > 100)) {
      throw new Error('Invalid configuration: maxScoreThreshold must be between 0 and 100');
    }
    if (config.minScoreThreshold !== undefined && config.maxScoreThreshold !== undefined) {
      if (config.maxScoreThreshold <= config.minScoreThreshold) {
        throw new Error('Invalid configuration: maxScoreThreshold must be greater than minScoreThreshold');
      }
    }
  }

  getConfiguration(): ScoringConfig {
    return { ...this.config };
  }

  resetConfiguration(): void {
    this.config = {
      contentWeight: 0.4,
      formattingWeight: 0.3,
      keywordWeight: 0.3,
      minScoreThreshold: 30,
      maxScoreThreshold: 100
    };
  }
}
