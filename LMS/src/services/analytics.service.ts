import { PrismaClient } from '@/generated/prisma';
import { cacheService, CacheKeyGenerator } from './caching.service';

/**
 * Analytics data interfaces
 */
interface AnalyticsData {
  total: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

interface DashboardData {
  overview: {
    totalUsers: AnalyticsData;
    totalCourses: AnalyticsData;
    totalEnrollments: AnalyticsData;
    completionRate: AnalyticsData;
  };
  charts: {
    userGrowth: TimeSeriesData[];
    courseEnrollments: TimeSeriesData[];
    completionRates: TimeSeriesData[];
    userActivity: TimeSeriesData[];
  };
  topContent: {
    courses: Array<{ id: string; title: string; enrollments: number; completionRate: number }>;
    lessons: Array<{ id: string; title: string; views: number; completionRate: number }>;
  };
  userEngagement: {
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    averageSessionTime: number;
  };
}

interface ReportData {
  title: string;
  description: string;
  data: any;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  filters: Record<string, any>;
}

/**
 * Comprehensive analytics and reporting service for dashboards
 */
export class AnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get dashboard analytics data
   * @param organizationId - Organization ID
   * @param period - Time period (7d, 30d, 90d, 1y)
   * @returns Dashboard analytics data
   */
  async getDashboardData(organizationId: string, period: string = '30d'): Promise<DashboardData> {
    const cacheKey = CacheKeyGenerator.statistics('dashboard', organizationId, { period });
    const cachedData = cacheService.get<DashboardData>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const { startDate, endDate } = this.getDateRange(period);
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);

    const [
      totalUsers,
      previousUsers,
      totalCourses,
      previousCourses,
      totalEnrollments,
      previousEnrollments,
      completionRate,
      previousCompletionRate,
      userGrowth,
      courseEnrollments,
      completionRates,
      userActivity,
      topCourses,
      topLessons,
      userEngagement,
    ] = await Promise.all([
      this.getTotalUsers(organizationId, startDate, endDate),
      this.getTotalUsers(organizationId, previousPeriod.start, previousPeriod.end),
      this.getTotalCourses(organizationId, startDate, endDate),
      this.getTotalCourses(organizationId, previousPeriod.start, previousPeriod.end),
      this.getTotalEnrollments(organizationId, startDate, endDate),
      this.getTotalEnrollments(organizationId, previousPeriod.start, previousPeriod.end),
      this.getCompletionRate(organizationId, startDate, endDate),
      this.getCompletionRate(organizationId, previousPeriod.start, previousPeriod.end),
      this.getUserGrowth(organizationId, startDate, endDate),
      this.getCourseEnrollments(organizationId, startDate, endDate),
      this.getCompletionRates(organizationId, startDate, endDate),
      this.getUserActivity(organizationId, startDate, endDate),
      this.getTopCourses(organizationId, startDate, endDate),
      this.getTopLessons(organizationId, startDate, endDate),
      this.getUserEngagement(organizationId, startDate, endDate),
    ]);

    const dashboardData: DashboardData = {
      overview: {
        totalUsers: this.calculateAnalyticsData(totalUsers, previousUsers),
        totalCourses: this.calculateAnalyticsData(totalCourses, previousCourses),
        totalEnrollments: this.calculateAnalyticsData(totalEnrollments, previousEnrollments),
        completionRate: this.calculateAnalyticsData(completionRate, previousCompletionRate),
      },
      charts: {
        userGrowth,
        courseEnrollments,
        completionRates,
        userActivity,
      },
      topContent: {
        courses: topCourses,
        lessons: topLessons,
      },
      userEngagement,
    };

    // Cache for 5 minutes
    cacheService.set(cacheKey, dashboardData, 300);

    return dashboardData;
  }

  /**
   * Get user analytics
   * @param organizationId - Organization ID
   * @param period - Time period
   * @returns User analytics data
   */
  async getUserAnalytics(organizationId: string, period: string = '30d'): Promise<{
    total: AnalyticsData;
    growth: TimeSeriesData[];
    byRole: ChartData;
    activity: TimeSeriesData[];
    engagement: {
      averageSessionTime: number;
      sessionsPerUser: number;
      retentionRate: number;
    };
  }> {
    const cacheKey = CacheKeyGenerator.statistics('user-analytics', organizationId, { period });
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) return cachedData as any;

    const { startDate, endDate } = this.getDateRange(period);
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);

    const [
      totalUsers,
      previousUsers,
      growth,
      byRole,
      activity,
      engagement,
    ] = await Promise.all([
      this.getTotalUsers(organizationId, startDate, endDate),
      this.getTotalUsers(organizationId, previousPeriod.start, previousPeriod.end),
      this.getUserGrowth(organizationId, startDate, endDate),
      this.getUsersByRole(organizationId),
      this.getUserActivity(organizationId, startDate, endDate),
      this.getUserEngagement(organizationId, startDate, endDate),
    ]);

    const data = {
      total: this.calculateAnalyticsData(totalUsers, previousUsers),
      growth,
      byRole,
      activity,
      engagement,
    };

    cacheService.set(cacheKey, data, 300);
    return data as any;
  }

  /**
   * Get course analytics
   * @param organizationId - Organization ID
   * @param period - Time period
   * @returns Course analytics data
   */
  async getCourseAnalytics(organizationId: string, period: string = '30d'): Promise<{
    total: AnalyticsData;
    enrollments: TimeSeriesData[];
    completionRates: TimeSeriesData[];
    topCourses: Array<{ id: string; title: string; enrollments: number; completionRate: number }>;
    byStatus: ChartData;
  }> {
    const cacheKey = CacheKeyGenerator.statistics('course-analytics', organizationId, { period });
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) return cachedData as any;

    const { startDate, endDate } = this.getDateRange(period);
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);

    const [
      totalCourses,
      previousCourses,
      enrollments,
      completionRates,
      topCourses,
      byStatus,
    ] = await Promise.all([
      this.getTotalCourses(organizationId, startDate, endDate),
      this.getTotalCourses(organizationId, previousPeriod.start, previousPeriod.end),
      this.getCourseEnrollments(organizationId, startDate, endDate),
      this.getCompletionRates(organizationId, startDate, endDate),
      this.getTopCourses(organizationId, startDate, endDate),
      this.getCoursesByStatus(organizationId),
    ]);

    const data = {
      total: this.calculateAnalyticsData(totalCourses, previousCourses),
      enrollments,
      completionRates,
      topCourses,
      byStatus,
    };

    cacheService.set(cacheKey, data, 300);
    return data;
  }

  /**
   * Get enrollment analytics
   * @param organizationId - Organization ID
   * @param period - Time period
   * @returns Enrollment analytics data
   */
  async getEnrollmentAnalytics(organizationId: string, period: string = '30d'): Promise<{
    total: AnalyticsData;
    trends: TimeSeriesData[];
    byCourse: ChartData;
    completionRates: TimeSeriesData[];
    dropoffAnalysis: Array<{ stage: string; count: number; percentage: number }>;
  }> {
    const cacheKey = CacheKeyGenerator.statistics('enrollment-analytics', organizationId, { period });
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) return cachedData as any;

    const { startDate, endDate } = this.getDateRange(period);
    const previousPeriod = this.getPreviousPeriod(startDate, endDate);

    const [
      totalEnrollments,
      previousEnrollments,
      trends,
      byCourse,
      completionRates,
      dropoffAnalysis,
    ] = await Promise.all([
      this.getTotalEnrollments(organizationId, startDate, endDate),
      this.getTotalEnrollments(organizationId, previousPeriod.start, previousPeriod.end),
      this.getEnrollmentTrends(organizationId, startDate, endDate),
      this.getEnrollmentsByCourse(organizationId),
      this.getCompletionRates(organizationId, startDate, endDate),
      this.getDropoffAnalysis(organizationId, startDate, endDate),
    ]);

    const data = {
      total: this.calculateAnalyticsData(totalEnrollments, previousEnrollments),
      trends,
      byCourse,
      completionRates,
      dropoffAnalysis,
    };

    cacheService.set(cacheKey, data, 300);
    return data;
  }

  /**
   * Generate custom report
   * @param organizationId - Organization ID
   * @param reportType - Type of report
   * @param filters - Report filters
   * @param period - Time period
   * @returns Generated report
   */
  async generateReport(
    organizationId: string,
    reportType: string,
    filters: Record<string, any> = {},
    period: string = '30d'
  ): Promise<ReportData> {
    const { startDate, endDate } = this.getDateRange(period);
    let data: any;

    switch (reportType) {
      case 'user-summary':
        data = await this.generateUserSummaryReport(organizationId, startDate, endDate, filters);
        break;
      case 'course-performance':
        data = await this.generateCoursePerformanceReport(organizationId, startDate, endDate, filters);
        break;
      case 'enrollment-analysis':
        data = await this.generateEnrollmentAnalysisReport(organizationId, startDate, endDate, filters);
        break;
      case 'completion-report':
        data = await this.generateCompletionReport(organizationId, startDate, endDate, filters);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    return {
      title: this.getReportTitle(reportType),
      description: this.getReportDescription(reportType),
      data,
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      filters,
    };
  }

  /**
   * Get total users count
   */
  private async getTotalUsers(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.user.count({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Get total courses count
   */
  private async getTotalCourses(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.course.count({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Get total enrollments count
   */
  private async getTotalEnrollments(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.enrollment.count({
      where: {
        organizationId,
        enrolledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Get completion rate
   */
  private async getCompletionRate(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    const totalEnrollments = await this.prisma.enrollment.count({
      where: {
        organizationId,
        enrolledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const completedEnrollments = await this.prisma.enrollment.count({
      where: {
        organizationId,
        status: 'COMPLETED',
        enrolledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;
  }

  /**
   * Get user growth over time
   */
  private async getUserGrowth(organizationId: string, startDate: Date, endDate: Date): Promise<TimeSeriesData[]> {
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return this.groupByDate(users, 'createdAt');
  }

  /**
   * Get course enrollments over time
   */
  private async getCourseEnrollments(organizationId: string, startDate: Date, endDate: Date): Promise<TimeSeriesData[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        organizationId,
        enrolledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        enrolledAt: true,
      },
      orderBy: {
        enrolledAt: 'asc',
      },
    });

    return this.groupByDate(enrollments, 'enrolledAt');
  }

  /**
   * Get completion rates over time
   */
  private async getCompletionRates(organizationId: string, startDate: Date, endDate: Date): Promise<TimeSeriesData[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        organizationId,
        enrolledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        enrolledAt: true,
        status: true,
      },
      orderBy: {
        enrolledAt: 'asc',
      },
    });

    return this.calculateCompletionRatesByDate(enrollments);
  }

  /**
   * Get user activity over time
   */
  private async getUserActivity(organizationId: string, startDate: Date, endDate: Date): Promise<TimeSeriesData[]> {
    // This would typically come from audit logs or session data
    // For now, we'll use a simplified approach
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'asc',
      },
    });

    return this.groupByDate(users, 'updatedAt');
  }

  /**
   * Get top courses by enrollments
   */
  private async getTopCourses(organizationId: string, startDate: Date, endDate: Date): Promise<Array<{ id: string; title: string; enrollments: number; completionRate: number }>> {
    const courses = await this.prisma.course.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        enrollments: true,
      },
      orderBy: {
        enrollments: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return courses.map((course: any) => ({
      id: course.id,
      title: course.title,
      enrollments: course.enrollments.length,
      completionRate: this.calculateCourseCompletionRate(course.enrollments),
    }));
  }

  /**
   * Get top lessons by views/completions
   */
  private async getTopLessons(organizationId: string, startDate: Date, endDate: Date): Promise<Array<{ id: string; title: string; views: number; completionRate: number }>> {
    const lessons = await this.prisma.lesson.findMany({
      where: {
        module: {
          course: {
            organizationId,
          },
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        progress: true,
      },
      orderBy: {
        progress: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return lessons.map((lesson: any) => ({
      id: lesson.id,
      title: lesson.title,
      views: lesson.progress.length,
      completionRate: this.calculateLessonCompletionRate(lesson.progress),
    }));
  }

  /**
   * Get user engagement metrics
   */
  private async getUserEngagement(organizationId: string, startDate: Date, endDate: Date): Promise<{
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    averageSessionTime: number;
  }> {
    const totalUsers = await this.prisma.user.count({
      where: { organizationId },
    });

    const newUsers = await this.prisma.user.count({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const activeUsers = await this.prisma.user.count({
      where: {
        organizationId,
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      activeUsers,
      newUsers,
      returningUsers: activeUsers - newUsers,
      averageSessionTime: 30, // Mock data - would come from session tracking
    };
  }

  /**
   * Get users by role
   */
  private async getUsersByRole(organizationId: string): Promise<ChartData> {
    const users = await this.prisma.user.groupBy({
      by: ['role'],
      where: { organizationId },
      _count: { role: true },
    });

    return {
      labels: users.map((u: any) => u.role),
      datasets: [{
        label: 'Users',
        data: users.map((u: any) => u._count.role),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      }],
    };
  }

  /**
   * Get courses by status
   */
  private async getCoursesByStatus(organizationId: string): Promise<ChartData> {
    const courses = await this.prisma.course.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { status: true },
    });

    return {
      labels: courses.map((c: any) => c.status),
      datasets: [{
        label: 'Courses',
        data: courses.map((c: any) => c._count.status),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      }],
    };
  }

  /**
   * Get enrollments by course
   */
  private async getEnrollmentsByCourse(organizationId: string): Promise<ChartData> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { organizationId },
      include: {
        course: true,
      },
    });

    const courseEnrollments = enrollments.reduce((acc: any, enrollment: any) => {
      const courseTitle = enrollment.course.title;
      acc[courseTitle] = (acc[courseTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(courseEnrollments),
      datasets: [{
        label: 'Enrollments',
        data: Object.values(courseEnrollments),
        backgroundColor: ['#36A2EB'],
      }],
    };
  }

  /**
   * Get enrollment trends
   */
  private async getEnrollmentTrends(organizationId: string, startDate: Date, endDate: Date): Promise<TimeSeriesData[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        organizationId,
        enrolledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        enrolledAt: true,
      },
      orderBy: {
        enrolledAt: 'asc',
      },
    });

    return this.groupByDate(enrollments, 'enrolledAt');
  }

  /**
   * Get dropoff analysis
   */
  private async getDropoffAnalysis(organizationId: string, startDate: Date, endDate: Date): Promise<Array<{ stage: string; count: number; percentage: number }>> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        organizationId,
        enrolledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        status: true,
      },
    });

    const total = enrollments.length;
    const stages = [
      { stage: 'Enrolled', status: 'ACTIVE' },
      { stage: 'In Progress', status: 'ACTIVE' },
      { stage: 'Completed', status: 'COMPLETED' },
      { stage: 'Dropped', status: 'DROPPED' },
    ];

    return stages.map((stage: any) => {
      const count = enrollments.filter((e: any) => e.status === stage.status).length;
      return {
        stage: stage.stage,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });
  }

  /**
   * Generate user summary report
   */
  private async generateUserSummaryReport(organizationId: string, startDate: Date, endDate: Date, filters: Record<string, any>): Promise<any> {
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...filters,
      },
      include: {
        enrollments: true,
        progress: true,
      },
    });

    return {
      totalUsers: users.length,
      usersByRole: this.getUsersByRole(organizationId),
      userGrowth: this.getUserGrowth(organizationId, startDate, endDate),
      averageEnrollmentsPerUser: users.reduce((sum: number, user: any) => sum + user.enrollments.length, 0) / users.length,
    };
  }

  /**
   * Generate course performance report
   */
  private async generateCoursePerformanceReport(organizationId: string, startDate: Date, endDate: Date, filters: Record<string, any>): Promise<any> {
    const courses = await this.prisma.course.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...filters,
      },
      include: {
        enrollments: true,
        modules: {
          include: {
            lessons: {
              include: {
                progress: true,
              },
            },
          },
        },
      },
    });

    return {
      totalCourses: courses.length,
      coursesByStatus: this.getCoursesByStatus(organizationId),
      topCourses: this.getTopCourses(organizationId, startDate, endDate),
      averageCompletionRate: courses.reduce((sum: number, course: any) => sum + this.calculateCourseCompletionRate(course.enrollments), 0) / courses.length,
    };
  }

  /**
   * Generate enrollment analysis report
   */
  private async generateEnrollmentAnalysisReport(organizationId: string, startDate: Date, endDate: Date, filters: Record<string, any>): Promise<any> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        organizationId,
        enrolledAt: {
          gte: startDate,
          lte: endDate,
        },
        ...filters,
      },
      include: {
        course: true,
        user: true,
      },
    });

    return {
      totalEnrollments: enrollments.length,
      enrollmentsByCourse: this.getEnrollmentsByCourse(organizationId),
      enrollmentTrends: this.getEnrollmentTrends(organizationId, startDate, endDate),
      dropoffAnalysis: this.getDropoffAnalysis(organizationId, startDate, endDate),
    };
  }

  /**
   * Generate completion report
   */
  private async generateCompletionReport(organizationId: string, startDate: Date, endDate: Date, filters: Record<string, any>): Promise<any> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        organizationId,
        enrolledAt: {
          gte: startDate,
          lte: endDate,
        },
        ...filters,
      },
      include: {
        course: true,
        user: true,
      },
    });

    const completedEnrollments = enrollments.filter((e: any) => e.status === 'COMPLETED');
    const completionRate = enrollments.length > 0 ? (completedEnrollments.length / enrollments.length) * 100 : 0;

    return {
      totalEnrollments: enrollments.length,
      completedEnrollments: completedEnrollments.length,
      completionRate,
      completionTrends: this.getCompletionRates(organizationId, startDate, endDate),
      averageCompletionTime: this.calculateAverageCompletionTime(completedEnrollments),
    };
  }

  /**
   * Calculate analytics data with change metrics
   */
  private calculateAnalyticsData(current: number, previous: number): AnalyticsData {
    const change = current - previous;
    const changePercentage = previous > 0 ? (change / previous) * 100 : 0;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return {
      total: current,
      change,
      changePercentage,
      trend,
      period: '30d',
    };
  }

  /**
   * Group data by date
   */
  private groupByDate(data: Array<{ [key: string]: any }>, dateField: string): TimeSeriesData[] {
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item[dateField]).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, value]) => ({
      date,
      value,
    }));
  }

  /**
   * Calculate completion rates by date
   */
  private calculateCompletionRatesByDate(enrollments: Array<{ enrolledAt: Date; status: string }>): TimeSeriesData[] {
    const grouped = enrollments.reduce((acc, enrollment) => {
      const date = new Date(enrollment.enrolledAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, completed: 0 };
      }
      acc[date].total++;
      if (enrollment.status === 'COMPLETED') {
        acc[date].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return Object.entries(grouped).map(([date, data]) => ({
      date,
      value: data.total > 0 ? (data.completed / data.total) * 100 : 0,
    }));
  }

  /**
   * Calculate course completion rate
   */
  private calculateCourseCompletionRate(enrollments: Array<{ status: string }>): number {
    if (enrollments.length === 0) return 0;
    const completed = enrollments.filter(e => e.status === 'COMPLETED').length;
    return (completed / enrollments.length) * 100;
  }

  /**
   * Calculate lesson completion rate
   */
  private calculateLessonCompletionRate(progress: Array<{ status: string }>): number {
    if (progress.length === 0) return 0;
    const completed = progress.filter(p => p.status === 'COMPLETED').length;
    return (completed / progress.length) * 100;
  }

  /**
   * Calculate average completion time
   */
  private calculateAverageCompletionTime(enrollments: Array<{ enrolledAt: Date; completedAt?: Date }>): number {
    if (enrollments.length === 0) return 0;
    const totalTime = enrollments.reduce((sum, enrollment) => {
      if (enrollment.completedAt) {
        const timeDiff = enrollment.completedAt.getTime() - enrollment.enrolledAt.getTime();
        return sum + timeDiff;
      }
      return sum;
    }, 0);
    return totalTime / enrollments.length;
  }

  /**
   * Get date range for period
   */
  private getDateRange(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  /**
   * Get previous period for comparison
   */
  private getPreviousPeriod(startDate: Date, endDate: Date): { start: Date; end: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    return {
      start: new Date(startDate.getTime() - duration),
      end: startDate,
    };
  }

  /**
   * Get report title
   */
  private getReportTitle(reportType: string): string {
    const titles: Record<string, string> = {
      'user-summary': 'User Summary Report',
      'course-performance': 'Course Performance Report',
      'enrollment-analysis': 'Enrollment Analysis Report',
      'completion-report': 'Completion Report',
    };
    return titles[reportType] || 'Custom Report';
  }

  /**
   * Get report description
   */
  private getReportDescription(reportType: string): string {
    const descriptions: Record<string, string> = {
      'user-summary': 'Comprehensive analysis of user metrics and engagement',
      'course-performance': 'Detailed performance metrics for courses',
      'enrollment-analysis': 'Analysis of enrollment trends and patterns',
      'completion-report': 'Completion rates and learning outcomes analysis',
    };
    return descriptions[reportType] || 'Custom analytics report';
  }
}
