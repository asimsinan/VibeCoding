import { PrismaClient, ResumeUpload } from '@prisma/client';
import { ResumeUploadModel, ResumeUploadCreateInput, ResumeUploadUpdateInput } from '../models/index';

export class ResumeUploadRepository {
  private model: ResumeUploadModel;

  constructor(prisma: PrismaClient) {
    this.model = new ResumeUploadModel(prisma);
  }

  async create(data: ResumeUploadCreateInput): Promise<ResumeUpload> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<ResumeUpload | null> {
    return this.model.findById(id);
  }

  async findBySessionId(sessionId: string): Promise<ResumeUpload[]> {
    return this.model.findBySessionId(sessionId);
  }

  async update(id: string, data: ResumeUploadUpdateInput): Promise<ResumeUpload> {
    return this.model.update(id, data);
  }

  async delete(id: string): Promise<ResumeUpload> {
    return this.model.delete(id);
  }

  async findAll(options?: { page?: number; limit?: number }): Promise<ResumeUpload[]> {
    return this.model.findAll(options);
  }

  async findByStatus(status: string): Promise<ResumeUpload[]> {
    return this.model.findByStatus(status);
  }

  async count(): Promise<number> {
    return this.model.count();
  }

  async countByStatus(status: string): Promise<number> {
    return this.model.countByStatus(status);
  }

  // Business logic methods
  async markAsCompleted(id: string, fileUrl?: string): Promise<ResumeUpload> {
    return this.model.markAsCompleted(id, fileUrl);
  }

  async markAsError(id: string): Promise<ResumeUpload> {
    return this.model.markAsError(id);
  }

  async markAsDeleted(id: string): Promise<ResumeUpload> {
    return this.model.markAsDeleted(id);
  }

  async getProcessingUploads(): Promise<ResumeUpload[]> {
    return this.model.getProcessingUploads();
  }

  async getCompletedUploads(): Promise<ResumeUpload[]> {
    return this.model.getCompletedUploads();
  }

  async getErrorUploads(): Promise<ResumeUpload[]> {
    return this.model.getErrorUploads();
  }
}