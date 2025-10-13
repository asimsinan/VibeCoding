import { DataValidationService } from '../lib/validation';
import { UserRole, CourseStatus, EnrollmentStatus, ProgressStatus, QuestionType, LessonType } from '@prisma/client';

describe('DataValidationService', () => {
  describe('Organization Validation', () => {
    it('should validate create organization data', () => {
      const validData = {
        name: 'Test Organization',
        domain: 'test.com',
        description: 'Test description',
        settings: { theme: 'dark' },
      };

      const result = DataValidationService.validate(
        DataValidationService.CreateOrganizationSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject invalid domain format', () => {
      const invalidData = {
        name: 'Test Organization',
        domain: 'invalid-domain',
        description: 'Test description',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateOrganizationSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });

    it('should reject empty organization name', () => {
      const invalidData = {
        name: '',
        domain: 'test.com',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateOrganizationSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('User Validation', () => {
    it('should validate create user data', () => {
      const validData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123',
        role: UserRole.STUDENT,
        organizationId: 'org-123',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Test bio',
        preferences: { theme: 'light' },
      };

      const result = DataValidationService.validate(
        DataValidationService.CreateUserSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'Password123',
        role: UserRole.STUDENT,
        organizationId: 'org-123',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateUserSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'weak',
        role: UserRole.STUDENT,
        organizationId: 'org-123',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateUserSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('Course Validation', () => {
    it('should validate create course data', () => {
      const validData = {
        title: 'Test Course',
        description: 'Test course description',
        organizationId: 'org-123',
        instructorId: 'instructor-123',
        status: CourseStatus.DRAFT,
        thumbnail: 'https://example.com/thumbnail.jpg',
        tags: ['javascript', 'web-development'],
        prerequisites: ['prereq-1', 'prereq-2'],
        learningObjectives: ['Learn JavaScript', 'Build web apps'],
        estimatedDuration: 120,
      };

      const result = DataValidationService.validate(
        DataValidationService.CreateCourseSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject course title that is too long', () => {
      const invalidData = {
        title: 'A'.repeat(201),
        description: 'Test course description',
        organizationId: 'org-123',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateCourseSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });

    it('should reject invalid estimated duration', () => {
      const invalidData = {
        title: 'Test Course',
        description: 'Test course description',
        organizationId: 'org-123',
        estimatedDuration: 0,
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateCourseSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('Module Validation', () => {
    it('should validate create module data', () => {
      const validData = {
        title: 'Test Module',
        courseId: 'course-123',
        organizationId: 'org-123',
        order: 1,
      };

      const result = DataValidationService.validate(
        DataValidationService.CreateModuleSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject invalid order', () => {
      const invalidData = {
        title: 'Test Module',
        courseId: 'course-123',
        organizationId: 'org-123',
        order: 0,
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateModuleSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('Lesson Validation', () => {
    it('should validate create lesson data', () => {
      const validData = {
        title: 'Test Lesson',
        content: 'Test lesson content',
        type: LessonType.VIDEO,
        moduleId: 'module-123',
        organizationId: 'org-123',
        order: 1,
        duration: 30,
        videoUrl: 'https://example.com/video.mp4',
        attachments: ['file1.pdf', 'file2.docx'],
      };

      const result = DataValidationService.validate(
        DataValidationService.CreateLessonSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject invalid lesson type', () => {
      const invalidData = {
        title: 'Test Lesson',
        content: 'Test lesson content',
        type: 'INVALID_TYPE',
        moduleId: 'module-123',
        organizationId: 'org-123',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateLessonSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });

    it('should reject invalid video URL', () => {
      const invalidData = {
        title: 'Test Lesson',
        content: 'Test lesson content',
        type: LessonType.VIDEO,
        moduleId: 'module-123',
        organizationId: 'org-123',
        videoUrl: 'not-a-url',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateLessonSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('Quiz Validation', () => {
    it('should validate create quiz data', () => {
      const validData = {
        title: 'Test Quiz',
        lessonId: 'lesson-123',
        timeLimit: 30,
        maxAttempts: 3,
        passingScore: 70,
        instructions: 'Test instructions',
      };

      const result = DataValidationService.validate(
        DataValidationService.CreateQuizSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject invalid time limit', () => {
      const invalidData = {
        title: 'Test Quiz',
        lessonId: 'lesson-123',
        timeLimit: 0,
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateQuizSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });

    it('should reject invalid passing score', () => {
      const invalidData = {
        title: 'Test Quiz',
        lessonId: 'lesson-123',
        passingScore: 101,
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateQuizSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('Question Validation', () => {
    it('should validate create question data', () => {
      const validData = {
        text: 'What is JavaScript?',
        type: QuestionType.MULTIPLE_CHOICE,
        options: ['A programming language', 'A markup language', 'A styling language'],
        correctAnswer: 'A programming language',
        explanation: 'JavaScript is a programming language',
        quizId: 'quiz-123',
        order: 1,
      };

      const result = DataValidationService.validate(
        DataValidationService.CreateQuestionSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject empty question text', () => {
      const invalidData = {
        text: '',
        type: QuestionType.MULTIPLE_CHOICE,
        quizId: 'quiz-123',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateQuestionSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });

    it('should reject invalid question type', () => {
      const invalidData = {
        text: 'What is JavaScript?',
        type: 'INVALID_TYPE',
        quizId: 'quiz-123',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateQuestionSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('Enrollment Validation', () => {
    it('should validate create enrollment data', () => {
      const validData = {
        userId: 'user-123',
        courseId: 'course-123',
        organizationId: 'org-123',
        status: EnrollmentStatus.ACTIVE,
        enrolledAt: new Date(),
      };

      const result = DataValidationService.validate(
        DataValidationService.CreateEnrollmentSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject invalid enrollment status', () => {
      const invalidData = {
        userId: 'user-123',
        courseId: 'course-123',
        organizationId: 'org-123',
        status: 'INVALID_STATUS',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateEnrollmentSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('Progress Validation', () => {
    it('should validate create progress data', () => {
      const validData = {
        userId: 'user-123',
        lessonId: 'lesson-123',
        status: ProgressStatus.COMPLETED,
        completedAt: new Date(),
      };

      const result = DataValidationService.validate(
        DataValidationService.CreateProgressSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject invalid progress status', () => {
      const invalidData = {
        userId: 'user-123',
        lessonId: 'lesson-123',
        status: 'INVALID_STATUS',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateProgressSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('Quiz Attempt Validation', () => {
    it('should validate create quiz attempt data', () => {
      const validData = {
        userId: 'user-123',
        quizId: 'quiz-123',
        answers: [
          { questionId: 'q1', answer: 'Option A' },
          { questionId: 'q2', answer: true },
          { questionId: 'q3', answer: ['Option 1', 'Option 2'] },
        ],
        score: 85,
        submittedAt: new Date(),
      };

      const result = DataValidationService.validate(
        DataValidationService.CreateQuizAttemptSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject empty answers array', () => {
      const invalidData = {
        userId: 'user-123',
        quizId: 'quiz-123',
        answers: [],
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateQuizAttemptSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });

    it('should reject invalid score', () => {
      const invalidData = {
        userId: 'user-123',
        quizId: 'quiz-123',
        answers: [{ questionId: 'q1', answer: 'Option A' }],
        score: 101,
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.CreateQuizAttemptSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('File Upload Validation', () => {
    it('should validate file upload data', () => {
      const validData = {
        filename: 'test-file.pdf',
        originalName: 'Test File.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        path: '/uploads/test-file.pdf',
        url: 'https://example.com/uploads/test-file.pdf',
        uploadedBy: 'user-123',
        organizationId: 'org-123',
        courseId: 'course-123',
        lessonId: 'lesson-123',
        description: 'Test file description',
      };

      const result = DataValidationService.validate(
        DataValidationService.FileUploadSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject file that is too large', () => {
      const invalidData = {
        filename: 'test-file.pdf',
        originalName: 'Test File.pdf',
        mimeType: 'application/pdf',
        size: 100 * 1024 * 1024, // 100MB
        path: '/uploads/test-file.pdf',
        url: 'https://example.com/uploads/test-file.pdf',
        uploadedBy: 'user-123',
        organizationId: 'org-123',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.FileUploadSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('Email Notification Validation', () => {
    it('should validate send email data', () => {
      const validData = {
        to: [{ email: 'test@example.com', name: 'Test User' }],
        cc: [{ email: 'cc@example.com', name: 'CC User' }],
        bcc: [{ email: 'bcc@example.com', name: 'BCC User' }],
        subject: 'Test Email',
        html: '<p>Test HTML content</p>',
        text: 'Test text content',
      };

      const result = DataValidationService.validate(
        DataValidationService.SendEmailSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject email without content', () => {
      const invalidData = {
        to: [{ email: 'test@example.com', name: 'Test User' }],
        subject: 'Test Email',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.SendEmailSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });

    it('should reject invalid email address', () => {
      const invalidData = {
        to: [{ email: 'invalid-email', name: 'Test User' }],
        subject: 'Test Email',
        text: 'Test content',
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.SendEmailSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('Search Validation', () => {
    it('should validate search data', () => {
      const validData = {
        query: 'JavaScript course',
        page: 1,
        pageSize: 10,
      };

      const result = DataValidationService.validate(
        DataValidationService.SearchSchema,
        validData
      );

      expect(result).toEqual(validData);
    });

    it('should reject empty search query', () => {
      const invalidData = {
        query: '',
        page: 1,
        pageSize: 10,
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.SearchSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });

    it('should reject invalid page number', () => {
      const invalidData = {
        query: 'JavaScript course',
        page: 0,
        pageSize: 10,
      };

      expect(() => {
        DataValidationService.validate(
          DataValidationService.SearchSchema,
          invalidData
        );
      }).toThrow('Validation failed');
    });
  });

  describe('Utility Methods', () => {
    describe('validateFileUpload', () => {
      it('should validate file upload object', () => {
        const file = {
          buffer: Buffer.from('test content'),
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          size: 1024,
        };

        const result = DataValidationService.validateFileUpload(file);

        expect(result).toEqual(file);
      });

      it('should reject unsupported file type', () => {
        const file = {
          buffer: Buffer.from('test content'),
          originalname: 'test.exe',
          mimetype: 'application/x-executable',
          size: 1024,
        };

        expect(() => {
          DataValidationService.validateFileUpload(file);
        }).toThrow('Validation failed');
      });
    });

    describe('validateEmail', () => {
      it('should validate email address', () => {
        const result = DataValidationService.validateEmail('test@example.com');
        expect(result).toBe('test@example.com');
      });

      it('should reject invalid email', () => {
        expect(() => {
          DataValidationService.validateEmail('invalid-email');
        }).toThrow('Validation failed');
      });
    });

    describe('validatePassword', () => {
      it('should validate strong password', () => {
        const result = DataValidationService.validatePassword('Password123');
        expect(result).toBe('Password123');
      });

      it('should reject weak password', () => {
        expect(() => {
          DataValidationService.validatePassword('weak');
        }).toThrow('Validation failed');
      });

      it('should reject password without uppercase letter', () => {
        expect(() => {
          DataValidationService.validatePassword('password123');
        }).toThrow('Validation failed');
      });

      it('should reject password without number', () => {
        expect(() => {
          DataValidationService.validatePassword('Password');
        }).toThrow('Validation failed');
      });
    });

    describe('validateUrl', () => {
      it('should validate URL', () => {
        const result = DataValidationService.validateUrl('https://example.com');
        expect(result).toBe('https://example.com');
      });

      it('should reject invalid URL', () => {
        expect(() => {
          DataValidationService.validateUrl('not-a-url');
        }).toThrow('Validation failed');
      });
    });

    describe('validateDateRange', () => {
      it('should validate date range', () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');

        const result = DataValidationService.validateDateRange(startDate, endDate);

        expect(result).toEqual({ startDate, endDate });
      });

      it('should reject invalid date range', () => {
        const startDate = new Date('2024-12-31');
        const endDate = new Date('2024-01-01');

        expect(() => {
          DataValidationService.validateDateRange(startDate, endDate);
        }).toThrow('Validation failed');
      });
    });

    describe('validatePagination', () => {
      it('should validate pagination parameters', () => {
        const result = DataValidationService.validatePagination(2, 20);

        expect(result).toEqual({ page: 2, pageSize: 20 });
      });

      it('should use default values', () => {
        const result = DataValidationService.validatePagination();

        expect(result).toEqual({ page: 1, pageSize: 10 });
      });

      it('should reject invalid page number', () => {
        expect(() => {
          DataValidationService.validatePagination(0, 10);
        }).toThrow('Validation failed');
      });

      it('should reject invalid page size', () => {
        expect(() => {
          DataValidationService.validatePagination(1, 0);
        }).toThrow('Validation failed');
      });
    });

    describe('validateMultiple', () => {
      it('should validate multiple fields', () => {
        const validations = [
          { field: 'name', schema: DataValidationService.IdSchema, data: 'test-id' },
          { field: 'email', schema: DataValidationService.IdSchema, data: 'test@example.com' },
        ];

        const result = DataValidationService.validateMultiple(validations);

        expect(result).toEqual({ name: 'test-id', email: 'test@example.com' });
      });

      it('should reject invalid fields', () => {
        const validations = [
          { field: 'name', schema: DataValidationService.IdSchema, data: '' },
          { field: 'email', schema: DataValidationService.IdSchema, data: 'test@example.com' },
        ];

        expect(() => {
          DataValidationService.validateMultiple(validations);
        }).toThrow('Validation failed');
      });
    });
  });
});
