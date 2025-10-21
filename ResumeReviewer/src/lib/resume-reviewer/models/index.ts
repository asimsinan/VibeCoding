import { PrismaClient, ResumeUpload, Feedback, UserSession, HealthLog } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
export const ResumeUploadCreateSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024), // 10MB max
  fileType: z.enum(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  fileUrl: z.string().url().optional(),
  sessionId: z.string().uuid().optional(),
});

export const ResumeUploadUpdateSchema = z.object({
  fileName: z.string().min(1).max(255).optional(),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024).optional(),
  fileType: z.enum(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']).optional(),
  fileUrl: z.string().url().optional(),
  status: z.enum(['PROCESSING', 'COMPLETED', 'ERROR', 'DELETED']).optional(),
  sessionId: z.string().uuid().optional(),
});

export const FeedbackCreateSchema = z.object({
  uploadId: z.string().uuid(),
  overallScore: z.number().int().min(0).max(100),
  contentScore: z.number().int().min(0).max(100),
  formattingScore: z.number().int().min(0).max(100),
  keywordScore: z.number().int().min(0).max(100),
  suggestions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    evidence: z.string(),
    example: z.string(),
    impact: z.enum(['low', 'medium', 'high'])
  })),
  strengths: z.array(z.object({
    id: z.string(),
    text: z.string(),
    evidence: z.string(),
    category: z.enum(['leadership', 'technical', 'communication', 'achievement'])
  })),
  improvements: z.array(z.object({
    id: z.string(),
    text: z.string(),
    evidence: z.string(),
    example: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical'])
  })),
  analysis: z.any().optional(),
});

export const FeedbackUpdateSchema = z.object({
  overallScore: z.number().int().min(0).max(100).optional(),
  contentScore: z.number().int().min(0).max(100).optional(),
  formattingScore: z.number().int().min(0).max(100).optional(),
  keywordScore: z.number().int().min(0).max(100).optional(),
  suggestions: z.string().optional(),
  strengths: z.string().optional(),
  improvements: z.string().optional(),
  analysis: z.string().optional(),
});

export const UserSessionCreateSchema = z.object({
  sessionId: z.string().uuid().min(1).max(255),
});

export const HealthLogCreateSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  services: z.record(z.enum(['healthy', 'degraded', 'unhealthy'])).refine(
    (services) => Object.keys(services).length > 0,
    { message: "At least one service must be specified" }
  ),
  uptime: z.number().int().min(0),
});

// Type definitions
export type ResumeUploadCreateInput = z.infer<typeof ResumeUploadCreateSchema>;
export type ResumeUploadUpdateInput = z.infer<typeof ResumeUploadUpdateSchema>;
export type FeedbackCreateInput = z.infer<typeof FeedbackCreateSchema>;
export type FeedbackUpdateInput = z.infer<typeof FeedbackUpdateSchema>;
export type UserSessionCreateInput = z.infer<typeof UserSessionCreateSchema>;
export type HealthLogCreateInput = z.infer<typeof HealthLogCreateSchema>;

// Resume Upload Model Class
export class ResumeUploadModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: ResumeUploadCreateInput): Promise<ResumeUpload> {
    const validatedData = ResumeUploadCreateSchema.parse(data);
    
    // If sessionId is provided, ensure the session exists
    if (validatedData.sessionId) {
      const session = await this.prisma.userSession.findUnique({
        where: { sessionId: validatedData.sessionId },
      });
      if (!session) {
        // Create the session if it doesn't exist
        await this.prisma.userSession.create({
          data: { sessionId: validatedData.sessionId },
        });
      }
    }
    
    return this.prisma.resumeUpload.create({
      data: validatedData,
    });
  }

  async findById(id: string): Promise<ResumeUpload | null> {
    return this.prisma.resumeUpload.findUnique({
      where: { id },
      include: { feedback: true, session: true },
    });
  }

  async findBySessionId(sessionId: string): Promise<ResumeUpload[]> {
    return this.prisma.resumeUpload.findMany({
      where: { sessionId },
      include: { feedback: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: ResumeUploadUpdateInput): Promise<ResumeUpload> {
    const validatedData = ResumeUploadUpdateSchema.parse(data);
    
    // Add a small delay to ensure updatedAt is different
    await new Promise(resolve => setTimeout(resolve, 1));
    
    return this.prisma.resumeUpload.update({
      where: { id },
      data: validatedData,
      include: { feedback: true, session: true },
    });
  }

  async delete(id: string): Promise<ResumeUpload> {
    return this.prisma.resumeUpload.delete({
      where: { id },
    });
  }

  async findAll(options?: { page?: number; limit?: number }): Promise<ResumeUpload[]> {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const offset = (page - 1) * limit;
    
    return this.prisma.resumeUpload.findMany({
      take: limit,
      skip: offset,
      include: { feedback: true, session: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: string): Promise<ResumeUpload[]> {
    return this.prisma.resumeUpload.findMany({
      where: { status },
      include: { feedback: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(): Promise<number> {
    return this.prisma.resumeUpload.count();
  }

  async countByStatus(status: string): Promise<number> {
    return this.prisma.resumeUpload.count({
      where: { status },
    });
  }

  // Business logic methods
  async markAsCompleted(id: string, fileUrl?: string): Promise<ResumeUpload> {
    return this.update(id, {
      status: 'COMPLETED',
      fileUrl,
    });
  }

  async markAsError(id: string): Promise<ResumeUpload> {
    return this.update(id, {
      status: 'ERROR',
    });
  }

  async markAsDeleted(id: string): Promise<ResumeUpload> {
    return this.update(id, {
      status: 'DELETED',
    });
  }

  async getProcessingUploads(): Promise<ResumeUpload[]> {
    return this.findByStatus('PROCESSING');
  }

  async getCompletedUploads(): Promise<ResumeUpload[]> {
    return this.findByStatus('COMPLETED');
  }

  async getErrorUploads(): Promise<ResumeUpload[]> {
    return this.findByStatus('ERROR');
  }
}

// Feedback Model Class
export class FeedbackModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: FeedbackCreateInput): Promise<Feedback> {
    const validatedData = FeedbackCreateSchema.parse(data);
    return this.prisma.feedback.create({
      data: {
        ...validatedData,
        suggestions: JSON.stringify(validatedData.suggestions),
        strengths: JSON.stringify(validatedData.strengths),
        improvements: JSON.stringify(validatedData.improvements),
        analysis: validatedData.analysis ? JSON.stringify(validatedData.analysis) : null,
      },
      include: { upload: true },
    });
  }

  async findById(id: string): Promise<Feedback | null> {
    return this.prisma.feedback.findUnique({
      where: { id },
      include: { upload: true },
    });
  }

  async findByUploadId(uploadId: string): Promise<Feedback | null> {
    const feedback = await this.prisma.feedback.findUnique({
      where: { uploadId },
      include: { upload: true },
    });
    
    if (!feedback) return null;
    
    return {
      ...feedback,
      suggestions: JSON.parse(feedback.suggestions),
      strengths: JSON.parse(feedback.strengths),
      improvements: JSON.parse(feedback.improvements),
      analysis: feedback.analysis ? JSON.parse(feedback.analysis) : undefined,
    };
  }

  async deleteByUploadId(uploadId: string): Promise<Feedback | null> {
    const feedback = await this.prisma.feedback.findUnique({
      where: { uploadId },
    });
    
    if (!feedback) return null;
    
    await this.prisma.feedback.delete({
      where: { uploadId },
    });
    
    return feedback;
  }

  async update(id: string, data: FeedbackUpdateInput): Promise<Feedback> {
    const validatedData = FeedbackUpdateSchema.parse(data);
    return this.prisma.feedback.update({
      where: { id },
      data: validatedData,
      include: { upload: true },
    });
  }

  async delete(id: string): Promise<Feedback> {
    return this.prisma.feedback.delete({
      where: { id },
    });
  }

  async findAll(options?: { page?: number; limit?: number; minScore?: number; maxScore?: number }): Promise<Feedback[]> {
    const page = options?.page || 1;
    const limit = options?.limit || 100;
    const offset = (page - 1) * limit;
    
    const where: any = {};
    if (options?.minScore !== undefined) {
      where.overallScore = { ...where.overallScore, gte: options.minScore };
    }
    if (options?.maxScore !== undefined) {
      where.overallScore = { ...where.overallScore, lte: options.maxScore };
    }
    
    return this.prisma.feedback.findMany({
      take: limit,
      skip: offset,
      where,
      include: { upload: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(): Promise<number> {
    return this.prisma.feedback.count();
  }

  async getAverageScore(): Promise<number> {
    const result = await this.prisma.feedback.aggregate({
      _avg: {
        overallScore: true,
      },
    });
    return result._avg.overallScore || 0;
  }

  async getScoreDistribution(): Promise<{ score: number; count: number }[]> {
    const feedbacks = await this.prisma.feedback.findMany({
      select: { overallScore: true },
    });

    const distribution: { [key: number]: number } = {};
    feedbacks.forEach(feedback => {
      const score = Math.floor(feedback.overallScore / 10) * 10; // Group by 10s
      distribution[score] = (distribution[score] || 0) + 1;
    });

    return Object.entries(distribution).map(([score, count]) => ({
      score: parseInt(score),
      count,
    }));
  }

  // Business logic methods
  async getHighScoreFeedbacks(minScore: number = 80): Promise<Feedback[]> {
    return this.prisma.feedback.findMany({
      where: {
        overallScore: {
          gte: minScore,
        },
      },
      include: { upload: true },
      orderBy: { overallScore: 'desc' },
    });
  }

  async getLowScoreFeedbacks(maxScore: number = 60): Promise<Feedback[]> {
    return this.prisma.feedback.findMany({
      where: {
        overallScore: {
          lte: maxScore,
        },
      },
      include: { upload: true },
      orderBy: { overallScore: 'asc' },
    });
  }

  async parseSuggestions(feedback: Feedback): Promise<string[]> {
    try {
      return JSON.parse(feedback.suggestions);
    } catch {
      return [feedback.suggestions];
    }
  }

  async parseStrengths(feedback: Feedback): Promise<string[]> {
    try {
      return JSON.parse(feedback.strengths);
    } catch {
      return [feedback.strengths];
    }
  }

  async parseImprovements(feedback: Feedback): Promise<string[]> {
    try {
      return JSON.parse(feedback.improvements);
    } catch {
      return [feedback.improvements];
    }
  }

  async parseAnalysis(feedback: Feedback): Promise<any> {
    if (!feedback.analysis) return null;
    try {
      return JSON.parse(feedback.analysis);
    } catch {
      return null;
    }
  }
}

// User Session Model Class
export class UserSessionModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: UserSessionCreateInput): Promise<UserSession> {
    const validatedData = UserSessionCreateSchema.parse(data);
    return this.prisma.userSession.create({
      data: validatedData,
      include: { uploads: true },
    });
  }

  async findById(id: string): Promise<UserSession | null> {
    return this.prisma.userSession.findUnique({
      where: { id },
      include: { uploads: { include: { feedback: true } } },
    });
  }

  async findBySessionId(sessionId: string): Promise<UserSession | null> {
    return this.prisma.userSession.findUnique({
      where: { sessionId },
      include: { uploads: { include: { feedback: true } } },
    });
  }

  async delete(id: string): Promise<UserSession> {
    return this.prisma.userSession.delete({
      where: { id },
    });
  }

  async findAll(options?: { page?: number; limit?: number }): Promise<UserSession[]> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;
    
    return this.prisma.userSession.findMany({
      skip,
      take: limit,
      include: { uploads: { include: { feedback: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<UserSessionCreateInput>): Promise<UserSession> {
    if (data.sessionId) {
      UserSessionCreateSchema.partial().parse(data);
    }
    
    // Add a small delay to ensure updatedAt is different
    await new Promise(resolve => setTimeout(resolve, 1));
    
    return this.prisma.userSession.update({
      where: { id },
      data,
      include: { uploads: { include: { feedback: true } } },
    });
  }
  
  async count(): Promise<number> {
    return this.prisma.userSession.count();
  }

  // Business logic methods
  async getOrCreate(sessionId: string): Promise<UserSession> {
    let session = await this.findBySessionId(sessionId);
    if (!session) {
      session = await this.create({ sessionId });
    }
    return session;
  }

  async getUploadCount(sessionId: string): Promise<number> {
    const uploads = await this.prisma.resumeUpload.count({
      where: { sessionId },
    });
    return uploads;
  }

  async getRecentUploads(sessionId: string, limit: number = 10): Promise<ResumeUpload[]> {
    return this.prisma.resumeUpload.findMany({
      where: { sessionId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<UserSession[]> {
    return this.prisma.userSession.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { uploads: { include: { feedback: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

// Health Log Model Class
export class HealthLogModel {
  constructor(private prisma: PrismaClient) {}

  async create(data: HealthLogCreateInput): Promise<HealthLog> {
    const validatedData = HealthLogCreateSchema.parse(data);
    return this.prisma.healthLog.create({
      data: {
        ...validatedData,
        services: JSON.stringify(validatedData.services),
      },
    });
  }

  async findById(id: string): Promise<HealthLog | null> {
    return this.prisma.healthLog.findUnique({
      where: { id },
    });
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<HealthLog[]> {
    return this.prisma.healthLog.findMany({
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByStatus(status: string): Promise<HealthLog[]> {
    const logs = await this.prisma.healthLog.findMany({
      where: { status },
      orderBy: { timestamp: 'desc' },
    });
    
    return logs.map(log => ({
      ...log,
      services: JSON.parse(log.services),
    }));
  }

  async findRecent(limit: number = 10): Promise<HealthLog[]> {
    const logs = await this.prisma.healthLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
    });
    
    return logs.map(log => ({
      ...log,
      services: JSON.parse(log.services),
    }));
  }

  async deleteOldLogs(days: number = 90): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.prisma.healthLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });
  }

  async getLatest(): Promise<HealthLog | null> {
    return this.prisma.healthLog.findFirst({
      orderBy: { timestamp: 'desc' },
    });
  }

  async count(): Promise<number> {
    return this.prisma.healthLog.count();
  }

  async countByStatus(status: string): Promise<number> {
    return this.prisma.healthLog.count({
      where: { status },
    });
  }

  // Business logic methods
  async getSystemUptime(): Promise<number> {
    const latest = await this.getLatest();
    return latest?.uptime || 0;
  }

  async getSystemStatus(): Promise<string> {
    const latest = await this.getLatest();
    return latest?.status || 'unknown';
  }

  async parseServices(healthLog: HealthLog): Promise<any> {
    try {
      return JSON.parse(healthLog.services);
    } catch {
      return {};
    }
  }

  async getHealthTrend(hours: number = 24): Promise<HealthLog[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.prisma.healthLog.findMany({
      where: {
        timestamp: {
          gte: since,
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<HealthLog[]> {
    const logs = await this.prisma.healthLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });
    
    return logs.map(log => ({
      ...log,
      services: JSON.parse(log.services),
    }));
  }
}

// Model Factory
export class ModelFactory {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  static getResumeUploadModel(prisma?: PrismaClient): ResumeUploadModel {
    return new ResumeUploadModel(prisma || new PrismaClient());
  }

  static getFeedbackModel(prisma?: PrismaClient): FeedbackModel {
    return new FeedbackModel(prisma || new PrismaClient());
  }

  static getUserSessionModel(prisma?: PrismaClient): UserSessionModel {
    return new UserSessionModel(prisma || new PrismaClient());
  }

  static getHealthLogModel(prisma?: PrismaClient): HealthLogModel {
    return new HealthLogModel(prisma || new PrismaClient());
  }

  static getPrismaClient(): PrismaClient {
    return new PrismaClient();
  }

  getResumeUploadModel(): ResumeUploadModel {
    return new ResumeUploadModel(this.prisma);
  }

  getFeedbackModel(): FeedbackModel {
    return new FeedbackModel(this.prisma);
  }

  getUserSessionModel(): UserSessionModel {
    return new UserSessionModel(this.prisma);
  }

  getHealthLogModel(): HealthLogModel {
    return new HealthLogModel(this.prisma);
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Export default factory instance
export const modelFactory = new ModelFactory();
export default modelFactory;
