import { describe, it, expect, beforeEach } from '@jest/globals';
import { TextProcessor } from '@/lib/core/processing/text-processor';

// Text Processing Utilities Tests
describe('TextProcessor', () => {
  let textProcessor: TextProcessor;

  beforeEach(() => {
    textProcessor = new TextProcessor();
  });

  describe('Text Cleaning', () => {
    it('should clean and normalize text', () => {
      const dirtyText = `
        John   Doe
        Software    Engineer
        john.doe@email.com
        (555) 123-4567
        
        PROFESSIONAL SUMMARY
        Experienced software engineer with 5+ years of experience...
      `;

      const cleanedText = textProcessor.cleanText(dirtyText);

      expect(cleanedText).toBeDefined();
      expect(cleanedText).not.toContain('   '); // No multiple spaces
      expect(cleanedText.trim()).toBe(cleanedText); // No leading/trailing whitespace
    });

    it('should remove special characters while preserving structure', () => {
      const textWithSpecialChars = `
        John Doe ★
        Software Engineer @ Tech Corp
        john.doe@email.com
        (555) 123-4567
        LinkedIn: linkedin.com/in/johndoe
      `;

      const cleanedText = textProcessor.cleanText(textWithSpecialChars);

      expect(cleanedText).toContain('john.doe@email.com'); // Preserve email
      expect(cleanedText).toContain('(555) 123-4567'); // Preserve phone
      expect(cleanedText).not.toContain('★'); // Remove decorative chars
    });

    it('should handle empty text', () => {
      expect(() => {
        textProcessor.cleanText('');
      }).toThrow('Text cannot be empty');
    });
  });

  describe('Section Detection', () => {
    it('should detect resume sections', () => {
      const resumeText = `
        John Doe
        Software Engineer
        john.doe@email.com
        
        PROFESSIONAL SUMMARY
        Experienced software engineer...
        
        WORK EXPERIENCE
        Senior Software Engineer | Tech Corp | 2020-2023
        - Led development team
        
        EDUCATION
        Bachelor of Science in Computer Science
        University of Technology | 2018
        
        SKILLS
        JavaScript, React, Node.js, Python
      `;

      const sections = textProcessor.detectSections(resumeText);

      expect(sections).toBeDefined();
      expect(sections.contact).toBeDefined();
      expect(sections.summary).toBeDefined();
      expect(sections.experience).toBeDefined();
      expect(sections.education).toBeDefined();
      expect(sections.skills).toBeDefined();
    });

    it('should handle alternative section names', () => {
      const resumeText = `
        John Doe
        
        ABOUT ME
        Software engineer with passion for technology...
        
        EMPLOYMENT HISTORY
        Software Engineer | Tech Corp | 2020-2023
        
        ACADEMIC BACKGROUND
        Bachelor of Science in Computer Science
        
        TECHNICAL SKILLS
        JavaScript, React, Node.js
      `;

      const sections = textProcessor.detectSections(resumeText);

      expect(sections.summary).toBeDefined(); // Should map "ABOUT ME" to summary
      expect(sections.experience).toBeDefined(); // Should map "EMPLOYMENT HISTORY" to experience
      expect(sections.education).toBeDefined(); // Should map "ACADEMIC BACKGROUND" to education
      expect(sections.skills).toBeDefined(); // Should map "TECHNICAL SKILLS" to skills
    });

    it('should handle missing sections gracefully', () => {
      const incompleteResume = `
        John Doe
        john.doe@email.com
        
        WORK EXPERIENCE
        Software Engineer | Tech Corp | 2020-2023
      `;

      const sections = textProcessor.detectSections(incompleteResume);

      expect(sections.contact).toBeDefined();
      expect(sections.experience).toBeDefined();
      expect(sections.summary).toBeUndefined();
      expect(sections.education).toBeUndefined();
      expect(sections.skills).toBeUndefined();
    });
  });

  describe('Contact Information Extraction', () => {
    it('should extract email addresses', () => {
      const text = `
        John Doe
        john.doe@email.com
        Contact: jane.smith@company.com
        Email me at: contact@example.org
      `;

      const emails = textProcessor.extractEmails(text);

      expect(emails).toContain('john.doe@email.com');
      expect(emails).toContain('jane.smith@company.com');
      expect(emails).toContain('contact@example.org');
    });

    it('should extract phone numbers', () => {
      const text = `
        John Doe
        Phone: (555) 123-4567
        Mobile: 555-987-6543
        Tel: +1 (555) 111-2222
        Call me: 555.333.4444
      `;

      const phones = textProcessor.extractPhoneNumbers(text);

      expect(phones).toContain('(555) 123-4567');
      expect(phones).toContain('555-987-6543');
      expect(phones).toContain('+1 (555) 111-2222');
      expect(phones).toContain('555.333.4444');
    });

    it('should extract LinkedIn profiles', () => {
      const text = `
        John Doe
        LinkedIn: linkedin.com/in/johndoe
        Profile: https://www.linkedin.com/in/jane-smith
        Connect: www.linkedin.com/in/tech-professional
      `;

      const linkedinProfiles = textProcessor.extractLinkedInProfiles(text);

      expect(linkedinProfiles).toContain('linkedin.com/in/johndoe');
      expect(linkedinProfiles).toContain('linkedin.com/in/jane-smith');
      expect(linkedinProfiles).toContain('linkedin.com/in/tech-professional');
    });

    it('should extract GitHub profiles', () => {
      const text = `
        John Doe
        GitHub: github.com/johndoe
        Code: https://github.com/jane-smith
        Portfolio: www.github.com/tech-dev
      `;

      const githubProfiles = textProcessor.extractGitHubProfiles(text);

      expect(githubProfiles).toContain('github.com/johndoe');
      expect(githubProfiles).toContain('github.com/jane-smith');
      expect(githubProfiles).toContain('github.com/tech-dev');
    });
  });

  describe('Keyword Extraction', () => {
    it('should extract technical skills', () => {
      const text = `
        TECHNICAL SKILLS
        Programming Languages: JavaScript, TypeScript, Python, Java, C++
        Frameworks: React, Angular, Vue.js, Node.js, Express
        Databases: MySQL, PostgreSQL, MongoDB, Redis
        Tools: Git, Docker, Kubernetes, AWS, Jenkins
      `;

      const skills = textProcessor.extractTechnicalSkills(text);

      expect(skills.programmingLanguages).toContain('JavaScript');
      expect(skills.programmingLanguages).toContain('Python');
      expect(skills.frameworks).toContain('React');
      expect(skills.frameworks).toContain('Node.js');
      expect(skills.databases).toContain('MongoDB');
      expect(skills.tools).toContain('Docker');
    });

    it('should extract soft skills', () => {
      const text = `
        SKILLS
        Leadership, Team Management, Communication, Problem Solving,
        Project Management, Agile Methodology, Scrum Master
      `;

      const softSkills = textProcessor.extractSoftSkills(text);

      expect(softSkills).toContain('Leadership');
      expect(softSkills).toContain('Communication');
      expect(softSkills).toContain('Problem Solving');
      expect(softSkills).toContain('Project Management');
    });

    it('should extract industry keywords', () => {
      const text = `
        EXPERIENCE
        - Developed REST APIs and microservices architecture
        - Implemented CI/CD pipelines and DevOps practices
        - Worked with cloud computing and containerization
        - Applied machine learning algorithms and data science
      `;

      const industryKeywords = textProcessor.extractIndustryKeywords(text);

      expect(industryKeywords).toContain('REST APIs');
      expect(industryKeywords).toContain('microservices');
      expect(industryKeywords).toContain('CI/CD');
      expect(industryKeywords).toContain('DevOps');
      expect(industryKeywords).toContain('cloud computing');
      expect(industryKeywords).toContain('machine learning');
    });
  });

  describe('Text Analysis', () => {
    it('should calculate word count', () => {
      const text = 'This is a sample text with ten words total.';
      const wordCount = textProcessor.getWordCount(text);

      expect(wordCount).toBe(9); // Fixed: "This is a sample text with ten words total." has 9 words
    });

    it('should calculate readability score', () => {
      const simpleText = 'The cat sat on the mat.';
      const complexText = 'The implementation of sophisticated algorithms necessitates comprehensive understanding of computational complexity.';

      const simpleScore = textProcessor.calculateReadability(simpleText);
      const complexScore = textProcessor.calculateReadability(complexText);

      expect(simpleScore).toBeGreaterThan(complexScore);
      expect(simpleScore).toBeGreaterThan(0);
      expect(complexScore).toBeGreaterThan(0);
    });

    it('should detect action verbs', () => {
      const text = `
        WORK EXPERIENCE
        - Developed web applications
        - Led development team
        - Implemented new features
        - Collaborated with stakeholders
        - Optimized system performance
      `;

      const actionVerbs = textProcessor.extractActionVerbs(text);

      expect(actionVerbs).toContain('Developed');
      expect(actionVerbs).toContain('Led');
      expect(actionVerbs).toContain('Implemented');
      expect(actionVerbs).toContain('Collaborated');
      expect(actionVerbs).toContain('Optimized');
    });

    it('should detect quantified achievements', () => {
      const text = `
        ACHIEVEMENTS
        - Improved system performance by 40%
        - Reduced deployment time by 60%
        - Led team of 5 developers
        - Increased user engagement by 25%
        - Managed budget of $100,000
      `;

      const quantifiedAchievements = textProcessor.extractQuantifiedAchievements(text);

      expect(quantifiedAchievements).toHaveLength(5);
      expect(quantifiedAchievements).toContain('40%');
      expect(quantifiedAchievements).toContain('60%');
      expect(quantifiedAchievements).toContain('5 developers');
      expect(quantifiedAchievements).toContain('25%');
      expect(quantifiedAchievements).toContain('$100,000');
    });
  });

  describe('Text Validation', () => {
    it('should validate text length', () => {
      const shortText = 'Short text';
      const longText = 'A'.repeat(100001); // Fixed: Use 100001 to exceed MAX_TEXT_LENGTH

      expect(textProcessor.validateTextLength(shortText)).toBe(true);
      expect(textProcessor.validateTextLength(longText)).toBe(false);
    });

    it('should detect spam or irrelevant content', () => {
      const spamText = 'Buy now! Click here! Free money!';
      const relevantText = 'Software engineer with 5 years of experience in web development.';

      expect(textProcessor.detectSpam(spamText)).toBe(true);
      expect(textProcessor.detectSpam(relevantText)).toBe(false);
    });

    it('should handle encoding issues', () => {
      const textWithEncodingIssues = 'John Doe – Software Engineer (with special chars)';

      const cleanedText = textProcessor.handleEncodingIssues(textWithEncodingIssues);

      expect(cleanedText).toBeDefined();
      expect(cleanedText).not.toContain('–'); // Should normalize special chars
    });
  });
});
