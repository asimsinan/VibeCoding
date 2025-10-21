import { PrismaClient, Feedback } from '@prisma/client';
import { FeedbackModel, FeedbackCreateInput, FeedbackUpdateInput } from '../models/index';

export class FeedbackRepository {
  private model: FeedbackModel;

  constructor(prisma: PrismaClient) {
    this.model = new FeedbackModel(prisma);
  }

  async create(data: FeedbackCreateInput): Promise<Feedback> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<Feedback | null> {
    return this.model.findById(id);
  }

  async findByUploadId(uploadId: string): Promise<Feedback | null> {
    return this.model.findByUploadId(uploadId);
  }

  async deleteByUploadId(uploadId: string): Promise<Feedback | null> {
    return this.model.deleteByUploadId(uploadId);
  }

  async update(id: string, data: FeedbackUpdateInput): Promise<Feedback> {
    return this.model.update(id, data);
  }

  async delete(id: string): Promise<Feedback> {
    return this.model.delete(id);
  }

  async findAll(options?: { page?: number; limit?: number; minScore?: number; maxScore?: number }): Promise<Feedback[]> {
    return this.model.findAll(options);
  }

  async count(): Promise<number> {
    return this.model.count();
  }

  async getAverageScore(): Promise<number> {
    return this.model.getAverageScore();
  }

  async getScoreDistribution(): Promise<{ score: number; count: number }[]> {
    return this.model.getScoreDistribution();
  }

  // Business logic methods
  async getHighScoreFeedbacks(minScore: number = 80): Promise<Feedback[]> {
    return this.model.getHighScoreFeedbacks(minScore);
  }

  async getLowScoreFeedbacks(maxScore: number = 60): Promise<Feedback[]> {
    return this.model.getLowScoreFeedbacks(maxScore);
  }

  async parseSuggestions(feedback: Feedback): Promise<string[]> {
    return this.model.parseSuggestions(feedback);
  }

  async parseStrengths(feedback: Feedback): Promise<string[]> {
    return this.model.parseStrengths(feedback);
  }

  async parseImprovements(feedback: Feedback): Promise<string[]> {
    return this.model.parseImprovements(feedback);
  }

  async parseAnalysis(feedback: Feedback): Promise<any> {
    return this.model.parseAnalysis(feedback);
  }
}