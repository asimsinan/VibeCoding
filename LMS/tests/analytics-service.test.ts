import { AnalyticsService } from '../services/analytics.service';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    course: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    enrollment: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    lesson: {
      findMany: jest.fn(),
    },
    module: {
      findMany: jest.fn(),
    },
  })),
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
      course: {
        count: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
      enrollment: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      lesson: {
        findMany: jest.fn(),
      },
      module: {
        findMany: jest.fn(),
      },
    };
    analyticsService = new AnalyticsService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    it('should return dashboard analytics data', async () => {
      // Mock all the required data
      mockPrisma.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(90)  // previousUsers
        .mockResolvedValueOnce(50)  // totalCourses
        .mockResolvedValueOnce(45)  // previousCourses
        .mockResolvedValueOnce(200) // totalEnrollments
        .mockResolvedValueOnce(180) // previousEnrollments
        .mockResolvedValueOnce(75)  // completionRate
        .mockResolvedValueOnce(70); // previousCompletionRate

      mockPrisma.user.findMany
        .mockResolvedValueOnce([{ createdAt: new Date() }]) // userGrowth
        .mockResolvedValueOnce([{ updatedAt: new Date() }]); // userActivity

      mockPrisma.enrollment.findMany
        .mockResolvedValueOnce([{ enrolledAt: new Date() }]) // courseEnrollments
        .mockResolvedValueOnce([{ enrolledAt: new Date(), status: 'COMPLETED' }]); // completionRates

      mockPrisma.course.findMany
        .mockResolvedValueOnce([{ // topCourses
          id: 'course-1',
          title: 'Test Course',
          enrollments: [{ status: 'COMPLETED' }, { status: 'ACTIVE' }],
        }]);

      mockPrisma.lesson.findMany
        .mockResolvedValueOnce([{ // topLessons
          id: 'lesson-1',
          title: 'Test Lesson',
          progress: [{ status: 'COMPLETED' }, { status: 'IN_PROGRESS' }],
        }]);

      const result = await analyticsService.getDashboardData('org-123', '30d');

      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('charts');
      expect(result).toHaveProperty('topContent');
      expect(result).toHaveProperty('userEngagement');

      expect(result.overview.totalUsers.total).toBe(100);
      expect(result.overview.totalCourses.total).toBe(50);
      expect(result.overview.totalEnrollments.total).toBe(200);
      expect(result.overview.completionRate.total).toBe(75);
    });

    it('should calculate change metrics correctly', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100) // current
        .mockResolvedValueOnce(90)  // previous
        .mockResolvedValueOnce(50)  // totalCourses
        .mockResolvedValueOnce(45)  // previousCourses
        .mockResolvedValueOnce(200) // totalEnrollments
        .mockResolvedValueOnce(180) // previousEnrollments
        .mockResolvedValueOnce(75)  // completionRate
        .mockResolvedValueOnce(70); // previousCompletionRate

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.enrollment.findMany.mockResolvedValue([]);
      mockPrisma.course.findMany.mockResolvedValue([]);
      mockPrisma.lesson.findMany.mockResolvedValue([]);

      const result = await analyticsService.getDashboardData('org-123', '30d');

      expect(result.overview.totalUsers.change).toBe(10);
      expect(result.overview.totalUsers.changePercentage).toBeCloseTo(11.11);
      expect(result.overview.totalUsers.trend).toBe('up');
    });
  });

  describe('getUserAnalytics', () => {
    it('should return user analytics data', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(90); // previousUsers

      mockPrisma.user.findMany
        .mockResolvedValueOnce([{ createdAt: new Date() }]) // growth
        .mockResolvedValueOnce([{ updatedAt: new Date() }]); // activity

      mockPrisma.user.groupBy.mockResolvedValue([
        { role: 'STUDENT', _count: { role: 80 } },
        { role: 'INSTRUCTOR', _count: { role: 15 } },
        { role: 'ADMIN', _count: { role: 5 } },
      ]);

      const result = await analyticsService.getUserAnalytics('org-123', '30d');

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('growth');
      expect(result).toHaveProperty('byRole');
      expect(result).toHaveProperty('activity');
      expect(result).toHaveProperty('engagement');

      expect(result.total.total).toBe(100);
      expect(result.byRole.labels).toContain('STUDENT');
      expect(result.byRole.labels).toContain('INSTRUCTOR');
      expect(result.byRole.labels).toContain('ADMIN');
    });
  });

  describe('getCourseAnalytics', () => {
    it('should return course analytics data', async () => {
      mockPrisma.course.count
        .mockResolvedValueOnce(50) // totalCourses
        .mockResolvedValueOnce(45); // previousCourses

      mockPrisma.enrollment.findMany
        .mockResolvedValueOnce([{ enrolledAt: new Date() }]) // enrollments
        .mockResolvedValueOnce([{ enrolledAt: new Date(), status: 'COMPLETED' }]); // completionRates

      mockPrisma.course.findMany
        .mockResolvedValueOnce([{ // topCourses
          id: 'course-1',
          title: 'Test Course',
          enrollments: [{ status: 'COMPLETED' }, { status: 'ACTIVE' }],
        }]);

      mockPrisma.course.groupBy.mockResolvedValue([
        { status: 'PUBLISHED', _count: { status: 30 } },
        { status: 'DRAFT', _count: { status: 20 } },
      ]);

      const result = await analyticsService.getCourseAnalytics('org-123', '30d');

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('enrollments');
      expect(result).toHaveProperty('completionRates');
      expect(result).toHaveProperty('topCourses');
      expect(result).toHaveProperty('byStatus');

      expect(result.total.total).toBe(50);
      expect(result.byStatus.labels).toContain('PUBLISHED');
      expect(result.byStatus.labels).toContain('DRAFT');
    });
  });

  describe('getEnrollmentAnalytics', () => {
    it('should return enrollment analytics data', async () => {
      mockPrisma.enrollment.count
        .mockResolvedValueOnce(200) // totalEnrollments
        .mockResolvedValueOnce(180); // previousEnrollments

      mockPrisma.enrollment.findMany
        .mockResolvedValueOnce([{ enrolledAt: new Date() }]) // trends
        .mockResolvedValueOnce([{ enrolledAt: new Date(), status: 'COMPLETED' }]) // completionRates
        .mockResolvedValueOnce([{ status: 'ACTIVE' }, { status: 'COMPLETED' }, { status: 'DROPPED' }]); // dropoffAnalysis

      const result = await analyticsService.getEnrollmentAnalytics('org-123', '30d');

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('byCourse');
      expect(result).toHaveProperty('completionRates');
      expect(result).toHaveProperty('dropoffAnalysis');

      expect(result.total.total).toBe(200);
      expect(result.dropoffAnalysis).toHaveLength(4); // Enrolled, In Progress, Completed, Dropped
    });
  });

  describe('generateReport', () => {
    it('should generate user summary report', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          name: 'Test User',
          enrollments: [{ id: 'enrollment-1' }],
          progress: [{ id: 'progress-1' }],
        },
      ]);

      mockPrisma.user.groupBy.mockResolvedValue([
        { role: 'STUDENT', _count: { role: 80 } },
      ]);

      const result = await analyticsService.generateReport(
        'org-123',
        'user-summary',
        {},
        '30d'
      );

      expect(result.title).toBe('User Summary Report');
      expect(result.description).toBe('Comprehensive analysis of user metrics and engagement');
      expect(result.data).toHaveProperty('totalUsers');
      expect(result.data).toHaveProperty('usersByRole');
      expect(result.data).toHaveProperty('userGrowth');
      expect(result.data).toHaveProperty('averageEnrollmentsPerUser');
    });

    it('should generate course performance report', async () => {
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'course-1',
          title: 'Test Course',
          enrollments: [{ status: 'COMPLETED' }, { status: 'ACTIVE' }],
          modules: [],
        },
      ]);

      mockPrisma.course.groupBy.mockResolvedValue([
        { status: 'PUBLISHED', _count: { status: 30 } },
      ]);

      const result = await analyticsService.generateReport(
        'org-123',
        'course-performance',
        {},
        '30d'
      );

      expect(result.title).toBe('Course Performance Report');
      expect(result.description).toBe('Detailed performance metrics for courses');
      expect(result.data).toHaveProperty('totalCourses');
      expect(result.data).toHaveProperty('coursesByStatus');
      expect(result.data).toHaveProperty('topCourses');
      expect(result.data).toHaveProperty('averageCompletionRate');
    });

    it('should generate enrollment analysis report', async () => {
      mockPrisma.enrollment.findMany.mockResolvedValue([
        {
          id: 'enrollment-1',
          status: 'ACTIVE',
          course: { title: 'Test Course' },
          user: { name: 'Test User' },
        },
      ]);

      const result = await analyticsService.generateReport(
        'org-123',
        'enrollment-analysis',
        {},
        '30d'
      );

      expect(result.title).toBe('Enrollment Analysis Report');
      expect(result.description).toBe('Analysis of enrollment trends and patterns');
      expect(result.data).toHaveProperty('totalEnrollments');
      expect(result.data).toHaveProperty('enrollmentsByCourse');
      expect(result.data).toHaveProperty('enrollmentTrends');
      expect(result.data).toHaveProperty('dropoffAnalysis');
    });

    it('should generate completion report', async () => {
      mockPrisma.enrollment.findMany.mockResolvedValue([
        {
          id: 'enrollment-1',
          status: 'COMPLETED',
          enrolledAt: new Date('2024-01-01'),
          completedAt: new Date('2024-01-15'),
          course: { title: 'Test Course' },
          user: { name: 'Test User' },
        },
      ]);

      const result = await analyticsService.generateReport(
        'org-123',
        'completion-report',
        {},
        '30d'
      );

      expect(result.title).toBe('Completion Report');
      expect(result.description).toBe('Completion rates and learning outcomes analysis');
      expect(result.data).toHaveProperty('totalEnrollments');
      expect(result.data).toHaveProperty('completedEnrollments');
      expect(result.data).toHaveProperty('completionRate');
      expect(result.data).toHaveProperty('completionTrends');
      expect(result.data).toHaveProperty('averageCompletionTime');
    });

    it('should throw error for unknown report type', async () => {
      await expect(
        analyticsService.generateReport('org-123', 'unknown-report', {}, '30d')
      ).rejects.toThrow('Unknown report type: unknown-report');
    });
  });

  describe('Private Methods', () => {
    describe('calculateAnalyticsData', () => {
      it('should calculate analytics data correctly', () => {
        const service = analyticsService as any;
        const result = service.calculateAnalyticsData(100, 90);

        expect(result.total).toBe(100);
        expect(result.change).toBe(10);
        expect(result.changePercentage).toBeCloseTo(11.11);
        expect(result.trend).toBe('up');
      });

      it('should handle zero previous value', () => {
        const service = analyticsService as any;
        const result = service.calculateAnalyticsData(100, 0);

        expect(result.total).toBe(100);
        expect(result.change).toBe(100);
        expect(result.changePercentage).toBe(0);
        expect(result.trend).toBe('up');
      });

      it('should handle negative change', () => {
        const service = analyticsService as any;
        const result = service.calculateAnalyticsData(80, 100);

        expect(result.total).toBe(80);
        expect(result.change).toBe(-20);
        expect(result.changePercentage).toBe(-20);
        expect(result.trend).toBe('down');
      });

      it('should handle no change', () => {
        const service = analyticsService as any;
        const result = service.calculateAnalyticsData(100, 100);

        expect(result.total).toBe(100);
        expect(result.change).toBe(0);
        expect(result.changePercentage).toBe(0);
        expect(result.trend).toBe('stable');
      });
    });

    describe('groupByDate', () => {
      it('should group data by date', () => {
        const service = analyticsService as any;
        const data = [
          { createdAt: new Date('2024-01-01') },
          { createdAt: new Date('2024-01-01') },
          { createdAt: new Date('2024-01-02') },
        ];

        const result = service.groupByDate(data, 'createdAt');

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ date: '2024-01-01', value: 2 });
        expect(result[1]).toEqual({ date: '2024-01-02', value: 1 });
      });
    });

    describe('calculateCompletionRatesByDate', () => {
      it('should calculate completion rates by date', () => {
        const service = analyticsService as any;
        const enrollments = [
          { enrolledAt: new Date('2024-01-01'), status: 'COMPLETED' },
          { enrolledAt: new Date('2024-01-01'), status: 'ACTIVE' },
          { enrolledAt: new Date('2024-01-02'), status: 'COMPLETED' },
        ];

        const result = service.calculateCompletionRatesByDate(enrollments);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ date: '2024-01-01', value: 50 });
        expect(result[1]).toEqual({ date: '2024-01-02', value: 100 });
      });
    });

    describe('calculateCourseCompletionRate', () => {
      it('should calculate course completion rate', () => {
        const service = analyticsService as any;
        const enrollments = [
          { status: 'COMPLETED' },
          { status: 'ACTIVE' },
          { status: 'COMPLETED' },
        ];

        const result = service.calculateCourseCompletionRate(enrollments);

        expect(result).toBeCloseTo(66.67);
      });

      it('should handle empty enrollments', () => {
        const service = analyticsService as any;
        const result = service.calculateCourseCompletionRate([]);

        expect(result).toBe(0);
      });
    });

    describe('calculateLessonCompletionRate', () => {
      it('should calculate lesson completion rate', () => {
        const service = analyticsService as any;
        const progress = [
          { status: 'COMPLETED' },
          { status: 'IN_PROGRESS' },
          { status: 'COMPLETED' },
        ];

        const result = service.calculateLessonCompletionRate(progress);

        expect(result).toBeCloseTo(66.67);
      });

      it('should handle empty progress', () => {
        const service = analyticsService as any;
        const result = service.calculateLessonCompletionRate([]);

        expect(result).toBe(0);
      });
    });

    describe('getDateRange', () => {
      it('should return correct date range for 7d', () => {
        const service = analyticsService as any;
        const result = service.getDateRange('7d');

        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
        expect(result.endDate.getTime() - result.startDate.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
      });

      it('should return correct date range for 30d', () => {
        const service = analyticsService as any;
        const result = service.getDateRange('30d');

        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
        expect(result.endDate.getTime() - result.startDate.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
      });

      it('should default to 30d for unknown period', () => {
        const service = analyticsService as any;
        const result = service.getDateRange('unknown');

        expect(result.startDate).toBeInstanceOf(Date);
        expect(result.endDate).toBeInstanceOf(Date);
        expect(result.endDate.getTime() - result.startDate.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
      });
    });

    describe('getPreviousPeriod', () => {
      it('should return previous period', () => {
        const service = analyticsService as any;
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-01-31');
        const result = service.getPreviousPeriod(startDate, endDate);

        expect(result.start).toBeInstanceOf(Date);
        expect(result.end).toBeInstanceOf(Date);
        expect(result.end.getTime()).toBe(startDate.getTime());
      });
    });

    describe('getReportTitle', () => {
      it('should return correct report titles', () => {
        const service = analyticsService as any;

        expect(service.getReportTitle('user-summary')).toBe('User Summary Report');
        expect(service.getReportTitle('course-performance')).toBe('Course Performance Report');
        expect(service.getReportTitle('enrollment-analysis')).toBe('Enrollment Analysis Report');
        expect(service.getReportTitle('completion-report')).toBe('Completion Report');
        expect(service.getReportTitle('unknown')).toBe('Custom Report');
      });
    });

    describe('getReportDescription', () => {
      it('should return correct report descriptions', () => {
        const service = analyticsService as any;

        expect(service.getReportDescription('user-summary')).toBe('Comprehensive analysis of user metrics and engagement');
        expect(service.getReportDescription('course-performance')).toBe('Detailed performance metrics for courses');
        expect(service.getReportDescription('enrollment-analysis')).toBe('Analysis of enrollment trends and patterns');
        expect(service.getReportDescription('completion-report')).toBe('Completion rates and learning outcomes analysis');
        expect(service.getReportDescription('unknown')).toBe('Custom analytics report');
      });
    });
  });
});
