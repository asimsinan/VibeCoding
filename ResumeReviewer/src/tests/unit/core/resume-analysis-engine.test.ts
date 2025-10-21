import { describe, it, expect, beforeEach } from '@jest/globals';
import { ResumeAnalysisEngine } from '@/lib/core';

// Resume Analysis Engine Tests
describe('ResumeAnalysisEngine', () => {
  let analysisEngine: ResumeAnalysisEngine;

  beforeEach(() => {
    analysisEngine = new ResumeAnalysisEngine();
  });

  describe('Content Analysis', () => {
    it('should analyze resume content structure', () => {
      const resumeText = `
        John Doe
        Software Engineer
        john.doe@email.com
        (555) 123-4567
        
        PROFESSIONAL SUMMARY
        Experienced software engineer with 5+ years of experience...
        
        WORK EXPERIENCE
        Senior Software Engineer | Tech Corp | 2020-2023
        - Led development of microservices architecture
        - Improved system performance by 40%
        
        EDUCATION
        Bachelor of Science in Computer Science
        University of Technology | 2018
      `;

      const result = analysisEngine.analyzeContent(resumeText);

      expect(result).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(result.sections.summary).toBeDefined();
      expect(result.sections.experience).toBeDefined();
      expect(result.sections.education).toBeDefined();
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.readabilityScore).toBeGreaterThan(0);
    });

    it('should identify missing sections', () => {
      const incompleteResume = `
        John Doe
        john.doe@email.com
        (555) 123-4567
        
        WORK EXPERIENCE
        Software Engineer | Tech Corp | 2020-2023
      `;

      const result = analysisEngine.analyzeContent(incompleteResume);

      expect(result.missingSections).toContain('summary');
      expect(result.missingSections).toContain('education');
      expect(result.missingSections).toContain('skills');
    });

    it('should detect formatting issues', () => {
      const poorlyFormattedResume = `
        JOHN DOE
        SOFTWARE ENGINEER
        john.doe@email.com
        (555) 123-4567
        
        work experience
        Software Engineer | Tech Corp | 2020-2023
        led development team
        improved performance
      `;

      const result = analysisEngine.analyzeContent(poorlyFormattedResume);

      expect(result.formattingIssues).toBeDefined();
      expect(result.formattingIssues.inconsistentCapitalization).toBe(true);
      expect(result.formattingIssues.missingBulletPoints).toBe(true);
    });

    it('should extract contact information', () => {
      const resumeText = `
        John Doe
        Senior Software Engineer
        john.doe@email.com
        (555) 123-4567
        linkedin.com/in/johndoe
        github.com/johndoe
      `;

      const result = analysisEngine.extractContactInfo(resumeText);

      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@email.com');
      expect(result.phone).toBe('(555) 123-4567');
      expect(result.linkedin).toBe('linkedin.com/in/johndoe');
      expect(result.github).toBe('github.com/johndoe');
    });

    it('should analyze work experience depth', () => {
      const resumeText = `
        WORK EXPERIENCE
        
        Senior Software Engineer | Tech Corp | 2020-2023
        - Led development of microservices architecture serving 1M+ users
        - Improved system performance by 40% through optimization
        - Mentored team of 5 junior developers
        - Implemented CI/CD pipeline reducing deployment time by 60%
        
        Software Engineer | Startup Inc | 2018-2020
        - Developed REST APIs using Node.js and Express
        - Collaborated with cross-functional teams
      `;

      const result = analysisEngine.analyzeWorkExperience(resumeText);

      expect(result.experienceDepth).toBeDefined();
      expect(result.experienceDepth.totalYears).toBeGreaterThan(0);
      expect(result.experienceDepth.achievementsCount).toBeGreaterThan(0);
      expect(result.experienceDepth.quantifiedResults).toBeGreaterThan(0);
      expect(result.experienceDepth.leadershipExperience).toBe(true);
    });
  });

  describe('Keyword Analysis', () => {
    it('should identify relevant keywords', () => {
      const resumeText = `
        Software Engineer with experience in:
        - JavaScript, TypeScript, React, Node.js
        - Python, Django, Flask
        - AWS, Docker, Kubernetes
        - Agile, Scrum methodologies
        - Machine Learning, Data Science
      `;

      const result = analysisEngine.analyzeKeywords(resumeText);

      expect(result.technicalSkills).toContain('JavaScript');
      expect(result.technicalSkills).toContain('React');
      expect(result.technicalSkills).toContain('Python');
      expect(result.cloudTechnologies).toContain('AWS');
      expect(result.methodologies).toContain('Agile');
    });

    it('should detect missing industry keywords', () => {
      const resumeText = `
        Software Engineer
        - Developed web applications
        - Worked with databases
        - Used various programming languages
      `;

      const result = analysisEngine.analyzeKeywords(resumeText);

      expect(result.missingKeywords).toBeDefined();
      expect(result.missingKeywords.length).toBeGreaterThan(0);
    });

    it('should score keyword density', () => {
      const resumeText = `
        Full-stack developer with expertise in React, Node.js, and MongoDB.
        Experienced in building scalable applications using React components
        and Node.js backend services. Proficient in MongoDB database design.
      `;

      const result = analysisEngine.analyzeKeywords(resumeText);

      expect(result.keywordDensity).toBeDefined();
      expect(result.keywordDensity.React).toBeGreaterThan(0);
      expect(result.keywordDensity['Node.js']).toBeGreaterThan(0);
      expect(result.keywordDensity.MongoDB).toBeGreaterThan(0);
    });
  });

  describe('Content Quality Analysis', () => {
    it('should detect weak action verbs', () => {
      const resumeText = `
        WORK EXPERIENCE
        Software Engineer | Tech Corp | 2020-2023
        - Did development work
        - Made improvements
        - Helped with projects
        - Worked on features
      `;

      const result = analysisEngine.analyzeContentQuality(resumeText);

      expect(result.weakActionVerbs).toBeDefined();
      expect(result.weakActionVerbs.length).toBeGreaterThan(0);
      expect(result.weakActionVerbs).toContain('did');
      expect(result.weakActionVerbs).toContain('made');
    });

    it('should identify quantified achievements', () => {
      const resumeText = `
        WORK EXPERIENCE
        Software Engineer | Tech Corp | 2020-2023
        - Improved system performance by 40%
        - Reduced deployment time by 60%
        - Led team of 5 developers
        - Increased user engagement by 25%
      `;

      const result = analysisEngine.analyzeContentQuality(resumeText);

      expect(result.quantifiedAchievements).toBeGreaterThan(0);
      expect(result.hasMetrics).toBe(true);
    });

    it('should detect generic phrases', () => {
      const resumeText = `
        PROFESSIONAL SUMMARY
        Hardworking and dedicated professional with excellent communication skills.
        Team player who works well with others. Detail-oriented and organized.
        Looking for opportunities to grow and learn.
      `;

      const result = analysisEngine.analyzeContentQuality(resumeText);

      expect(result.genericPhrases).toBeDefined();
      expect(result.genericPhrases.length).toBeGreaterThan(0);
      expect(result.genericPhrases).toContain('hardworking');
      expect(result.genericPhrases).toContain('team player');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty resume text', () => {
      expect(() => {
        analysisEngine.analyzeContent('');
      }).toThrow('Resume text cannot be empty');
    });

    it('should handle null input', () => {
      expect(() => {
        analysisEngine.analyzeContent(null);
      }).toThrow('Resume text is required');
    });

    it('should handle extremely long text', () => {
      const longText = 'A'.repeat(100000);
      
      expect(() => {
        analysisEngine.analyzeContent(longText);
      }).toThrow('Resume text exceeds maximum length');
    });
  });
});
