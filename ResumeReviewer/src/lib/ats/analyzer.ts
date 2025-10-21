export interface ATSKeyword {
  keyword: string;
  category: 'technical' | 'soft' | 'industry' | 'role-specific';
  importance: 'low' | 'medium' | 'high' | 'critical';
  synonyms: string[];
}

export interface ATSCompatibilityResult {
  score: number;
  issues: ATSIssue[];
  recommendations: ATSRecommendation[];
  keywordAnalysis: KeywordAnalysis;
  formattingIssues: FormattingIssue[];
}

export interface ATSIssue {
  type: 'missing_keywords' | 'formatting' | 'structure' | 'content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  fix: string;
}

export interface ATSRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'keywords' | 'formatting' | 'structure' | 'content';
  action: string;
  example: string;
  impact: string;
}

export interface KeywordAnalysis {
  found: string[];
  missing: string[];
  density: Record<string, number>;
  suggestions: string[];
}

export interface FormattingIssue {
  type: 'font' | 'layout' | 'headers' | 'bullets' | 'dates';
  description: string;
  fix: string;
}

export class ATSAnalyzer {
  private static readonly COMMON_KEYWORDS: ATSKeyword[] = [
    // Technical skills
    { keyword: 'JavaScript', category: 'technical', importance: 'high', synonyms: ['JS', 'ECMAScript'] },
    { keyword: 'Python', category: 'technical', importance: 'high', synonyms: ['Python3', 'Py'] },
    { keyword: 'React', category: 'technical', importance: 'high', synonyms: ['ReactJS', 'React.js'] },
    { keyword: 'Node.js', category: 'technical', importance: 'high', synonyms: ['NodeJS', 'Node'] },
    { keyword: 'SQL', category: 'technical', importance: 'high', synonyms: ['MySQL', 'PostgreSQL', 'Database'] },
    { keyword: 'AWS', category: 'technical', importance: 'high', synonyms: ['Amazon Web Services', 'Cloud'] },
    { keyword: 'Docker', category: 'technical', importance: 'medium', synonyms: ['Containerization'] },
    { keyword: 'Kubernetes', category: 'technical', importance: 'medium', synonyms: ['K8s', 'Container orchestration'] },
    
    // Soft skills
    { keyword: 'Leadership', category: 'soft', importance: 'high', synonyms: ['Lead', 'Manage', 'Supervise'] },
    { keyword: 'Communication', category: 'soft', importance: 'high', synonyms: ['Collaborate', 'Present', 'Negotiate'] },
    { keyword: 'Problem Solving', category: 'soft', importance: 'high', synonyms: ['Analytical', 'Critical thinking'] },
    { keyword: 'Teamwork', category: 'soft', importance: 'medium', synonyms: ['Collaboration', 'Cross-functional'] },
    
    // Industry terms
    { keyword: 'Agile', category: 'industry', importance: 'high', synonyms: ['Scrum', 'Sprint', 'Iterative'] },
    { keyword: 'DevOps', category: 'industry', importance: 'medium', synonyms: ['CI/CD', 'Continuous Integration'] },
    { keyword: 'Machine Learning', category: 'industry', importance: 'high', synonyms: ['ML', 'AI', 'Artificial Intelligence'] },
    { keyword: 'Data Analysis', category: 'industry', importance: 'high', synonyms: ['Analytics', 'Insights', 'Metrics'] },
  ];

  static analyze(resumeText: string, jobDescription?: string): ATSCompatibilityResult {
    const text = resumeText.toLowerCase();
    const jobText = jobDescription?.toLowerCase() || '';
    
    // Keyword analysis
    const keywordAnalysis = this.analyzeKeywords(text, jobText);
    
    // Formatting analysis
    const formattingIssues = this.analyzeFormatting(resumeText);
    
    // Structure analysis
    const structureIssues = this.analyzeStructure(resumeText);
    
    // Content analysis
    const contentIssues = this.analyzeContent(resumeText);
    
    // Calculate overall score
    const score = this.calculateScore(keywordAnalysis, formattingIssues, structureIssues, contentIssues);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(keywordAnalysis, formattingIssues, structureIssues, contentIssues);
    
    return {
      score,
      issues: [...structureIssues, ...contentIssues],
      recommendations,
      keywordAnalysis,
      formattingIssues
    };
  }

  private static analyzeKeywords(resumeText: string, jobText: string): KeywordAnalysis {
    const found: string[] = [];
    const missing: string[] = [];
    const density: Record<string, number> = {};
    const suggestions: string[] = [];
    
    // Check for common keywords
    for (const keyword of this.COMMON_KEYWORDS) {
      const keywordLower = keyword.keyword.toLowerCase();
      const synonyms = keyword.synonyms.map(s => s.toLowerCase());
      const allVariants = [keywordLower, ...synonyms];
      
      let foundVariant = false;
      let count = 0;
      
      for (const variant of allVariants) {
        const matches = (resumeText.match(new RegExp(variant, 'g')) || []).length;
        if (matches > 0) {
          foundVariant = true;
          count += matches;
        }
      }
      
      if (foundVariant) {
        found.push(keyword.keyword);
        density[keyword.keyword] = count;
      } else if (keyword.importance === 'high' || keyword.importance === 'critical') {
        missing.push(keyword.keyword);
        suggestions.push(`Consider adding "${keyword.keyword}" or related terms: ${synonyms.join(', ')}`);
      }
    }
    
    // Extract job-specific keywords if job description provided
    if (jobText) {
      const jobKeywords = this.extractJobKeywords(jobText);
      for (const keyword of jobKeywords) {
        if (!resumeText.includes(keyword.toLowerCase())) {
          missing.push(keyword);
          suggestions.push(`Add "${keyword}" to match job requirements`);
        }
      }
    }
    
    return { found, missing, density, suggestions };
  }

  private static extractJobKeywords(jobText: string): string[] {
    // Simple keyword extraction - in production, use NLP libraries
    const keywords: string[] = [];
    const words = jobText.split(/\s+/);
    
    for (const word of words) {
      if (word.length > 3 && /^[a-zA-Z]+$/.test(word)) {
        keywords.push(word);
      }
    }
    
    return [...new Set(keywords)].slice(0, 20); // Top 20 unique keywords
  }

  private static analyzeFormatting(resumeText: string): FormattingIssue[] {
    const issues: FormattingIssue[] = [];
    
    // Check for common formatting issues
    if (resumeText.includes('\t')) {
      issues.push({
        type: 'layout',
        description: 'Contains tab characters which may cause formatting issues',
        fix: 'Replace tabs with spaces or use proper indentation'
      });
    }
    
    if (resumeText.includes('  ')) {
      issues.push({
        type: 'layout',
        description: 'Contains multiple consecutive spaces',
        fix: 'Use single spaces and proper formatting'
      });
    }
    
    // Check for bullet points
    const bulletPatterns = [/^[\s]*[•\-\*]\s+/gm, /^[\s]*\d+\.\s+/gm];
    let hasBullets = false;
    for (const pattern of bulletPatterns) {
      if (pattern.test(resumeText)) {
        hasBullets = true;
        break;
      }
    }
    
    if (!hasBullets) {
      issues.push({
        type: 'bullets',
        description: 'No bullet points found - bullets improve readability',
        fix: 'Use bullet points (•, -, *) to list achievements and responsibilities'
      });
    }
    
    return issues;
  }

  private static analyzeStructure(resumeText: string): ATSIssue[] {
    const issues: ATSIssue[] = [];
    
    // Check for required sections
    const requiredSections = ['experience', 'education', 'skills'];
    const text = resumeText.toLowerCase();
    
    for (const section of requiredSections) {
      if (!text.includes(section)) {
        issues.push({
          type: 'structure',
          severity: 'high',
          description: `Missing ${section} section`,
          evidence: `No "${section}" section found`,
          fix: `Add a ${section} section with relevant information`
        });
      }
    }
    
    // Check for contact information
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    if (!emailPattern.test(resumeText)) {
      issues.push({
        type: 'structure',
        severity: 'critical',
        description: 'Missing email address',
        evidence: 'No email address found',
        fix: 'Add a professional email address'
      });
    }
    
    return issues;
  }

  private static analyzeContent(resumeText: string): ATSIssue[] {
    const issues: ATSIssue[] = [];
    
    // Check for quantified achievements
    const numberPattern = /\b\d+%|\$\d+|\d+\+|\d+x\b/;
    if (!numberPattern.test(resumeText)) {
      issues.push({
        type: 'content',
        severity: 'medium',
        description: 'No quantified achievements found',
        evidence: 'No numbers, percentages, or metrics found',
        fix: 'Add specific metrics and quantified achievements (e.g., "increased sales by 25%")'
      });
    }
    
    // Check for action verbs
    const actionVerbs = ['achieved', 'developed', 'implemented', 'managed', 'led', 'created', 'improved', 'increased', 'reduced'];
    const text = resumeText.toLowerCase();
    const hasActionVerbs = actionVerbs.some(verb => text.includes(verb));
    
    if (!hasActionVerbs) {
      issues.push({
        type: 'content',
        severity: 'medium',
        description: 'Weak action verbs or no action verbs',
        evidence: 'No strong action verbs found',
        fix: 'Use strong action verbs like "achieved", "developed", "implemented", "managed"'
      });
    }
    
    return issues;
  }

  private static calculateScore(
    keywordAnalysis: KeywordAnalysis,
    formattingIssues: FormattingIssue[],
    structureIssues: ATSIssue[],
    contentIssues: ATSIssue[]
  ): number {
    let score = 100;
    
    // Deduct for missing keywords
    score -= keywordAnalysis.missing.length * 5;
    
    // Deduct for formatting issues
    score -= formattingIssues.length * 3;
    
    // Deduct for structure issues
    for (const issue of structureIssues) {
      switch (issue.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }
    
    // Deduct for content issues
    for (const issue of contentIssues) {
      switch (issue.severity) {
        case 'critical': score -= 15; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private static generateRecommendations(
    keywordAnalysis: KeywordAnalysis,
    formattingIssues: FormattingIssue[],
    structureIssues: ATSIssue[],
    contentIssues: ATSIssue[]
  ): ATSRecommendation[] {
    const recommendations: ATSRecommendation[] = [];
    
    // Keyword recommendations
    if (keywordAnalysis.missing.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'keywords',
        action: 'Add missing keywords',
        example: keywordAnalysis.missing.slice(0, 3).join(', '),
        impact: 'Improves ATS compatibility and keyword matching'
      });
    }
    
    // Structure recommendations
    for (const issue of structureIssues) {
      recommendations.push({
        priority: issue.severity === 'critical' ? 'critical' : 'high',
        category: 'structure',
        action: issue.fix,
        example: issue.description,
        impact: 'Essential for ATS parsing and recruiter review'
      });
    }
    
    // Content recommendations
    for (const issue of contentIssues) {
      recommendations.push({
        priority: issue.severity === 'high' ? 'high' : 'medium',
        category: 'content',
        action: issue.fix,
        example: issue.description,
        impact: 'Makes resume more compelling and professional'
      });
    }
    
    return recommendations;
  }
}
