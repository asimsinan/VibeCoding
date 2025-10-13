import { PrismaClient, Course, Module, Lesson, Quiz, Question, User } from '../generated/prisma';
import { cacheService, CacheKeyGenerator } from './caching.service';

/**
 * Search result interface
 */
interface SearchResult<T> {
  item: T;
  score: number;
  highlights: string[];
  type: string;
}

/**
 * Search filters interface
 */
interface SearchFilters {
  type?: 'course' | 'module' | 'lesson' | 'quiz' | 'question' | 'user' | 'all';
  status?: string;
  category?: string;
  level?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  organizationId?: string;
}

/**
 * Search options interface
 */
interface SearchOptions {
  page?: number;
  pageSize?: number;
  sortBy?: 'relevance' | 'date' | 'title' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  includeHighlights?: boolean;
  fuzzySearch?: boolean;
}

/**
 * Search response interface
 */
interface SearchResponse<T> {
  results: SearchResult<T>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
  filters: SearchFilters;
  suggestions?: string[];
}

/**
 * Comprehensive search service for courses and content
 */
export class SearchService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Search across all content types
   * @param query - Search query
   * @param organizationId - Organization ID
   * @param filters - Search filters
   * @param options - Search options
   * @returns Search results
   */
  async searchAll(
    query: string,
    organizationId: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResponse<any>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'relevance',
      sortOrder = 'desc',
      includeHighlights = true,
      fuzzySearch = true,
    } = options;

    const skip = (page - 1) * pageSize;
    const searchType = filters.type || 'all';

    // Check cache first
    const cacheKey = CacheKeyGenerator.search(query, organizationId, { ...filters, ...options });
    const cachedResult = cacheService.get<SearchResponse<any>>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const results: SearchResult<any>[] = [];
    let total = 0;

    // Search courses
    if (searchType === 'all' || searchType === 'course') {
      const courseResults = await this.searchCourses(query, organizationId, filters, {
        ...options,
        page: 1,
        pageSize: 1000, // Get all for combined results
      });
      results.push(...courseResults.results);
      total += courseResults.total;
    }

    // Search modules
    if (searchType === 'all' || searchType === 'module') {
      const moduleResults = await this.searchModules(query, organizationId, filters, {
        ...options,
        page: 1,
        pageSize: 1000,
      });
      results.push(...moduleResults.results);
      total += moduleResults.total;
    }

    // Search lessons
    if (searchType === 'all' || searchType === 'lesson') {
      const lessonResults = await this.searchLessons(query, organizationId, filters, {
        ...options,
        page: 1,
        pageSize: 1000,
      });
      results.push(...lessonResults.results);
      total += lessonResults.total;
    }

    // Search quizzes
    if (searchType === 'all' || searchType === 'quiz') {
      const quizResults = await this.searchQuizzes(query, organizationId, filters, {
        ...options,
        page: 1,
        pageSize: 1000,
      });
      results.push(...quizResults.results);
      total += quizResults.total;
    }

    // Search questions
    if (searchType === 'all' || searchType === 'question') {
      const questionResults = await this.searchQuestions(query, organizationId, filters, {
        ...options,
        page: 1,
        pageSize: 1000,
      });
      results.push(...questionResults.results);
      total += questionResults.total;
    }

    // Search users (if admin)
    if (searchType === 'all' || searchType === 'user') {
      const userResults = await this.searchUsers(query, organizationId, filters, {
        ...options,
        page: 1,
        pageSize: 1000,
      });
      results.push(...userResults.results);
      total += userResults.total;
    }

    // Sort results
    results.sort((a, b) => {
      if (sortBy === 'relevance') {
        return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
      } else if (sortBy === 'title') {
        const titleA = (a.item as any).title?.toLowerCase() || '';
        const titleB = (b.item as any).title?.toLowerCase() || '';
        return sortOrder === 'desc' 
          ? titleB.localeCompare(titleA)
          : titleA.localeCompare(titleB);
      } else if (sortBy === 'date') {
        const dateA = new Date((a.item as any).createdAt).getTime();
        const dateB = new Date((b.item as any).createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      }
      return 0;
    });

    // Paginate results
    const paginatedResults = results.slice(skip, skip + pageSize);

    // Generate suggestions
    const suggestions = await this.generateSuggestions(query, organizationId);

    const response: SearchResponse<any> = {
      results: paginatedResults,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      query,
      filters,
      suggestions,
    };

    // Cache the result
    cacheService.set(cacheKey, response, 300); // 5 minutes

    return response;
  }

  /**
   * Search courses
   * @param query - Search query
   * @param organizationId - Organization ID
   * @param filters - Search filters
   * @param options - Search options
   * @returns Course search results
   */
  async searchCourses(
    query: string,
    organizationId: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResponse<Course>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'relevance',
      sortOrder = 'desc',
      includeHighlights = true,
    } = options;

    const skip = (page - 1) * pageSize;
    const searchTerms = this.parseSearchQuery(query);

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    // Search in title and description
    if (searchTerms.length > 0) {
      where.OR = [
        {
          title: {
            contains: query,
          },
        },
        {
          description: {
            contains: query,
          },
        },
      ];
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: this.getOrderBy(sortBy, sortOrder),
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
          enrollments: true,
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    const results: SearchResult<Course>[] = courses.map(course => ({
      item: course,
      score: this.calculateRelevanceScore(course, searchTerms),
      highlights: includeHighlights ? this.generateHighlights(course, searchTerms) : [],
      type: 'course',
    }));

    return {
      results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      query,
      filters,
    };
  }

  /**
   * Search modules
   * @param query - Search query
   * @param organizationId - Organization ID
   * @param filters - Search filters
   * @param options - Search options
   * @returns Module search results
   */
  async searchModules(
    query: string,
    organizationId: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResponse<Module>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'relevance',
      sortOrder = 'desc',
      includeHighlights = true,
    } = options;

    const skip = (page - 1) * pageSize;
    const searchTerms = this.parseSearchQuery(query);

    const where: any = {
      course: {
        organizationId,
      },
    };

    if (searchTerms.length > 0) {
      where.OR = [
        {
          title: {
            contains: query,
          },
        },
        {
          description: {
            contains: query,
          },
        },
      ];
    }

    const [modules, total] = await Promise.all([
      this.prisma.module.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: this.getOrderBy(sortBy, sortOrder),
        include: {
          course: true,
          lessons: true,
        },
      }),
      this.prisma.module.count({ where }),
    ]);

    const results: SearchResult<Module>[] = modules.map(module => ({
      item: module,
      score: this.calculateRelevanceScore(module, searchTerms),
      highlights: includeHighlights ? this.generateHighlights(module, searchTerms) : [],
      type: 'module',
    }));

    return {
      results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      query,
      filters,
    };
  }

  /**
   * Search lessons
   * @param query - Search query
   * @param organizationId - Organization ID
   * @param filters - Search filters
   * @param options - Search options
   * @returns Lesson search results
   */
  async searchLessons(
    query: string,
    organizationId: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResponse<Lesson>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'relevance',
      sortOrder = 'desc',
      includeHighlights = true,
    } = options;

    const skip = (page - 1) * pageSize;
    const searchTerms = this.parseSearchQuery(query);

    const where: any = {
      module: {
        course: {
          organizationId,
        },
      },
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (searchTerms.length > 0) {
      where.OR = [
        {
          title: {
            contains: query,
          },
        },
        {
          content: {
            contains: query,
          },
        },
      ];
    }

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: this.getOrderBy(sortBy, sortOrder),
        include: {
          module: {
            include: {
              course: true,
            },
          },
          quiz: true,
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    const results: SearchResult<Lesson>[] = lessons.map(lesson => ({
      item: lesson,
      score: this.calculateRelevanceScore(lesson, searchTerms),
      highlights: includeHighlights ? this.generateHighlights(lesson, searchTerms) : [],
      type: 'lesson',
    }));

    return {
      results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      query,
      filters,
    };
  }

  /**
   * Search quizzes
   * @param query - Search query
   * @param organizationId - Organization ID
   * @param filters - Search filters
   * @param options - Search options
   * @returns Quiz search results
   */
  async searchQuizzes(
    query: string,
    organizationId: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResponse<Quiz>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'relevance',
      sortOrder = 'desc',
      includeHighlights = true,
    } = options;

    const skip = (page - 1) * pageSize;
    const searchTerms = this.parseSearchQuery(query);

    const where: any = {
      lesson: {
        module: {
          course: {
            organizationId,
          },
        },
      },
    };

    if (searchTerms.length > 0) {
      where.OR = [
        {
          title: {
            contains: query,
          },
        },
        {
          description: {
            contains: query,
          },
        },
      ];
    }

    const [quizzes, total] = await Promise.all([
      this.prisma.quiz.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: this.getOrderBy(sortBy, sortOrder),
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: true,
                },
              },
            },
          },
          questions: true,
        },
      }),
      this.prisma.quiz.count({ where }),
    ]);

    const results: SearchResult<Quiz>[] = quizzes.map(quiz => ({
      item: quiz,
      score: this.calculateRelevanceScore(quiz, searchTerms),
      highlights: includeHighlights ? this.generateHighlights(quiz, searchTerms) : [],
      type: 'quiz',
    }));

    return {
      results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      query,
      filters,
    };
  }

  /**
   * Search questions
   * @param query - Search query
   * @param organizationId - Organization ID
   * @param filters - Search filters
   * @param options - Search options
   * @returns Question search results
   */
  async searchQuestions(
    query: string,
    organizationId: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResponse<Question>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'relevance',
      sortOrder = 'desc',
      includeHighlights = true,
    } = options;

    const skip = (page - 1) * pageSize;
    const searchTerms = this.parseSearchQuery(query);

    const where: any = {
      quiz: {
        lesson: {
          module: {
            course: {
              organizationId,
            },
          },
        },
      },
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (searchTerms.length > 0) {
      where.OR = [
        {
          text: {
            contains: query,
          },
        },
        {
          explanation: {
            contains: query,
          },
        },
      ];
    }

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: this.getOrderBy(sortBy, sortOrder),
        include: {
          quiz: {
            include: {
              lesson: {
                include: {
                  module: {
                    include: {
                      course: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.question.count({ where }),
    ]);

    const results: SearchResult<Question>[] = questions.map(question => ({
      item: question,
      score: this.calculateRelevanceScore(question, searchTerms),
      highlights: includeHighlights ? this.generateHighlights(question, searchTerms) : [],
      type: 'question',
    }));

    return {
      results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      query,
      filters,
    };
  }

  /**
   * Search users
   * @param query - Search query
   * @param organizationId - Organization ID
   * @param filters - Search filters
   * @param options - Search options
   * @returns User search results
   */
  async searchUsers(
    query: string,
    organizationId: string,
    filters: SearchFilters = {},
    options: SearchOptions = {}
  ): Promise<SearchResponse<User>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'relevance',
      sortOrder = 'desc',
      includeHighlights = true,
    } = options;

    const skip = (page - 1) * pageSize;
    const searchTerms = this.parseSearchQuery(query);

    const where: any = {
      organizationId,
    };

    if (filters.status) {
      where.role = filters.status;
    }

    if (searchTerms.length > 0) {
      where.OR = [
        {
          name: {
            contains: query,
          },
        },
        {
          email: {
            contains: query,
          },
        },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: this.getOrderBy(sortBy, sortOrder),
        include: {
          enrollments: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const results: SearchResult<User>[] = users.map(user => ({
      item: user,
      score: this.calculateRelevanceScore(user, searchTerms),
      highlights: includeHighlights ? this.generateHighlights(user, searchTerms) : [],
      type: 'user',
    }));

    return {
      results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      query,
      filters,
    };
  }

  /**
   * Get search suggestions
   * @param query - Partial search query
   * @param organizationId - Organization ID
   * @returns Search suggestions
   */
  async getSuggestions(query: string, organizationId: string): Promise<string[]> {
    if (query.length < 2) return [];

    const suggestions: string[] = [];

    // Get course title suggestions
    const courseTitles = await this.prisma.course.findMany({
      where: {
        organizationId,
        title: {
          contains: query,
        },
      },
      select: { title: true },
      take: 5,
    });

    suggestions.push(...courseTitles.map(c => c.title));

    // Get lesson title suggestions
    const lessonTitles = await this.prisma.lesson.findMany({
      where: {
        module: {
          course: {
            organizationId,
          },
        },
        title: {
          contains: query,
        },
      },
      select: { title: true },
      take: 5,
    });

    suggestions.push(...lessonTitles.map(l => l.title));

    // Get suggestions from course titles
    const courses = await this.prisma.course.findMany({
      where: {
        organizationId,
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
      select: { title: true },
      take: 10,
    });

    const titles = courses.map(c => c.title);
    suggestions.push(...titles.filter(title => title.toLowerCase().includes(query.toLowerCase())));

    return [...new Set(suggestions)].slice(0, 10);
  }

  /**
   * Parse search query into terms
   * @param query - Search query
   * @returns Array of search terms
   */
  private parseSearchQuery(query: string): string[] {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 0);
  }

  /**
   * Calculate relevance score for a result
   * @param item - Item to score
   * @param searchTerms - Search terms
   * @returns Relevance score
   */
  private calculateRelevanceScore(item: any, searchTerms: string[]): number {
    let score = 0;
    const text = JSON.stringify(item).toLowerCase();

    for (const term of searchTerms) {
      const matches = (text.match(new RegExp(term, 'g')) || []).length;
      score += matches;
    }

    // Boost score for title matches
    if (item.title) {
      const titleMatches = (item.title.toLowerCase().match(new RegExp(searchTerms.join('|'), 'g')) || []).length;
      score += titleMatches * 2;
    }

    return score;
  }

  /**
   * Generate highlights for search results
   * @param item - Item to highlight
   * @param searchTerms - Search terms
   * @returns Array of highlighted text snippets
   */
  private generateHighlights(item: any, searchTerms: string[]): string[] {
    const highlights: string[] = [];
    const text = JSON.stringify(item);

    for (const term of searchTerms) {
      const regex = new RegExp(`(.{0,50})${term}(.{0,50})`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        highlights.push(...matches.slice(0, 3)); // Limit to 3 highlights per term
      }
    }

    return [...new Set(highlights)].slice(0, 5); // Limit to 5 total highlights
  }

  /**
   * Get order by clause for sorting
   * @param sortBy - Sort field
   * @param sortOrder - Sort order
   * @returns Order by clause
   */
  private getOrderBy(sortBy: string, sortOrder: string): any {
    const orderBy: any = {};

    switch (sortBy) {
      case 'date':
        orderBy.createdAt = sortOrder;
        break;
      case 'title':
        orderBy.title = sortOrder;
        break;
      case 'popularity':
        // This would need to be calculated based on enrollments/views
        orderBy.createdAt = sortOrder;
        break;
      default:
        orderBy.createdAt = sortOrder;
    }

    return orderBy;
  }

  /**
   * Generate search suggestions
   * @param query - Search query
   * @param organizationId - Organization ID
   * @returns Search suggestions
   */
  private async generateSuggestions(query: string, organizationId: string): Promise<string[]> {
    return this.getSuggestions(query, organizationId);
  }
}
