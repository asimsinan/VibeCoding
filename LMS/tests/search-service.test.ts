import { SearchService } from '../services/search.service';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    course: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    module: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    lesson: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    quiz: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  })),
}));

describe('SearchService', () => {
  let searchService: SearchService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      course: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      module: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      lesson: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      quiz: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      question: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    searchService = new SearchService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchAll', () => {
    it('should search across all content types', async () => {
      const mockCourses = [
        { id: 'course-1', title: 'JavaScript Course', description: 'Learn JavaScript' },
      ];
      const mockModules = [
        { id: 'module-1', title: 'JavaScript Basics', description: 'Basic concepts' },
      ];
      const mockLessons = [
        { id: 'lesson-1', title: 'Variables', content: 'Learn about variables' },
      ];

      mockPrisma.course.findMany.mockResolvedValue(mockCourses);
      mockPrisma.course.count.mockResolvedValue(1);
      mockPrisma.module.findMany.mockResolvedValue(mockModules);
      mockPrisma.module.count.mockResolvedValue(1);
      mockPrisma.lesson.findMany.mockResolvedValue(mockLessons);
      mockPrisma.lesson.count.mockResolvedValue(1);

      const result = await searchService.searchAll(
        'javascript',
        'org-123',
        { type: 'all' },
        { page: 1, pageSize: 10 }
      );

      expect(result.results).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.query).toBe('javascript');
      expect(result.results[0].type).toBe('course');
      expect(result.results[1].type).toBe('module');
      expect(result.results[2].type).toBe('lesson');
    });

    it('should filter by content type', async () => {
      const mockCourses = [
        { id: 'course-1', title: 'JavaScript Course', description: 'Learn JavaScript' },
      ];

      mockPrisma.course.findMany.mockResolvedValue(mockCourses);
      mockPrisma.course.count.mockResolvedValue(1);

      const result = await searchService.searchAll(
        'javascript',
        'org-123',
        { type: 'course' },
        { page: 1, pageSize: 10 }
      );

      expect(result.results).toHaveLength(1);
      expect(result.results[0].type).toBe('course');
    });

    it('should apply filters correctly', async () => {
      const mockCourses = [
        { id: 'course-1', title: 'JavaScript Course', status: 'PUBLISHED' },
      ];

      mockPrisma.course.findMany.mockResolvedValue(mockCourses);
      mockPrisma.course.count.mockResolvedValue(1);

      const result = await searchService.searchAll(
        'javascript',
        'org-123',
        { type: 'course', status: 'PUBLISHED' },
        { page: 1, pageSize: 10 }
      );

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            status: 'PUBLISHED',
          }),
        })
      );
    });
  });

  describe('searchCourses', () => {
    it('should search courses with correct parameters', async () => {
      const mockCourses = [
        { id: 'course-1', title: 'JavaScript Course', description: 'Learn JavaScript' },
      ];

      mockPrisma.course.findMany.mockResolvedValue(mockCourses);
      mockPrisma.course.count.mockResolvedValue(1);

      const result = await searchService.searchCourses(
        'javascript',
        'org-123',
        {},
        { page: 1, pageSize: 10 }
      );

      expect(result.results).toHaveLength(1);
      expect(result.results[0].item.title).toBe('JavaScript Course');
      expect(result.results[0].type).toBe('course');
      expect(result.results[0].score).toBeGreaterThan(0);
    });

    it('should include highlights when requested', async () => {
      const mockCourses = [
        { id: 'course-1', title: 'JavaScript Course', description: 'Learn JavaScript' },
      ];

      mockPrisma.course.findMany.mockResolvedValue(mockCourses);
      mockPrisma.course.count.mockResolvedValue(1);

      const result = await searchService.searchCourses(
        'javascript',
        'org-123',
        {},
        { page: 1, pageSize: 10, includeHighlights: true }
      );

      expect(result.results[0].highlights).toBeDefined();
      expect(Array.isArray(result.results[0].highlights)).toBe(true);
    });

    it('should apply course-specific filters', async () => {
      const mockCourses = [
        { id: 'course-1', title: 'JavaScript Course', status: 'PUBLISHED' },
      ];

      mockPrisma.course.findMany.mockResolvedValue(mockCourses);
      mockPrisma.course.count.mockResolvedValue(1);

      const result = await searchService.searchCourses(
        'javascript',
        'org-123',
        { status: 'PUBLISHED', tags: ['programming'] },
        { page: 1, pageSize: 10 }
      );

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            status: 'PUBLISHED',
            tags: { hasSome: ['programming'] },
          }),
        })
      );
    });
  });

  describe('searchModules', () => {
    it('should search modules with correct parameters', async () => {
      const mockModules = [
        { id: 'module-1', title: 'JavaScript Basics', description: 'Basic concepts' },
      ];

      mockPrisma.module.findMany.mockResolvedValue(mockModules);
      mockPrisma.module.count.mockResolvedValue(1);

      const result = await searchService.searchModules(
        'javascript',
        'org-123',
        {},
        { page: 1, pageSize: 10 }
      );

      expect(result.results).toHaveLength(1);
      expect(result.results[0].item.title).toBe('JavaScript Basics');
      expect(result.results[0].type).toBe('module');
    });
  });

  describe('searchLessons', () => {
    it('should search lessons with correct parameters', async () => {
      const mockLessons = [
        { id: 'lesson-1', title: 'Variables', content: 'Learn about variables' },
      ];

      mockPrisma.lesson.findMany.mockResolvedValue(mockLessons);
      mockPrisma.lesson.count.mockResolvedValue(1);

      const result = await searchService.searchLessons(
        'variables',
        'org-123',
        {},
        { page: 1, pageSize: 10 }
      );

      expect(result.results).toHaveLength(1);
      expect(result.results[0].item.title).toBe('Variables');
      expect(result.results[0].type).toBe('lesson');
    });

    it('should apply lesson-specific filters', async () => {
      const mockLessons = [
        { id: 'lesson-1', title: 'Variables', type: 'TEXT' },
      ];

      mockPrisma.lesson.findMany.mockResolvedValue(mockLessons);
      mockPrisma.lesson.count.mockResolvedValue(1);

      const result = await searchService.searchLessons(
        'variables',
        'org-123',
        { type: 'TEXT' },
        { page: 1, pageSize: 10 }
      );

      expect(mockPrisma.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'TEXT',
          }),
        })
      );
    });
  });

  describe('searchQuizzes', () => {
    it('should search quizzes with correct parameters', async () => {
      const mockQuizzes = [
        { id: 'quiz-1', title: 'JavaScript Quiz', description: 'Test your knowledge' },
      ];

      mockPrisma.quiz.findMany.mockResolvedValue(mockQuizzes);
      mockPrisma.quiz.count.mockResolvedValue(1);

      const result = await searchService.searchQuizzes(
        'javascript',
        'org-123',
        {},
        { page: 1, pageSize: 10 }
      );

      expect(result.results).toHaveLength(1);
      expect(result.results[0].item.title).toBe('JavaScript Quiz');
      expect(result.results[0].type).toBe('quiz');
    });
  });

  describe('searchQuestions', () => {
    it('should search questions with correct parameters', async () => {
      const mockQuestions = [
        { id: 'question-1', text: 'What is JavaScript?', type: 'MULTIPLE_CHOICE' },
      ];

      mockPrisma.question.findMany.mockResolvedValue(mockQuestions);
      mockPrisma.question.count.mockResolvedValue(1);

      const result = await searchService.searchQuestions(
        'javascript',
        'org-123',
        {},
        { page: 1, pageSize: 10 }
      );

      expect(result.results).toHaveLength(1);
      expect(result.results[0].item.text).toBe('What is JavaScript?');
      expect(result.results[0].type).toBe('question');
    });

    it('should apply question-specific filters', async () => {
      const mockQuestions = [
        { id: 'question-1', text: 'What is JavaScript?', type: 'MULTIPLE_CHOICE' },
      ];

      mockPrisma.question.findMany.mockResolvedValue(mockQuestions);
      mockPrisma.question.count.mockResolvedValue(1);

      const result = await searchService.searchQuestions(
        'javascript',
        'org-123',
        { type: 'MULTIPLE_CHOICE' },
        { page: 1, pageSize: 10 }
      );

      expect(mockPrisma.question.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'MULTIPLE_CHOICE',
          }),
        })
      );
    });
  });

  describe('searchUsers', () => {
    it('should search users with correct parameters', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await searchService.searchUsers(
        'john',
        'org-123',
        {},
        { page: 1, pageSize: 10 }
      );

      expect(result.results).toHaveLength(1);
      expect(result.results[0].item.name).toBe('John Doe');
      expect(result.results[0].type).toBe('user');
    });

    it('should apply user-specific filters', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'John Doe', role: 'INSTRUCTOR' },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await searchService.searchUsers(
        'john',
        'org-123',
        { status: 'INSTRUCTOR' },
        { page: 1, pageSize: 10 }
      );

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-123',
            role: 'INSTRUCTOR',
          }),
        })
      );
    });
  });

  describe('getSuggestions', () => {
    it('should return search suggestions', async () => {
      const mockCourses = [
        { title: 'JavaScript Course' },
        { title: 'JavaScript Advanced' },
      ];
      const mockLessons = [
        { title: 'JavaScript Variables' },
        { title: 'JavaScript Functions' },
      ];

      mockPrisma.course.findMany.mockResolvedValue(mockCourses);
      mockPrisma.lesson.findMany.mockResolvedValue(mockLessons);

      const suggestions = await searchService.getSuggestions('javascript', 'org-123');

      expect(suggestions).toContain('JavaScript Course');
      expect(suggestions).toContain('JavaScript Advanced');
      expect(suggestions).toContain('JavaScript Variables');
      expect(suggestions).toContain('JavaScript Functions');
    });

    it('should return empty array for short queries', async () => {
      const suggestions = await searchService.getSuggestions('j', 'org-123');
      expect(suggestions).toEqual([]);
    });
  });

  describe('Private Methods', () => {
    describe('parseSearchQuery', () => {
      it('should parse search query into terms', () => {
        const service = searchService as any;
        const terms = service.parseSearchQuery('JavaScript programming course');
        expect(terms).toEqual(['javascript', 'programming', 'course']);
      });

      it('should handle empty query', () => {
        const service = searchService as any;
        const terms = service.parseSearchQuery('');
        expect(terms).toEqual([]);
      });

      it('should handle query with special characters', () => {
        const service = searchService as any;
        const terms = service.parseSearchQuery('JavaScript & React!');
        expect(terms).toEqual(['javascript', '&', 'react!']);
      });
    });

    describe('calculateRelevanceScore', () => {
      it('should calculate relevance score', () => {
        const service = searchService as any;
        const item = { title: 'JavaScript Course', description: 'Learn JavaScript programming' };
        const terms = ['javascript', 'programming'];
        const score = service.calculateRelevanceScore(item, terms);
        expect(score).toBeGreaterThan(0);
      });

      it('should boost score for title matches', () => {
        const service = searchService as any;
        const item = { title: 'JavaScript Course', description: 'Learn programming' };
        const terms = ['javascript'];
        const score = service.calculateRelevanceScore(item, terms);
        expect(score).toBeGreaterThan(1); // Should be boosted for title match
      });
    });

    describe('generateHighlights', () => {
      it('should generate highlights', () => {
        const service = searchService as any;
        const item = { title: 'JavaScript Course', description: 'Learn JavaScript programming' };
        const terms = ['javascript'];
        const highlights = service.generateHighlights(item, terms);
        expect(Array.isArray(highlights)).toBe(true);
        expect(highlights.length).toBeGreaterThan(0);
      });
    });

    describe('getOrderBy', () => {
      it('should return correct order by clause', () => {
        const service = searchService as any;
        const orderBy = service.getOrderBy('date', 'desc');
        expect(orderBy).toEqual({ createdAt: 'desc' });
      });

      it('should return title order by clause', () => {
        const service = searchService as any;
        const orderBy = service.getOrderBy('title', 'asc');
        expect(orderBy).toEqual({ title: 'asc' });
      });

      it('should default to date order', () => {
        const service = searchService as any;
        const orderBy = service.getOrderBy('unknown', 'desc');
        expect(orderBy).toEqual({ createdAt: 'desc' });
      });
    });
  });
});
