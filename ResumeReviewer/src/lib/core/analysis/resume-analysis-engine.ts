export interface ResumeAnalysisResult {
  sections: {
    summary?: { present: boolean; quality: number };
    experience?: { present: boolean; quality: number };
    education?: { present: boolean; quality: number };
    skills?: { present: boolean; quality: number };
  };
  wordCount: number;
  readabilityScore: number;
  missingSections: string[];
  formattingIssues: {
    inconsistentCapitalization: boolean;
    missingBulletPoints: boolean;
    poorSpacing: boolean;
    noClearHeadings: boolean;
  };
  contactInfo: {
    name?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
  };
  experienceDepth: {
    totalYears: number;
    achievementsCount: number;
    quantifiedResults: number;
    leadershipExperience: boolean;
  };
  keywordAnalysis: {
    technicalSkills: string[];
    cloudTechnologies: string[];
    methodologies: string[];
    industryKeywords: string[];
    missingKeywords: string[];
    keywordDensity: Record<string, number>;
  };
  contentQuality: {
    weakActionVerbs: string[];
    quantifiedAchievements: number;
    genericPhrases: string[];
    hasMetrics: boolean;
  };
}

export class ResumeAnalysisEngine {
  private readonly MAX_TEXT_LENGTH = 50000;
  private readonly MIN_TEXT_LENGTH = 10;

  analyzeContent(resumeText: string): ResumeAnalysisResult {
    this.validateInput(resumeText);

    const cleanedText = this.cleanText(resumeText);
    const sections = this.detectSections(cleanedText);
    const contactInfo = this.extractContactInfo(cleanedText);
    const experienceDepth = this.analyzeWorkExperience(cleanedText).experienceDepth;
    const keywordAnalysis = this.analyzeKeywords(cleanedText);
    const contentQuality = this.analyzeContentQuality(cleanedText);
    const formattingIssues = this.detectFormattingIssues(resumeText);

    return {
      sections,
      wordCount: this.getWordCount(cleanedText),
      readabilityScore: this.calculateReadability(cleanedText),
      missingSections: this.identifyMissingSections(sections),
      formattingIssues,
      contactInfo,
      experienceDepth,
      keywordAnalysis,
      contentQuality
    };
  }

  private validateInput(text: string): void {
    if (text === null || text === undefined) {
      throw new Error('Resume text is required');
    }
    if (!text) {
      throw new Error('Resume text cannot be empty');
    }
    if (text.length < this.MIN_TEXT_LENGTH) {
      throw new Error('Resume text cannot be empty');
    }
    if (text.length > this.MAX_TEXT_LENGTH) {
      throw new Error('Resume text exceeds maximum length');
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s@.\-()]/g, '')
      .trim();
  }

  private detectSections(text: string): ResumeAnalysisResult['sections'] {
    const sections: ResumeAnalysisResult['sections'] = {};
    
    // Detect summary section
    const summaryPatterns = [
      /PROFESSIONAL SUMMARY/i,
      /SUMMARY/i,
      /ABOUT ME/i,
      /PROFILE/i
    ];
    sections.summary = {
      present: summaryPatterns.some(pattern => pattern.test(text)),
      quality: this.assessSectionQuality(text, summaryPatterns)
    };

    // Detect experience section
    const experiencePatterns = [
      /WORK EXPERIENCE/i,
      /EXPERIENCE/i,
      /EMPLOYMENT HISTORY/i,
      /PROFESSIONAL EXPERIENCE/i
    ];
    sections.experience = {
      present: experiencePatterns.some(pattern => pattern.test(text)),
      quality: this.assessSectionQuality(text, experiencePatterns)
    };

    // Detect education section
    const educationPatterns = [
      /EDUCATION/i,
      /ACADEMIC BACKGROUND/i,
      /QUALIFICATIONS/i
    ];
    sections.education = {
      present: educationPatterns.some(pattern => pattern.test(text)),
      quality: this.assessSectionQuality(text, educationPatterns)
    };

    // Detect skills section
    const skillsPatterns = [
      /SKILLS/i,
      /TECHNICAL SKILLS/i,
      /COMPETENCIES/i,
      /EXPERTISE/i
    ];
    sections.skills = {
      present: skillsPatterns.some(pattern => pattern.test(text)),
      quality: this.assessSectionQuality(text, skillsPatterns)
    };

    return sections;
  }

  private assessSectionQuality(text: string, patterns: RegExp[]): number {
    const foundPattern = patterns.find(pattern => pattern.test(text));
    if (!foundPattern) return 0;

    const sectionMatch = text.match(foundPattern);
    if (!sectionMatch) return 0;

    const sectionStart = sectionMatch.index!;
    const nextSectionMatch = text.substring(sectionStart + 1).match(/[A-Z][A-Z\s]+/);
    const sectionEnd = nextSectionMatch ? sectionStart + nextSectionMatch.index! + 1 : text.length;
    const sectionText = text.substring(sectionStart, sectionEnd);

    // Assess quality based on content length and structure
    const wordCount = sectionText.split(/\s+/).length;
    const hasBulletPoints = /[-•*]\s/.test(sectionText);
    const hasNumbers = /\d+/.test(sectionText);

    let quality = 0.5; // Base quality
    if (wordCount > 20) quality += 0.2;
    if (hasBulletPoints) quality += 0.2;
    if (hasNumbers) quality += 0.1;

    return Math.min(quality, 1.0);
  }

  private identifyMissingSections(sections: ResumeAnalysisResult['sections']): string[] {
    const missing: string[] = [];
    const requiredSections = ['summary', 'experience', 'education', 'skills'];

    requiredSections.forEach(section => {
      if (!sections[section as keyof typeof sections]?.present) {
        missing.push(section);
      }
    });

    return missing;
  }

  private detectFormattingIssues(text: string): ResumeAnalysisResult['formattingIssues'] {
    return {
      inconsistentCapitalization: this.hasInconsistentCapitalization(text),
      missingBulletPoints: this.hasMissingBulletPoints(text),
      poorSpacing: this.hasPoorSpacing(text),
      noClearHeadings: this.hasNoClearHeadings(text)
    };
  }

  private hasInconsistentCapitalization(text: string): boolean {
    const lines = text.split('\n');
    const allCapsLines = lines.filter(line => /^[A-Z][A-Z\s]+$/.test(line.trim()));
    const lowercaseLines = lines.filter(line => /^[a-z][a-z\s]+$/.test(line.trim()));
    return allCapsLines.length > 0 && lowercaseLines.length > 0;
  }

  private hasMissingBulletPoints(text: string): boolean {
    const experienceSection = text.match(/work experience[\s\S]*?(?=education|skills|$)/i);
    if (!experienceSection) return false;
    
    const hasBullets = /[-•*]\s/.test(experienceSection[0]);
    const hasMultipleLines = experienceSection[0].split('\n').length > 3;
    
    return hasMultipleLines && !hasBullets;
  }

  private hasPoorSpacing(text: string): boolean {
    const doubleSpaces = /\s{2,}/.test(text);
    const inconsistentNewlines = /\n{3,}/.test(text);
    return doubleSpaces || inconsistentNewlines;
  }

  private hasNoClearHeadings(text: string): boolean {
    const clearHeadings = /^[A-Z][A-Z\s]+$/gm;
    const headings = text.match(clearHeadings) || [];
    return headings.length < 3;
  }

  extractContactInfo(text: string): ResumeAnalysisResult['contactInfo'] {
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const phoneMatch = text.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/);
    const linkedinMatch = text.match(/(linkedin\.com\/in\/[a-zA-Z0-9-]+)/i);
    const githubMatch = text.match(/(github\.com\/[a-zA-Z0-9-]+)/i);
    
    // Extract name from the first line that looks like a name
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let nameMatch: string | undefined;
    for (const line of lines.slice(0, 3)) { // Check first 3 lines
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line) && !line.includes('@') && !line.includes('(')) {
        nameMatch = line;
        break;
      }
    }

    return {
      name: nameMatch,
      email: emailMatch?.[1],
      phone: phoneMatch?.[1],
      linkedin: linkedinMatch?.[1],
      github: githubMatch?.[1]
    };
  }

  analyzeWorkExperience(text: string): any {
    const experienceSection = text.match(/WORK EXPERIENCE[\s\S]*?(?=EDUCATION|SKILLS|$)/i);
    if (!experienceSection) {
      return { experienceDepth: { totalYears: 0, achievementsCount: 0, quantifiedResults: 0, leadershipExperience: false } };
    }

    const experienceText = experienceSection[0];
    const years = this.extractYears(experienceText);
    const achievements = this.extractAchievements(experienceText);
    const quantifiedResults = this.countQuantifiedResults(experienceText);
    const leadershipExperience = this.hasLeadershipExperience(experienceText);

    return {
      experienceDepth: {
        totalYears: years,
        achievementsCount: achievements.length,
        quantifiedResults,
        leadershipExperience
      }
    };
  }

  private extractYears(text: string): number {
    const yearMatches = text.match(/\b(19|20)\d{2}\b/g);
    if (!yearMatches || yearMatches.length < 2) return 0;

    const years = yearMatches.map(y => parseInt(y)).sort((a, b) => a - b);
    return years[years.length - 1] - years[0];
  }

  private extractAchievements(text: string): string[] {
    const bulletPoints = text.match(/[-•*]\s+([^\n]+)/g) || [];
    return bulletPoints.map(bp => bp.replace(/^[-•*]\s+/, ''));
  }

  private countQuantifiedResults(text: string): number {
    const quantifiedPatterns = [
      /\d+%/g,
      /\$\d+/g,
      /\d+\+?\s*(users?|customers?|clients?)/gi,
      /\d+\+?\s*(years?|months?)/gi
    ];

    let count = 0;
    quantifiedPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  }

  private hasLeadershipExperience(text: string): boolean {
    const leadershipKeywords = [
      'led', 'managed', 'supervised', 'directed', 'headed', 'coordinated',
      'team', 'department', 'project', 'initiative'
    ];

    return leadershipKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(text)
    );
  }

  analyzeKeywords(text: string): ResumeAnalysisResult['keywordAnalysis'] {
    const technicalSkills = this.extractTechnicalSkills(text);
    const cloudTechnologies = this.extractCloudTechnologies(text);
    const methodologies = this.extractMethodologies(text);
    const industryKeywords = this.extractIndustryKeywords(text);
    const missingKeywords = this.identifyMissingKeywords(technicalSkills, cloudTechnologies, methodologies);
    const keywordDensity = this.calculateKeywordDensity(text, technicalSkills);

    return {
      technicalSkills,
      cloudTechnologies,
      methodologies,
      industryKeywords,
      missingKeywords,
      keywordDensity
    };
  }

  private extractTechnicalSkills(text: string): string[] {
    const skills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
      'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask',
      'Spring', 'Laravel', 'Ruby on Rails', 'ASP.NET', 'MongoDB', 'PostgreSQL',
      'MySQL', 'Redis', 'Elasticsearch'
    ];

    return skills.filter(skill => 
      new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
    );
  }

  private extractCloudTechnologies(text: string): string[] {
    const cloudTechs = [
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform',
      'Jenkins', 'GitLab CI', 'GitHub Actions'
    ];

    return cloudTechs.filter(tech => 
      new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
    );
  }

  private extractMethodologies(text: string): string[] {
    const methodologies = [
      'Agile', 'Scrum', 'Kanban', 'DevOps', 'CI/CD', 'TDD', 'BDD'
    ];

    return methodologies.filter(method => 
      new RegExp(`\\b${method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
    );
  }

  private extractIndustryKeywords(text: string): string[] {
    const industryKeywords = [
      'API', 'REST', 'GraphQL', 'Microservices', 'Machine Learning', 'Data Science',
      'Big Data', 'Analytics', 'Cloud Computing', 'Mobile Development'
    ];

    return industryKeywords.filter(keyword => 
      new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
    );
  }

  private identifyMissingKeywords(technicalSkills: string[], cloudTechnologies: string[], methodologies: string[]): string[] {
    const importantKeywords = [
      'JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'Agile'
    ];

    const presentKeywords = [...technicalSkills, ...cloudTechnologies, ...methodologies];
    return importantKeywords.filter(keyword => 
      !presentKeywords.some(present => 
        present.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  private calculateKeywordDensity(text: string, keywords: string[]): Record<string, number> {
    const wordCount = text.split(/\s+/).length;
    const density: Record<string, number> = {};

    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = text.match(regex);
      const count = matches ? matches.length : 0;
      density[keyword] = count / wordCount;
    });

    return density;
  }

  analyzeContentQuality(text: string): ResumeAnalysisResult['contentQuality'] {
    const weakActionVerbs = this.detectWeakActionVerbs(text);
    const quantifiedAchievements = this.countQuantifiedAchievements(text);
    const genericPhrases = this.detectGenericPhrases(text);
    const hasMetrics = quantifiedAchievements > 0;

    return {
      weakActionVerbs,
      quantifiedAchievements,
      genericPhrases,
      hasMetrics
    };
  }

  private detectWeakActionVerbs(text: string): string[] {
    const weakVerbs = ['did', 'made', 'helped', 'worked', 'assisted', 'participated'];
    const foundWeakVerbs: string[] = [];

    weakVerbs.forEach(verb => {
      const regex = new RegExp(`\\b${verb}\\b`, 'gi');
      if (regex.test(text)) {
        foundWeakVerbs.push(verb);
      }
    });

    return foundWeakVerbs;
  }

  private countQuantifiedAchievements(text: string): number {
    const quantifiedPatterns = [
      /\d+%/g,
      /\$\d+/g,
      /\d+\+?\s*(users?|customers?|clients?|employees?)/gi,
      /\d+\+?\s*(years?|months?|days?)/gi,
      /\d+\+?\s*(times?|fold|x)/gi
    ];

    let count = 0;
    quantifiedPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  }

  private detectGenericPhrases(text: string): string[] {
    const genericPhrases = [
      'hardworking', 'team player', 'detail-oriented', 'organized',
      'excellent communication skills', 'strong work ethic', 'passionate',
      'dedicated', 'motivated', 'self-starter'
    ];

    return genericPhrases.filter(phrase => 
      new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)
    );
  }

  private getWordCount(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculateReadability(text: string): number {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Simplified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, score)) / 100;
  }

  private countSyllables(word: string): number {
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i].toLowerCase());
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Handle silent 'e'
    if (word.endsWith('e') && count > 1) {
      count--;
    }

    return Math.max(1, count);
  }
}
