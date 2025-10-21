export interface FeedbackResult {
  overallScore: number;
  suggestions: string[];
  strengths: string[];
  improvements: string[];
  analysis: DetailedAnalysis;
  recommendations: {
    high: string[];
    medium: string[];
    low: string[];
  };
}

export interface DetailedAnalysis {
  summary?: {
    score: number;
    recommendations: string[];
  };
  experience?: {
    score: number;
    recommendations: string[];
  };
  education?: {
    score: number;
    recommendations: string[];
  };
  skills?: {
    score: number;
    recommendations: string[];
  };
}

export class FeedbackGenerator {
  generateSuggestions(analysisResult: any): string[] {
    const suggestions: string[] = [];

    // Content suggestions
    if (analysisResult.content) {
      const content = analysisResult.content;
      
      if (content.missingSections?.length > 0) {
        content.missingSections.forEach((section: string) => {
          if (section === 'summary') {
            suggestions.push('Add a professional summary section');
          } else {
            suggestions.push(`Add a ${section} section`);
          }
        });
      }

      if (content.weakActionVerbs?.length > 0) {
        suggestions.push('Use stronger action verbs like "developed" or "implemented"');
      }

      if (content.genericPhrases?.length > 0) {
        suggestions.push('Replace generic phrases with specific achievements');
      }

      if (content.quantifiedAchievements === 0) {
        suggestions.push('Include quantified results and metrics');
      }
    }

    // Formatting suggestions
    if (analysisResult.formatting) {
      const formatting = analysisResult.formatting;
      
      if (formatting.inconsistentCapitalization) {
        suggestions.push('Use consistent capitalization throughout');
      }
      if (formatting.missingBulletPoints) {
        suggestions.push('Add bullet points for better readability');
      }
      if (formatting.poorSpacing) {
        suggestions.push('Improve spacing between sections');
      }
      if (formatting.noClearHeadings) {
        suggestions.push('Use clear section headings');
      }
    }

    // Keyword suggestions
    if (analysisResult.keywords) {
      const keywords = analysisResult.keywords;
      
      if (keywords.missingKeywords?.length > 0) {
        suggestions.push('Include relevant technical keywords');
      }
      if (keywords.lowKeywordDensity) {
        suggestions.push('Increase keyword density for better ATS compatibility');
      }
      if (keywords.outdatedTechnologies?.length > 0) {
        suggestions.push('Remove outdated technologies');
      }
    }

    return this.prioritizeSuggestions(suggestions);
  }

  private prioritizeSuggestions(suggestions: string[]): string[] {
    const priorityMap: Record<string, number> = {
      'summary': 1,
      'skills': 2,
      'action verbs': 3,
      'quantified': 4,
      'keywords': 5,
      'formatting': 6
    };

    return suggestions.sort((a, b) => {
      const aPriority = this.getSuggestionPriority(a, priorityMap);
      const bPriority = this.getSuggestionPriority(b, priorityMap);
      return aPriority - bPriority;
    });
  }

  private getSuggestionPriority(suggestion: string, priorityMap: Record<string, number>): number {
    const lowerSuggestion = suggestion.toLowerCase();
    for (const [key, priority] of Object.entries(priorityMap)) {
      if (lowerSuggestion.includes(key)) {
        return priority;
      }
    }
    return 10; // Default priority
  }

  identifyStrengths(analysisResult: any): string[] {
    const strengths: string[] = [];

    // Content strengths
    if (analysisResult.content) {
      const content = analysisResult.content;
      
      if (content.sections) {
        const presentSections = Object.values(content.sections).filter((section: any) => section.present);
        if (presentSections.length >= 3) {
          strengths.push('Well-structured resume with all essential sections');
        }
      }

      if (content.strongActionVerbs?.length > 0) {
        strengths.push('Strong use of action verbs');
      }

      if (content.industryKeywords?.length > 0) {
        strengths.push('Good use of industry-relevant keywords');
      }

      if (content.quantifiedAchievements > 0) {
        strengths.push('Includes quantified achievements');
      }
    }

    // Formatting strengths
    if (analysisResult.formatting) {
      const formatting = analysisResult.formatting;
      
      if (formatting.consistentCapitalization && 
          formatting.properBulletPoints && 
          formatting.consistentSpacing && 
          formatting.clearHeadings) {
        strengths.push('Professional formatting and structure');
      }
      if (formatting.consistentCapitalization) {
        strengths.push('Consistent capitalization throughout');
      }
      if (formatting.clearHeadings) {
        strengths.push('Clear section organization');
      }
    }

    // Keyword strengths
    if (analysisResult.keywords) {
      const keywords = analysisResult.keywords;
      
      if (keywords.technicalSkills?.length >= 4) {
        strengths.push('Comprehensive technical skills listed');
      }
      
      if (keywords.keywordDensity) {
        const avgDensity = Object.values(keywords.keywordDensity).reduce((sum: number, density: any) => sum + density, 0) / Object.keys(keywords.keywordDensity).length;
        if (avgDensity > 0.05) {
          strengths.push('Good keyword density for ATS optimization');
        }
      }

      if (keywords.cloudTechnologies?.length > 0 && keywords.methodologies?.length > 0) {
        strengths.push('Includes modern technologies and methodologies');
      }
    }

    return strengths;
  }

  identifyImprovements(analysisResult: any): string[] {
    const improvements: string[] = [];

    // Content improvements
    if (analysisResult.content) {
      const content = analysisResult.content;
      
      if (content.missingSections?.length > 0) {
        improvements.push('Add missing sections to improve completeness');
      }
      
      if (content.weakActionVerbs?.length > 0) {
        improvements.push('Replace weak action verbs with stronger alternatives');
      }
      
      if (content.genericPhrases?.length > 0) {
        improvements.push('Remove generic phrases and add specific achievements');
      }
      
      if (content.quantifiedAchievements === 0) {
        improvements.push('Include quantified results and metrics');
      }
      
      if (content.wordCount < 200) {
        improvements.push('Expand content to meet recommended length');
      }
    }

    // Formatting improvements
    if (analysisResult.formatting) {
      const formatting = analysisResult.formatting;
      
      if (formatting.inconsistentCapitalization) {
        improvements.push('Fix capitalization inconsistencies');
      }
      if (formatting.missingBulletPoints) {
        improvements.push('Add bullet points for better readability');
      }
      if (formatting.poorSpacing || formatting.noClearHeadings) {
        improvements.push('Improve overall formatting and spacing');
      }
    }

    // Keyword improvements
    if (analysisResult.keywords) {
      const keywords = analysisResult.keywords;
      
      if (keywords.missingKeywords?.length > 0) {
        improvements.push('Include more relevant technical keywords');
      }
      if (keywords.lowKeywordDensity) {
        improvements.push('Increase keyword density for better ATS performance');
      }
      if (keywords.outdatedTechnologies?.length > 0) {
        improvements.push('Remove outdated technologies');
      }
      if (keywords.genericSkills?.length > 0) {
        improvements.push('Replace generic skills with specific technical skills');
      }
    }

    return improvements;
  }

  generateDetailedAnalysis(analysisResult: any): DetailedAnalysis {
    const analysis: DetailedAnalysis = {};

    if (analysisResult.sections) {
      Object.entries(analysisResult.sections).forEach(([sectionName, sectionData]: [string, any]) => {
        const score = Math.round((sectionData.quality || 0) * 100);
        const recommendations = this.generateSectionRecommendations(sectionName, sectionData);

        analysis[sectionName as keyof DetailedAnalysis] = {
          score,
          recommendations
        };
      });
    }

    return analysis;
  }

  private generateSectionRecommendations(sectionName: string, sectionData: any): string[] {
    const recommendations: string[] = [];

    switch (sectionName) {
      case 'summary':
        if (sectionData.quality < 0.7) {
          recommendations.push('Make summary more specific to your role');
          recommendations.push('Include quantifiable achievements');
        }
        break;
      case 'experience':
        if (sectionData.quality < 0.8) {
          recommendations.push('Add more detailed job descriptions');
          recommendations.push('Include specific accomplishments');
        }
        break;
      case 'education':
        if (sectionData.quality < 0.6) {
          recommendations.push('Include graduation dates');
          recommendations.push('Add relevant coursework or projects');
        }
        break;
      case 'skills':
        if (sectionData.quality < 0.7) {
          recommendations.push('Add more technical skills');
          recommendations.push('Include proficiency levels');
        }
        break;
    }

    return recommendations;
  }

  explainScores(scores: { contentScore: number; formattingScore: number; keywordScore: number }): any {
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

  private categorizeScore(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'needs-improvement';
  }

  private getContentExplanation(score: number): string {
    if (score >= 90) return 'Excellent content with all sections present and high quality';
    if (score >= 75) return 'Good content with a good foundation and solid quality';
    if (score >= 60) return 'Fair content with room for improvement in sections or quality';
    if (score >= 40) return 'Poor content with significant gaps in sections or quality';
    return 'Content needs major improvement in structure and quality';
  }

  private getFormattingExplanation(score: number): string {
    if (score >= 90) return 'excellent formatting with consistent structure and clear presentation';
    if (score >= 80) return 'Good formatting with minor inconsistencies';
    if (score >= 70) return 'Fair formatting with some structural issues';
    if (score >= 40) return 'Poor formatting with multiple structural problems';
    return 'Formatting needs significant improvement for professional presentation';
  }

  private getKeywordExplanation(score: number): string {
    if (score >= 90) return 'Excellent keyword usage with comprehensive technical coverage';
    if (score >= 80) return 'Good keyword usage with solid technical representation';
    if (score >= 60) return 'Fair keyword usage with some technical gaps';
    if (score >= 40) return 'Poor keyword usage that needs improvement for better ATS performance';
    return 'Keyword usage needs improvement for better ATS performance';
  }

  generatePriorityRecommendations(analysisResult: any): { high: string[]; medium: string[]; low: string[] } {
    const recommendations = {
      high: [] as string[],
      medium: [] as string[],
      low: [] as string[]
    };

    // High priority recommendations
    if (analysisResult.content?.missingSections?.includes('summary')) {
      recommendations.high.push('Add professional summary section');
    }
    if (analysisResult.content?.weakActionVerbs?.length > 0) {
      // Add specific actionable recommendations for weak action verbs
      const weakVerbs = analysisResult.content.weakActionVerbs;
      if (weakVerbs.includes('did')) {
        recommendations.high.push('Replace "did" with "developed" or "implemented"');
      }
      if (weakVerbs.includes('made')) {
        recommendations.high.push('Replace "made" with "created" or "built"');
      }
      if (weakVerbs.includes('helped')) {
        recommendations.high.push('Replace "helped" with "collaborated" or "supported"');
      }
    }
    if (analysisResult.keywords?.missingKeywords?.length > 0) {
      recommendations.high.push('Include relevant technical keywords');
    }

    // Medium priority recommendations
    if (analysisResult.content?.genericPhrases?.length > 0) {
      recommendations.medium.push('Replace generic phrases with specific achievements');
    }
    if (analysisResult.content?.weakActionVerbs?.length > 0) {
      recommendations.medium.push('Use stronger action verbs');
    }

    // Low priority recommendations
    if (analysisResult.formatting?.inconsistentCapitalization) {
      recommendations.low.push('Fix capitalization inconsistencies');
    }
    if (analysisResult.formatting?.poorSpacing) {
      recommendations.low.push('Improve spacing and formatting');
    }

    return recommendations;
  }

  generateFeedback(analysisResult: any, scores: { contentScore: number; formattingScore: number; keywordScore: number }): FeedbackResult {
    if (!analysisResult || !scores) {
      throw new Error('Analysis result and scores are required');
    }

    const suggestions = this.generateSuggestions(analysisResult);
    const strengths = this.identifyStrengths(analysisResult);
    const improvements = this.identifyImprovements(analysisResult);
    const analysis = this.generateDetailedAnalysis(analysisResult);
    const recommendations = this.generatePriorityRecommendations(analysisResult);

    const overallScore = Math.round(
      (scores.contentScore * 0.4) + 
      (scores.formattingScore * 0.3) + 
      (scores.keywordScore * 0.3)
    );

    return {
      overallScore,
      suggestions,
      strengths,
      improvements,
      analysis,
      recommendations
    };
  }
}
