export interface ScoreBreakdown {
  contentScore: number;
  formattingScore: number;
  keywordScore: number;
  overallScore: number;
  category: string;
  recommendations: string[];
}

export interface ScoreExplanation {
  content: {
    score: number;
    category: string;
    explanation: string;
  };
  formatting: {
    score: number;
    category: string;
    explanation: string;
  };
  keywords: {
    score: number;
    category: string;
    explanation: string;
  };
}

export class ScoringSystem {
  private readonly SCORE_WEIGHTS = {
    content: 0.4,
    formatting: 0.3,
    keywords: 0.3
  };

  private readonly SCORE_CATEGORIES = {
    excellent: { min: 90, max: 100 },
    good: { min: 80, max: 89 },
    fair: { min: 60, max: 79 },
    poor: { min: 40, max: 59 },
    'needs-improvement': { min: 0, max: 39 }
  };

  calculateContentScore(analysisResult: any): number {
    if (!analysisResult) {
      throw new Error('Analysis result is required');
    }

    let score = 0;
    const sections = analysisResult.sections || {};
    const wordCount = analysisResult.wordCount || 0;
    const readabilityScore = analysisResult.readabilityScore || 0;

    // Section presence scoring (40 points)
    const requiredSections = ['summary', 'experience', 'education', 'skills'];
    const presentSections = requiredSections.filter(section => sections[section]?.present);
    const sectionScore = (presentSections.length / requiredSections.length) * 40;
    score += sectionScore;

    // Section quality scoring (30 points)
    const qualityScores = Object.values(sections).map((section: any) => section?.quality || 0);
    const avgQuality = qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length;
    score += avgQuality * 30;

    // Word count scoring (20 points)
    if (wordCount >= 200 && wordCount <= 1000) {
      score += 20;
    } else if (wordCount >= 150 && wordCount < 200) {
      score += 15;
    } else if (wordCount > 1000 && wordCount <= 1500) {
      score += 15;
    } else {
      score += Math.max(0, 20 - Math.abs(wordCount - 500) / 50);
    }

    // Readability scoring (10 points)
    score += readabilityScore * 10;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  calculateFormattingScore(formattingAnalysis: any): number {
    if (!formattingAnalysis) {
      throw new Error('Formatting analysis is required');
    }

    let score = 100;
    const issues = formattingAnalysis.issues || [];

    // Base deductions for formatting issues (handle both naming conventions)
    if (formattingAnalysis.inconsistentCapitalization || !formattingAnalysis.consistentCapitalization) score -= 15;
    if (formattingAnalysis.missingBulletPoints || !formattingAnalysis.properBulletPoints) score -= 20;
    if (formattingAnalysis.poorSpacing || !formattingAnalysis.consistentSpacing) score -= 10;
    if (formattingAnalysis.noClearHeadings || !formattingAnalysis.properHeadings) score -= 15;

    // Additional deductions for specific issues in the issues array
    issues.forEach((issue: string) => {
      if (issue.includes('capitalization')) score -= 10;
      if (issue.includes('bullet')) score -= 15;
      if (issue.includes('spacing')) score -= 10;
      if (issue.includes('heading')) score -= 15;
    });

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  calculateKeywordScore(keywordAnalysis: any): number {
    if (!keywordAnalysis) {
      throw new Error('Keyword analysis is required');
    }

    let score = 0;
    const technicalSkills = keywordAnalysis.technicalSkills || [];
    const cloudTechnologies = keywordAnalysis.cloudTechnologies || [];
    const methodologies = keywordAnalysis.methodologies || [];
    const industryKeywords = keywordAnalysis.industryKeywords || [];
    const missingKeywords = keywordAnalysis.missingKeywords || [];
    const keywordDensity = keywordAnalysis.keywordDensity || {};

    // Technical skills scoring (50 points)
    const skillScore = Math.min(50, technicalSkills.length * 10);
    score += skillScore;

    // Cloud technologies scoring (40 points)
    const cloudScore = Math.min(40, cloudTechnologies.length * 15);
    score += cloudScore;

    // Methodologies scoring (25 points)
    const methodologyScore = Math.min(25, methodologies.length * 8);
    score += methodologyScore;

    // Industry keywords scoring (25 points)
    const industryScore = Math.min(25, industryKeywords.length * 5);
    score += industryScore;

    // Keyword density bonus (20 points)
    const avgDensity = Object.values(keywordDensity).reduce((sum: number, density: any) => sum + density, 0) / Object.keys(keywordDensity).length;
    if (avgDensity > 0.05) score += 20;
    else if (avgDensity > 0.03) score += 10;

    // Missing keywords penalty (10 points)
    const missingPenalty = Math.min(10, missingKeywords.length * 2);
    score -= missingPenalty;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  calculateOverallScore(scores: { contentScore: number; formattingScore: number; keywordScore: number }): number {
    if (!scores.contentScore && scores.contentScore !== 0) {
      throw new Error('All score components are required');
    }
    if (!scores.formattingScore && scores.formattingScore !== 0) {
      throw new Error('All score components are required');
    }
    if (!scores.keywordScore && scores.keywordScore !== 0) {
      throw new Error('All score components are required');
    }

    // Validate score ranges
    if (!this.validateScore(scores.contentScore) || 
        !this.validateScore(scores.formattingScore) || 
        !this.validateScore(scores.keywordScore)) {
      throw new Error('Score values must be between 0 and 100');
    }

    const weightedScore = 
      (scores.contentScore * this.SCORE_WEIGHTS.content) +
      (scores.formattingScore * this.SCORE_WEIGHTS.formatting) +
      (scores.keywordScore * this.SCORE_WEIGHTS.keywords);

    return Math.round(weightedScore * 1000) / 1000;
  }

  validateScore(score: any): boolean {
    if (typeof score !== 'number') {
      throw new Error('Score must be a number');
    }
    return score >= 0 && score <= 100;
  }

  categorizeScore(score: number): string {
    for (const [category, range] of Object.entries(this.SCORE_CATEGORIES)) {
      if (score >= range.min && score <= range.max) {
        return category;
      }
    }
    return 'needs-improvement';
  }

  getScoreBreakdown(analysisData: any): ScoreBreakdown {
    const contentScore = this.calculateContentScore(analysisData.content);
    const formattingScore = this.calculateFormattingScore(analysisData.formatting);
    const keywordScore = this.calculateKeywordScore(analysisData.keywords);
    const overallScore = this.calculateOverallScore({ contentScore, formattingScore, keywordScore });
    const category = this.categorizeScore(overallScore);
    const recommendations = this.generateRecommendations({ contentScore, formattingScore, keywordScore });

    return {
      contentScore,
      formattingScore,
      keywordScore,
      overallScore,
      category,
      recommendations
    };
  }

  explainScores(scores: { contentScore: number; formattingScore: number; keywordScore: number }): ScoreExplanation {
    return {
      content: {
        score: scores.contentScore,
        category: this.categorizeScore(scores.contentScore),
        explanation: this.getContentExplanation(scores.contentScore)
      },
      formatting: {
        score: scores.formattingScore,
        category: this.categorizeScore(scores.formattingScore),
        explanation: this.getFormattingExplanation(scores.formattingScore)
      },
      keywords: {
        score: scores.keywordScore,
        category: this.categorizeScore(scores.keywordScore),
        explanation: this.getKeywordExplanation(scores.keywordScore)
      }
    };
  }

  private getContentExplanation(score: number): string {
    if (score >= 90) return 'Excellent content with all sections present and high quality';
    if (score >= 80) return 'Good content with most sections and solid quality';
    if (score >= 70) return 'Fair content with room for improvement in sections or quality';
    if (score >= 60) return 'Poor content with significant gaps in sections or quality';
    return 'Content needs major improvement in structure and quality';
  }

  private getFormattingExplanation(score: number): string {
    if (score >= 90) return 'Excellent formatting with consistent structure and clear presentation';
    if (score >= 80) return 'Good formatting with minor inconsistencies';
    if (score >= 70) return 'Fair formatting with some structural issues';
    if (score >= 60) return 'Poor formatting with multiple structural problems';
    return 'Formatting needs significant improvement for professional presentation';
  }

  private getKeywordExplanation(score: number): string {
    if (score >= 90) return 'Excellent keyword usage with comprehensive technical coverage';
    if (score >= 80) return 'Good keyword usage with solid technical representation';
    if (score >= 70) return 'Fair keyword usage with some technical gaps';
    if (score >= 60) return 'Poor keyword usage with significant technical gaps';
    return 'Keyword usage needs major improvement for ATS optimization';
  }

  private generateRecommendations(scores: { contentScore: number; formattingScore: number; keywordScore: number }): string[] {
    const recommendations: string[] = [];

    if (scores.contentScore < 80) {
      recommendations.push('Improve content structure and completeness');
    }
    if (scores.formattingScore < 80) {
      recommendations.push('Enhance formatting consistency and structure');
    }
    if (scores.keywordScore < 80) {
      recommendations.push('Add more relevant technical keywords');
    }

    return recommendations;
  }
}
