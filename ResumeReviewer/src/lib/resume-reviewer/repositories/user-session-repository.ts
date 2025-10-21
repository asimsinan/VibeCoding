import { PrismaClient, UserSession } from '@prisma/client';
import { UserSessionModel, UserSessionCreateInput } from '../models/index';

export class UserSessionRepository {
  private model: UserSessionModel;

  constructor(prisma: PrismaClient) {
    this.model = new UserSessionModel(prisma);
  }

  async create(data: UserSessionCreateInput): Promise<UserSession> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<UserSession | null> {
    return this.model.findById(id);
  }

  async findBySessionId(sessionId: string): Promise<UserSession | null> {
    return this.model.findBySessionId(sessionId);
  }

  async delete(id: string): Promise<UserSession> {
    return this.model.delete(id);
  }

  async findAll(options?: { page?: number; limit?: number }): Promise<UserSession[]> {
    return this.model.findAll(options);
  }

  async update(id: string, data: Partial<UserSessionCreateInput>): Promise<UserSession> {
    return this.model.update(id, data);
  }

  async count(): Promise<number> {
    return this.model.count();
  }

  // Business logic methods
  async getOrCreate(sessionId: string): Promise<UserSession> {
    return this.model.getOrCreate(sessionId);
  }

  async getUploadCount(sessionId: string): Promise<number> {
    return this.model.getUploadCount(sessionId);
  }

  async getRecentUploads(sessionId: string, limit: number = 10): Promise<any[]> {
    return this.model.getRecentUploads(sessionId, limit);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<UserSession[]> {
    return this.model.findByDateRange(startDate, endDate);
  }
}