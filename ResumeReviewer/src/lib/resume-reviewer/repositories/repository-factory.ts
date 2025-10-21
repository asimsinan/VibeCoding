import { PrismaClient } from '@prisma/client';
import { ResumeUploadRepository } from './resume-upload-repository';
import { FeedbackRepository } from './feedback-repository';
import { UserSessionRepository } from './user-session-repository';
import { HealthLogRepository } from './health-log-repository';

export class RepositoryFactory {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  static getResumeUploadRepository(prisma?: PrismaClient): ResumeUploadRepository {
    return new ResumeUploadRepository(prisma || new PrismaClient());
  }

  static getFeedbackRepository(prisma?: PrismaClient): FeedbackRepository {
    return new FeedbackRepository(prisma || new PrismaClient());
  }

  static getUserSessionRepository(prisma?: PrismaClient): UserSessionRepository {
    return new UserSessionRepository(prisma || new PrismaClient());
  }

  static getHealthLogRepository(prisma?: PrismaClient): HealthLogRepository {
    return new HealthLogRepository(prisma || new PrismaClient());
  }

  static getPrismaClient(): PrismaClient {
    return new PrismaClient();
  }

  getResumeUploadRepository(): ResumeUploadRepository {
    return new ResumeUploadRepository(this.prisma);
  }

  getFeedbackRepository(): FeedbackRepository {
    return new FeedbackRepository(this.prisma);
  }

  getUserSessionRepository(): UserSessionRepository {
    return new UserSessionRepository(this.prisma);
  }

  getHealthLogRepository(): HealthLogRepository {
    return new HealthLogRepository(this.prisma);
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Export default factory instance
export const repositoryFactory = new RepositoryFactory();
export default repositoryFactory;