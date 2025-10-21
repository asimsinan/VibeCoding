import { describe, it, expect, beforeEach } from '@jest/globals';
import { ValidationEngine } from '@/lib/core/validation/validation-engine';

// Validation Engine Tests
describe('ValidationEngine', () => {
  let validationEngine: ValidationEngine;

  beforeEach(() => {
    validationEngine = new ValidationEngine();
  });

  describe('Resume Structure Validation', () => {
    it('should validate required sections', () => {
      const resumeData = {
        sections: {
          contact: { present: true },
          summary: { present: true },
          experience: { present: true },
          education: { present: true },
          skills: { present: true }
        }
      };

      const validation = validationEngine.validateStructure(resumeData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should flag missing required sections', () => {
      const resumeData = {
        sections: {
          contact: { present: true },
          summary: { present: false },
          experience: { present: true },
          education: { present: false },
          skills: { present: true }
        }
      };

      const validation = validationEngine.validateStructure(resumeData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Professional summary is missing');
      expect(validation.errors).toContain('Education section is missing');
    });

    it('should validate section order', () => {
      const resumeData = {
        sections: {
          contact: { order: 1, present: true },
          summary: { order: 2, present: true },
          experience: { order: 3, present: true },
          education: { order: 4, present: true },
          skills: { order: 5, present: true }
        }
      };

      const validation = validationEngine.validateStructure(resumeData);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should warn about non-standard section order', () => {
      const resumeData = {
        sections: {
          contact: { order: 1, present: true },
          skills: { order: 2, present: true }, // Skills before summary
          summary: { order: 3, present: true },
          experience: { order: 4, present: true },
          education: { order: 5, present: true }
        }
      };

      const validation = validationEngine.validateStructure(resumeData);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('Consider placing skills section after experience');
    });
  });

  describe('Content Quality Validation', () => {
    it('should validate word count', () => {
      const resumeData = {
        wordCount: 500,
        sections: {
          summary: { wordCount: 100 },
          experience: { wordCount: 300 },
          education: { wordCount: 50 },
          skills: { wordCount: 50 }
        }
      };

      const validation = validationEngine.validateContentQuality(resumeData);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should flag insufficient content', () => {
      const resumeData = {
        wordCount: 150, // Too short
        sections: {
          summary: { wordCount: 20 },
          experience: { wordCount: 80 },
          education: { wordCount: 30 },
          skills: { wordCount: 20 }
        }
      };

      const validation = validationEngine.validateContentQuality(resumeData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Resume is too short (minimum 200 words recommended)');
    });

    it('should flag excessive content', () => {
      const resumeData = {
        wordCount: 2000, // Too long
        sections: {
          summary: { wordCount: 500 },
          experience: { wordCount: 1200 },
          education: { wordCount: 200 },
          skills: { wordCount: 100 }
        }
      };

      const validation = validationEngine.validateContentQuality(resumeData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Resume is too long (maximum 1000 words recommended)');
    });

    it('should validate action verb usage', () => {
      const resumeData = {
        experience: {
          achievements: [
            'Developed web applications',
            'Led development team',
            'Implemented new features',
            'Collaborated with stakeholders'
          ]
        }
      };

      const validation = validationEngine.validateActionVerbs(resumeData);

      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThan(80);
    });

    it('should flag weak action verbs', () => {
      const resumeData = {
        experience: {
          achievements: [
            'Did development work',
            'Made improvements',
            'Helped with projects',
            'Worked on features'
          ]
        }
      };

      const validation = validationEngine.validateActionVerbs(resumeData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Use stronger action verbs');
      expect(validation.suggestions).toContain('Replace "did" with "developed"');
    });
  });

  describe('Contact Information Validation', () => {
    it('should validate email format', () => {
      const contactInfo = {
        email: 'john.doe@email.com'
      };

      const validation = validationEngine.validateContactInfo(contactInfo);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should flag invalid email format', () => {
      const contactInfo = {
        email: 'invalid-email'
      };

      const validation = validationEngine.validateContactInfo(contactInfo);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid email format');
    });

    it('should validate phone number format', () => {
      const contactInfo = {
        phone: '(555) 123-4567'
      };

      const validation = validationEngine.validateContactInfo(contactInfo);

      expect(validation.isValid).toBe(true);
    });

    it('should flag invalid phone number format', () => {
      const contactInfo = {
        phone: '123'
      };

      const validation = validationEngine.validateContactInfo(contactInfo);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid phone number format');
    });

    it('should validate LinkedIn profile URL', () => {
      const contactInfo = {
        linkedin: 'linkedin.com/in/johndoe'
      };

      const validation = validationEngine.validateContactInfo(contactInfo);

      expect(validation.isValid).toBe(true);
    });

    it('should flag invalid LinkedIn URL', () => {
      const contactInfo = {
        linkedin: 'facebook.com/johndoe'
      };

      const validation = validationEngine.validateContactInfo(contactInfo);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid LinkedIn profile URL');
    });
  });

  describe('Experience Validation', () => {
    it('should validate work experience format', () => {
      const experience = {
        entries: [
          {
            title: 'Senior Software Engineer',
            company: 'Tech Corp',
            startDate: '2020-01',
            endDate: '2023-12',
            description: 'Led development team and implemented new features'
          }
        ]
      };

      const validation = validationEngine.validateExperience(experience);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should flag missing job descriptions', () => {
      const experience = {
        entries: [
          {
            title: 'Software Engineer',
            company: 'Tech Corp',
            startDate: '2020-01',
            endDate: '2023-12',
            description: '' // Missing description
          }
        ]
      };

      const validation = validationEngine.validateExperience(experience);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Job descriptions are required');
    });

    it('should validate date formats', () => {
      const experience = {
        entries: [
          {
            title: 'Software Engineer',
            company: 'Tech Corp',
            startDate: '2020-01',
            endDate: 'Present',
            description: 'Developed web applications using React and Node.js'
          }
        ]
      };

      const validation = validationEngine.validateExperience(experience);

      expect(validation.isValid).toBe(true);
    });

    it('should flag invalid date formats', () => {
      const experience = {
        entries: [
          {
            title: 'Software Engineer',
            company: 'Tech Corp',
            startDate: 'January 2020',
            endDate: 'December 2023'
          }
        ]
      };

      const validation = validationEngine.validateExperience(experience);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Use consistent date format (YYYY-MM)');
    });

    it('should detect employment gaps', () => {
      const experience = {
        entries: [
          {
            title: 'Software Engineer',
            company: 'Company A',
            startDate: '2018-01',
            endDate: '2020-12'
          },
          {
            title: 'Senior Engineer',
            company: 'Company B',
            startDate: '2022-01',
            endDate: 'Present'
          }
        ]
      };

      const validation = validationEngine.validateExperience(experience);

      expect(validation.warnings).toContain('Employment gap detected (2021)');
    });
  });

  describe('Education Validation', () => {
    it('should validate education entries', () => {
      const education = {
        entries: [
          {
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            institution: 'University of Technology',
            graduationDate: '2018-05',
            gpa: '3.8'
          }
        ]
      };

      const validation = validationEngine.validateEducation(education);

      expect(validation.isValid).toBe(true);
    });

    it('should flag missing graduation dates', () => {
      const education = {
        entries: [
          {
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            institution: 'University of Technology',
            graduationDate: '',
            gpa: '3.8'
          }
        ]
      };

      const validation = validationEngine.validateEducation(education);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Graduation date is required');
    });

    it('should validate GPA format', () => {
      const education = {
        entries: [
          {
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            institution: 'University of Technology',
            graduationDate: '2018-05',
            gpa: '3.8/4.0'
          }
        ]
      };

      const validation = validationEngine.validateEducation(education);

      expect(validation.isValid).toBe(true);
    });

    it('should flag invalid GPA format', () => {
      const education = {
        entries: [
          {
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            institution: 'University of Technology',
            graduationDate: '2018-05',
            gpa: 'A+'
          }
        ]
      };

      const validation = validationEngine.validateEducation(education);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Use numeric GPA format');
    });
  });

  describe('Skills Validation', () => {
    it('should validate skills categorization', () => {
      const skills = {
        technical: ['JavaScript', 'React', 'Node.js', 'Python'],
        soft: ['Leadership', 'Communication', 'Problem Solving'],
        tools: ['Git', 'Docker', 'AWS', 'Jenkins']
      };

      const validation = validationEngine.validateSkills(skills);

      expect(validation.isValid).toBe(true);
    });

    it('should flag too many skills', () => {
      const skills = {
        technical: Array(50).fill('Skill'), // Too many skills
        soft: ['Leadership', 'Communication'],
        tools: ['Git', 'Docker']
      };

      const validation = validationEngine.validateSkills(skills);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Too many skills listed (maximum 20 recommended)');
    });

    it('should validate skill relevance', () => {
      const skills = {
        technical: ['JavaScript', 'React', 'Node.js', 'Python', 'Machine Learning'],
        soft: ['Leadership', 'Communication'],
        tools: ['Git', 'Docker']
      };

      const validation = validationEngine.validateSkills(skills);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should flag outdated skills', () => {
      const skills = {
        technical: ['JavaScript', 'jQuery', 'Internet Explorer', 'Flash'],
        soft: ['Leadership', 'Communication'],
        tools: ['Git', 'Docker']
      };

      const validation = validationEngine.validateSkills(skills);

      expect(validation.warnings).toContain('Consider removing outdated technologies');
    });
  });

  describe('Overall Validation', () => {
    it('should provide comprehensive validation', () => {
      const resumeData = {
        sections: {
          contact: { present: true, wordCount: 30 },
          summary: { present: true, wordCount: 50 },
          experience: { present: true, wordCount: 200 },
          education: { present: true, wordCount: 40 },
          skills: { present: true, wordCount: 30 }
        },
        wordCount: 500,
        contactInfo: {
          email: 'john.doe@email.com',
          phone: '(555) 123-4567'
        },
        experience: {
          entries: [
            {
              title: 'Software Engineer',
              company: 'Tech Corp',
              startDate: '2020-01',
              endDate: 'Present',
              description: 'Developed web applications'
            }
          ]
        }
      };

      const validation = validationEngine.validateResume(resumeData);

      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThan(0);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
      expect(validation.suggestions).toBeDefined();
    });

    it('should handle validation errors gracefully', () => {
      expect(() => {
        validationEngine.validateResume(null);
      }).toThrow('Resume data is required');
    });
  });
});
