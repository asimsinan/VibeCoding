import { PrismaClient, HealthLog } from '@prisma/client';
import { HealthLogModel, HealthLogCreateInput } from '../models/index';

export class HealthLogRepository {
  private model: HealthLogModel;

  constructor(prisma: PrismaClient) {
    this.model = new HealthLogModel(prisma);
  }

  async create(data: HealthLogCreateInput): Promise<HealthLog> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<HealthLog | null> {
    return this.model.findById(id);
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<HealthLog[]> {
    return this.model.findAll(limit, offset);
  }

  async findByStatus(status: string): Promise<HealthLog[]> {
    return this.model.findByStatus(status);
  }

  async findRecent(limit: number = 10): Promise<HealthLog[]> {
    return this.model.findRecent(limit);
  }

  async deleteOldLogs(days: number = 90): Promise<{ count: number }> {
    return this.model.deleteOldLogs(days);
  }

  async getLatest(): Promise<HealthLog | null> {
    return this.model.getLatest();
  }

  async count(): Promise<number> {
    return this.model.count();
  }

  async countByStatus(status: string): Promise<number> {
    return this.model.countByStatus(status);
  }

  // Business logic methods
  async getSystemUptime(): Promise<number> {
    return this.model.getSystemUptime();
  }

  async getSystemStatus(): Promise<string> {
    return this.model.getSystemStatus();
  }

  async parseServices(healthLog: HealthLog): Promise<any> {
    return this.model.parseServices(healthLog);
  }

  async getHealthTrend(hours: number = 24): Promise<HealthLog[]> {
    return this.model.getHealthTrend(hours);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<HealthLog[]> {
    return this.model.findByDateRange(startDate, endDate);
  }
}