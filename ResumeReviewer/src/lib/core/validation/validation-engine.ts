export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  suggestions: string[];
}

export interface ExperienceEntry {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface EducationEntry {
  degree: string;
  field: string;
  institution: string;
  graduationDate: string;
  gpa: string;
}

export interface SkillsData {
  technical: string[];
  soft: string[];
  tools: string[];
}

export class ValidationEngine {
  private readonly MIN_WORD_COUNT = 200;
  private readonly MAX_WORD_COUNT = 1000;
  private readonly MAX_SKILLS = 20;

  validateStructure(resumeData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    const sections = resumeData.sections || {};
    const requiredSections = ['summary', 'experience', 'education', 'skills'];

    // Check for missing required sections
    requiredSections.forEach(section => {
      if (!sections[section]?.present) {
        if (section === 'summary') {
          errors.push('Professional summary is missing');
        } else {
          errors.push(`${this.capitalizeFirst(section)} section is missing`);
        }
        score -= 20;
      }
    });

    // Check section order
    const sectionOrder = this.getSectionOrder(sections);
    if (sectionOrder.length > 0) {
      warnings.push('Consider placing skills section after experience');
      score -= 5;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
      suggestions: this.generateStructureSuggestions(errors, warnings)
    };
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getSectionOrder(sections: any): string[] {
    // Simplified section order validation
    const orderIssues: string[] = [];
    if (sections.skills?.order && sections.experience?.order && sections.skills.order < sections.experience.order) {
      orderIssues.push('skills');
    }
    return orderIssues;
  }

  private generateStructureSuggestions(errors: string[], warnings: string[]): string[] {
    const suggestions: string[] = [];
    
    if (errors.some(e => e.includes('summary'))) {
      suggestions.push('Add a professional summary section');
    }
    if (errors.some(e => e.includes('education'))) {
      suggestions.push('Include your educational background');
    }
    if (warnings.some(w => w.includes('skills'))) {
      suggestions.push('Consider reordering sections for better flow');
    }

    return suggestions;
  }

  validateContentQuality(resumeData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    const wordCount = resumeData.wordCount || 0;

    // Word count validation
    if (wordCount < this.MIN_WORD_COUNT) {
      errors.push(`Resume is too short (minimum ${this.MIN_WORD_COUNT} words recommended)`);
      score -= 30;
    } else if (wordCount > this.MAX_WORD_COUNT) {
      errors.push(`Resume is too long (maximum ${this.MAX_WORD_COUNT} words recommended)`);
      score -= 30;
    }

    // Section word count validation
    const sections = resumeData.sections || {};
    Object.entries(sections).forEach(([section, data]: [string, any]) => {
      const sectionWordCount = data.wordCount || 0;
      if (sectionWordCount < 20) {
        warnings.push(`${this.capitalizeFirst(section)} section is too brief`);
        score -= 5;
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
      suggestions: this.generateContentSuggestions(errors, warnings)
    };
  }

  private generateContentSuggestions(errors: string[], warnings: string[]): string[] {
    const suggestions: string[] = [];
    
    if (errors.some(e => e.includes('too short'))) {
      suggestions.push('Expand your content with more details');
    }
    if (errors.some(e => e.includes('too long'))) {
      suggestions.push('Condense your content to be more concise');
    }
    if (warnings.some(w => w.includes('too brief'))) {
      suggestions.push('Add more detail to brief sections');
    }

    return suggestions;
  }

  validateActionVerbs(resumeData: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    const experience = resumeData.experience || {};
    const achievements = experience.achievements || [];

    const weakVerbs = ['did', 'made', 'helped', 'worked', 'assisted'];
    const strongVerbs = ['developed', 'created', 'built', 'implemented', 'led', 'managed'];

    let weakVerbCount = 0;
    let strongVerbCount = 0;

    achievements.forEach((achievement: string) => {
      const lowerAchievement = achievement.toLowerCase();
      weakVerbs.forEach(verb => {
        if (lowerAchievement.includes(verb)) {
          weakVerbCount++;
        }
      });
      strongVerbs.forEach(verb => {
        if (lowerAchievement.includes(verb)) {
          strongVerbCount++;
        }
      });
    });

    if (weakVerbCount > strongVerbCount) {
      errors.push('Use stronger action verbs');
      score -= 40;
    } else if (weakVerbCount > 0) {
      warnings.push('Consider replacing some weak action verbs');
      score -= 20;
    }

    // Generate specific suggestions
    const suggestions: string[] = [];
    if (weakVerbCount > 0) {
      suggestions.push('Replace "did" with "developed"');
      suggestions.push('Replace "made" with "created"');
      suggestions.push('Replace "helped" with "collaborated"');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
      suggestions: this.generateActionVerbSuggestions(weakVerbCount)
    };
  }

  private generateActionVerbSuggestions(weakVerbCount: number): string[] {
    const suggestions: string[] = [];
    
    if (weakVerbCount > 0) {
      suggestions.push('Replace "did" with "developed"');
      suggestions.push('Replace "made" with "created"');
      suggestions.push('Replace "helped" with "collaborated"');
    }

    return suggestions;
  }

  validateContactInfo(contactInfo: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Email validation
    if (contactInfo.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactInfo.email)) {
        errors.push('Invalid email format');
        score -= 30;
      }
    }

    // Phone validation
    if (contactInfo.phone) {
      const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
      if (!phoneRegex.test(contactInfo.phone)) {
        errors.push('Invalid phone number format');
        score -= 20;
      }
    }

    // LinkedIn validation
    if (contactInfo.linkedin) {
      if (!contactInfo.linkedin.includes('linkedin.com')) {
        errors.push('Invalid LinkedIn profile URL');
        score -= 20;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
      suggestions: this.generateContactSuggestions(errors)
    };
  }

  private generateContactSuggestions(errors: string[]): string[] {
    const suggestions: string[] = [];
    
    if (errors.some(e => e.includes('email'))) {
      suggestions.push('Use a professional email format');
    }
    if (errors.some(e => e.includes('phone'))) {
      suggestions.push('Use standard phone number format');
    }
    if (errors.some(e => e.includes('LinkedIn'))) {
      suggestions.push('Include a valid LinkedIn profile URL');
    }

    return suggestions;
  }

  validateExperience(experience: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    const entries = experience.entries || [];

    entries.forEach((entry: ExperienceEntry) => {
      // Check for missing job descriptions
      if (!entry.description || entry.description.trim().length === 0) {
        errors.push('Job descriptions are required');
        score -= 20;
      }

      // Check date formats
      const dateRegex = /^\d{4}-\d{2}$/;
      if (entry.startDate && !dateRegex.test(entry.startDate)) {
        errors.push('Use consistent date format (YYYY-MM)');
        score -= 10;
      }
      if (entry.endDate && entry.endDate !== 'Present' && !dateRegex.test(entry.endDate)) {
        errors.push('Use consistent date format (YYYY-MM)');
        score -= 10;
      }
    });

    // Check for employment gaps
    const gaps = this.detectEmploymentGaps(entries);
    gaps.forEach(gap => {
      warnings.push(`Employment gap detected (${gap})`);
      score -= 5;
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
      suggestions: this.generateExperienceSuggestions(errors, warnings)
    };
  }

  private detectEmploymentGaps(entries: ExperienceEntry[]): string[] {
    const gaps: string[] = [];
    const sortedEntries = entries
      .filter(entry => entry.startDate && entry.endDate)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    for (let i = 0; i < sortedEntries.length - 1; i++) {
      const current = sortedEntries[i];
      const next = sortedEntries[i + 1];
      
      const currentEnd = current.endDate === 'Present' ? new Date() : new Date(current.endDate);
      const nextStart = new Date(next.startDate);
      
      const gapMonths = (currentEnd.getTime() - nextStart.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      if (gapMonths > 6) {
        const gapYear = new Date(currentEnd.getTime() + (nextStart.getTime() - currentEnd.getTime()) / 2).getFullYear();
        gaps.push(gapYear.toString());
      }
    }

    return gaps;
  }

  private generateExperienceSuggestions(errors: string[], warnings: string[]): string[] {
    const suggestions: string[] = [];
    
    if (errors.some(e => e.includes('descriptions'))) {
      suggestions.push('Add detailed job descriptions');
    }
    if (errors.some(e => e.includes('date format'))) {
      suggestions.push('Use YYYY-MM format for dates');
    }
    if (warnings.some(w => w.includes('gap'))) {
      suggestions.push('Consider explaining employment gaps');
    }

    return suggestions;
  }

  validateEducation(education: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    const entries = education.entries || [];

    entries.forEach((entry: EducationEntry) => {
      // Check for missing graduation dates
      if (!entry.graduationDate || entry.graduationDate.trim().length === 0) {
        errors.push('Graduation date is required');
        score -= 20;
      }

      // Check GPA format
      if (entry.gpa && !/^\d+\.\d+/.test(entry.gpa)) {
        errors.push('Use numeric GPA format');
        score -= 10;
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
      suggestions: this.generateEducationSuggestions(errors)
    };
  }

  private generateEducationSuggestions(errors: string[]): string[] {
    const suggestions: string[] = [];
    
    if (errors.some(e => e.includes('graduation date'))) {
      suggestions.push('Include graduation dates');
    }
    if (errors.some(e => e.includes('GPA'))) {
      suggestions.push('Use numeric GPA format (e.g., 3.8)');
    }

    return suggestions;
  }

  validateSkills(skills: SkillsData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    const totalSkills = skills.technical.length + skills.soft.length + skills.tools.length;

    // Check for too many skills
    if (totalSkills > this.MAX_SKILLS) {
      errors.push(`Too many skills listed (maximum ${this.MAX_SKILLS} recommended)`);
      score -= 30;
    }

    // Check for outdated skills
    const outdatedSkills = this.detectOutdatedSkills(skills);
    if (outdatedSkills.length > 0) {
      warnings.push('Consider removing outdated technologies');
      score -= 10;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
      suggestions: this.generateSkillsSuggestions(errors, warnings)
    };
  }

  private detectOutdatedSkills(skills: SkillsData): string[] {
    const outdatedTechnologies = [
      'jQuery', 'Flash', 'Internet Explorer', 'Silverlight', 'VB6'
    ];

    const allSkills = [...skills.technical, ...skills.tools];
    return allSkills.filter(skill => 
      outdatedTechnologies.some(outdated => 
        skill.toLowerCase().includes(outdated.toLowerCase())
      )
    );
  }

  private generateSkillsSuggestions(errors: string[], warnings: string[]): string[] {
    const suggestions: string[] = [];
    
    if (errors.some(e => e.includes('too many'))) {
      suggestions.push('Focus on your most relevant skills');
    }
    if (warnings.some(w => w.includes('outdated'))) {
      suggestions.push('Remove outdated technologies');
    }

    return suggestions;
  }

  validateResume(resumeData: any): ValidationResult {
    if (!resumeData) {
      throw new Error('Resume data is required');
    }

    const structureValidation = this.validateStructure(resumeData);
    const contentValidation = this.validateContentQuality(resumeData);
    const contactValidation = this.validateContactInfo(resumeData.contactInfo || {});
    const experienceValidation = this.validateExperience(resumeData.experience || {});
    const educationValidation = this.validateEducation(resumeData.education || {});
    const skillsValidation = this.validateSkills(resumeData.skills || { technical: [], soft: [], tools: [] });

    const allErrors = [
      ...structureValidation.errors,
      ...contentValidation.errors,
      ...contactValidation.errors,
      ...experienceValidation.errors,
      ...educationValidation.errors,
      ...skillsValidation.errors
    ];

    const allWarnings = [
      ...structureValidation.warnings,
      ...contentValidation.warnings,
      ...contactValidation.warnings,
      ...experienceValidation.warnings,
      ...educationValidation.warnings,
      ...skillsValidation.warnings
    ];

    const allSuggestions = [
      ...structureValidation.suggestions,
      ...contentValidation.suggestions,
      ...contactValidation.suggestions,
      ...experienceValidation.suggestions,
      ...educationValidation.suggestions,
      ...skillsValidation.suggestions
    ];

    const avgScore = (
      structureValidation.score +
      contentValidation.score +
      contactValidation.score +
      experienceValidation.score +
      educationValidation.score +
      skillsValidation.score
    ) / 6;

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      score: Math.round(avgScore),
      suggestions: [...new Set(allSuggestions)] // Remove duplicates
    };
  }
}
