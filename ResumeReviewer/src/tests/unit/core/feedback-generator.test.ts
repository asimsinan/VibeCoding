import { describe, it, expect, beforeEach } from '@jest/globals';
import { FeedbackGenerator } from '@/lib/core/feedback/feedback-generator';

// Feedback Generation System Tests
describe('FeedbackGenerator', () => {
  let feedbackGenerator: FeedbackGenerator;

  beforeEach(() => {
    feedbackGenerator = new FeedbackGenerator();
  });

  describe('Suggestions Generation', () => {
    it('should generate content suggestions', () => {
      const analysisResult = {
        content: {
          missingSections: ['summary'],
          weakActionVerbs: ['did', 'made'],
          genericPhrases: ['hardworking', 'team player'],
          quantifiedAchievements: 0
        }
      };

      const suggestions = feedbackGenerator.generateSuggestions(analysisResult);

      expect(suggestions).toBeDefined();
      expect(suggestions).toContain('Add a professional summary section');
      expect(suggestions).toContain('Use stronger action verbs like "developed" or "implemented"');
      expect(suggestions).toContain('Replace generic phrases with specific achievements');
      expect(suggestions).toContain('Include quantified results and metrics');
    });

    it('should generate formatting suggestions', () => {
      const analysisResult = {
        formatting: {
          inconsistentCapitalization: true,
          missingBulletPoints: true,
          poorSpacing: true,
          noClearHeadings: true
        }
      };

      const suggestions = feedbackGenerator.generateSuggestions(analysisResult);

      expect(suggestions).toContain('Use consistent capitalization throughout');
      expect(suggestions).toContain('Add bullet points for better readability');
      expect(suggestions).toContain('Improve spacing between sections');
      expect(suggestions).toContain('Use clear section headings');
    });

    it('should generate keyword suggestions', () => {
      const analysisResult = {
        keywords: {
          missingKeywords: ['JavaScript', 'React', 'Node.js'],
          lowKeywordDensity: true,
          outdatedTechnologies: ['jQuery', 'Flash']
        }
      };

      const suggestions = feedbackGenerator.generateSuggestions(analysisResult);

      expect(suggestions).toContain('Include relevant technical keywords');
      expect(suggestions).toContain('Increase keyword density for better ATS compatibility');
      expect(suggestions).toContain('Remove outdated technologies');
    });

    it('should prioritize suggestions by impact', () => {
      const analysisResult = {
        content: {
          missingSections: ['summary', 'skills'],
          weakActionVerbs: ['did'],
          genericPhrases: ['hardworking']
        }
      };

      const suggestions = feedbackGenerator.generateSuggestions(analysisResult);

      // Missing sections should be prioritized
      expect(suggestions[0]).toContain('summary');
      expect(suggestions[1]).toContain('skills');
    });
  });

  describe('Strengths Identification', () => {
    it('should identify content strengths', () => {
      const analysisResult = {
        content: {
          sections: {
            summary: { present: true, quality: 0.9 },
            experience: { present: true, quality: 0.8 },
            education: { present: true, quality: 0.7 }
          },
          quantifiedAchievements: 5,
          strongActionVerbs: ['developed', 'led', 'implemented'],
          industryKeywords: ['API', 'microservices', 'DevOps']
        }
      };

      const strengths = feedbackGenerator.identifyStrengths(analysisResult);

      expect(strengths).toContain('Well-structured resume with all essential sections');
      expect(strengths).toContain('Strong use of action verbs');
      expect(strengths).toContain('Good use of industry-relevant keywords');
      expect(strengths).toContain('Includes quantified achievements');
    });

    it('should identify formatting strengths', () => {
      const analysisResult = {
        formatting: {
          consistentCapitalization: true,
          properBulletPoints: true,
          consistentSpacing: true,
          clearHeadings: true
        }
      };

      const strengths = feedbackGenerator.identifyStrengths(analysisResult);

      expect(strengths).toContain('Professional formatting and structure');
      expect(strengths).toContain('Consistent capitalization throughout');
      expect(strengths).toContain('Clear section organization');
    });

    it('should identify keyword strengths', () => {
      const analysisResult = {
        keywords: {
          technicalSkills: ['JavaScript', 'React', 'Node.js', 'Python'],
          cloudTechnologies: ['AWS', 'Docker', 'Kubernetes'],
          methodologies: ['Agile', 'Scrum'],
          keywordDensity: {
            'JavaScript': 0.08,
            'React': 0.06
          }
        }
      };

      const strengths = feedbackGenerator.identifyStrengths(analysisResult);

      expect(strengths).toContain('Comprehensive technical skills listed');
      expect(strengths).toContain('Good keyword density for ATS optimization');
      expect(strengths).toContain('Includes modern technologies and methodologies');
    });
  });

  describe('Improvement Areas Identification', () => {
    it('should identify content improvement areas', () => {
      const analysisResult = {
        content: {
          missingSections: ['summary'],
          weakActionVerbs: ['did', 'made', 'helped'],
          genericPhrases: ['hardworking', 'team player', 'detail-oriented'],
          quantifiedAchievements: 0,
          wordCount: 150 // Too short
        }
      };

      const improvements = feedbackGenerator.identifyImprovements(analysisResult);

      expect(improvements).toContain('Add missing sections to improve completeness');
      expect(improvements).toContain('Replace weak action verbs with stronger alternatives');
      expect(improvements).toContain('Remove generic phrases and add specific achievements');
      expect(improvements).toContain('Include quantified results and metrics');
      expect(improvements).toContain('Expand content to meet recommended length');
    });

    it('should identify formatting improvement areas', () => {
      const analysisResult = {
        formatting: {
          inconsistentCapitalization: true,
          missingBulletPoints: true,
          poorSpacing: true,
          noClearHeadings: true,
          issues: [
            'Mixed capitalization in headings',
            'No bullet points in experience section',
            'Inconsistent spacing between sections'
          ]
        }
      };

      const improvements = feedbackGenerator.identifyImprovements(analysisResult);

      expect(improvements).toContain('Fix capitalization inconsistencies');
      expect(improvements).toContain('Add bullet points for better readability');
      expect(improvements).toContain('Improve overall formatting and spacing');
    });

    it('should identify keyword improvement areas', () => {
      const analysisResult = {
        keywords: {
          missingKeywords: ['JavaScript', 'React', 'Node.js', 'Python'],
          lowKeywordDensity: true,
          outdatedTechnologies: ['jQuery', 'Flash', 'Internet Explorer'],
          genericSkills: ['Microsoft Office', 'Email']
        }
      };

      const improvements = feedbackGenerator.identifyImprovements(analysisResult);

      expect(improvements).toContain('Include more relevant technical keywords');
      expect(improvements).toContain('Increase keyword density for better ATS performance');
      expect(improvements).toContain('Remove outdated technologies');
      expect(improvements).toContain('Replace generic skills with specific technical skills');
    });
  });

  describe('Detailed Analysis Generation', () => {
    it('should generate section-by-section analysis', () => {
      const analysisResult = {
        sections: {
          summary: {
            present: true,
            quality: 0.8,
            wordCount: 100,
            issues: ['Could be more specific']
          },
          experience: {
            present: true,
            quality: 0.9,
            wordCount: 300,
            issues: []
          },
          education: {
            present: true,
            quality: 0.7,
            wordCount: 50,
            issues: ['Missing GPA']
          },
          skills: {
            present: true,
            quality: 0.6,
            wordCount: 30,
            issues: ['Too few skills listed']
          }
        }
      };

      const detailedAnalysis = feedbackGenerator.generateDetailedAnalysis(analysisResult);

      expect(detailedAnalysis).toBeDefined();
      expect(detailedAnalysis.summary).toBeDefined();
      expect(detailedAnalysis.experience).toBeDefined();
      expect(detailedAnalysis.education).toBeDefined();
      expect(detailedAnalysis.skills).toBeDefined();

      expect(detailedAnalysis.summary.score).toBeGreaterThan(70);
      expect(detailedAnalysis.experience.score).toBeGreaterThan(80);
      expect(detailedAnalysis.education.score).toBeGreaterThan(60);
      expect(detailedAnalysis.skills.score).toBeGreaterThan(50);
    });

    it('should provide specific recommendations for each section', () => {
      const analysisResult = {
        sections: {
          summary: {
            present: true,
            quality: 0.6,
            issues: ['Too generic', 'Missing quantifiable results']
          }
        }
      };

      const detailedAnalysis = feedbackGenerator.generateDetailedAnalysis(analysisResult);

      expect(detailedAnalysis.summary.recommendations).toContain('Make summary more specific to your role');
      expect(detailedAnalysis.summary.recommendations).toContain('Include quantifiable achievements');
    });
  });

  describe('Score Explanation Generation', () => {
    it('should explain content score', () => {
      const scores = {
        contentScore: 75,
        formattingScore: 85,
        keywordScore: 60
      };

      const explanations = feedbackGenerator.explainScores(scores);

      expect(explanations.content).toBeDefined();
      expect(explanations.content.score).toBe(75);
      expect(explanations.content.category).toBe('good');
      expect(explanations.content.explanation).toContain('good foundation');
    });

    it('should explain formatting score', () => {
      const scores = {
        contentScore: 75,
        formattingScore: 95,
        keywordScore: 60
      };

      const explanations = feedbackGenerator.explainScores(scores);

      expect(explanations.formatting.score).toBe(95);
      expect(explanations.formatting.category).toBe('excellent');
      expect(explanations.formatting.explanation).toContain('excellent formatting');
    });

    it('should explain keyword score', () => {
      const scores = {
        contentScore: 75,
        formattingScore: 85,
        keywordScore: 40
      };

      const explanations = feedbackGenerator.explainScores(scores);

      expect(explanations.keywords.score).toBe(40);
      expect(explanations.keywords.category).toBe('poor');
      expect(explanations.keywords.explanation).toContain('needs improvement');
    });
  });

  describe('Priority Recommendations', () => {
    it('should prioritize recommendations by impact', () => {
      const analysisResult = {
        content: {
          missingSections: ['summary'],
          weakActionVerbs: ['did'],
          genericPhrases: ['hardworking']
        },
        formatting: {
          inconsistentCapitalization: true
        },
        keywords: {
          missingKeywords: ['JavaScript']
        }
      };

      const recommendations = feedbackGenerator.generatePriorityRecommendations(analysisResult);

      expect(recommendations.high).toContain('Add professional summary section');
      expect(recommendations.medium).toContain('Use stronger action verbs');
      expect(recommendations.low).toContain('Fix capitalization inconsistencies');
    });

    it('should provide actionable recommendations', () => {
      const analysisResult = {
        content: {
          weakActionVerbs: ['did', 'made', 'helped']
        }
      };

      const recommendations = feedbackGenerator.generatePriorityRecommendations(analysisResult);

      expect(recommendations.high).toContain('Replace "did" with "developed" or "implemented"');
      expect(recommendations.high).toContain('Replace "made" with "created" or "built"');
      expect(recommendations.high).toContain('Replace "helped" with "collaborated" or "supported"');
    });
  });

  describe('Feedback Summary Generation', () => {
    it('should generate comprehensive feedback summary', () => {
      const analysisResult = {
        content: {
          sections: { summary: { present: true }, experience: { present: true } },
          quantifiedAchievements: 3,
          wordCount: 500
        },
        formatting: {
          consistentCapitalization: true,
          properBulletPoints: true
        },
        keywords: {
          technicalSkills: ['JavaScript', 'React'],
          missingKeywords: ['Node.js']
        }
      };

      const scores = {
        contentScore: 80,
        formattingScore: 90,
        keywordScore: 70
      };

      const feedback = feedbackGenerator.generateFeedback(analysisResult, scores);

      expect(feedback).toBeDefined();
      expect(feedback.overallScore).toBeDefined();
      expect(feedback.suggestions).toBeDefined();
      expect(feedback.strengths).toBeDefined();
      expect(feedback.improvements).toBeDefined();
      expect(feedback.analysis).toBeDefined();
      expect(feedback.recommendations).toBeDefined();
    });

    it('should handle edge cases gracefully', () => {
      expect(() => {
        feedbackGenerator.generateFeedback(null, null);
      }).toThrow('Analysis result and scores are required');
    });
  });
});
