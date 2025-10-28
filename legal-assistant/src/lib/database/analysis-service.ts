import { getPrismaClient } from './prisma-client';
import type { DocumentAnalysis, Prisma, AnalysisType, AnalysisStatus } from '@prisma/client';

export class DocumentAnalysisService {
  /**
   * Create a new analysis
   */
  async createAnalysis(data: Prisma.DocumentAnalysisCreateInput): Promise<DocumentAnalysis> {
    const prisma = getPrismaClient();
    return prisma.documentAnalysis.create({
      data,
    });
  }

  /**
   * Get analysis by ID
   */
  async getAnalysisById(id: string): Promise<DocumentAnalysis | null> {
    const prisma = getPrismaClient();
    return prisma.documentAnalysis.findUnique({
      where: { id },
    });
  }

  /**
   * Get all analyses for a document
   */
  async getDocumentAnalyses(documentId: string): Promise<DocumentAnalysis[]> {
    const prisma = getPrismaClient();
    return prisma.documentAnalysis.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update analysis status
   */
  async updateAnalysisStatus(id: string, status: AnalysisStatus, results?: Record<string, any>): Promise<DocumentAnalysis> {
    const prisma = getPrismaClient();
    return prisma.documentAnalysis.update({
      where: { id },
      data: {
        status,
        results: results || {},
      },
    });
  }

  /**
   * Delete analysis
   */
  async deleteAnalysis(id: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.documentAnalysis.delete({
      where: { id },
    });
  }

  /**
   * Get analyses by status
   */
  async getAnalysesByStatus(status: AnalysisStatus): Promise<DocumentAnalysis[]> {
    const prisma = getPrismaClient();
    return prisma.documentAnalysis.findMany({
      where: { status },
    });
  }

  /**
   * Get all analyses for a user (via document relationship)
   */
  async getUserAnalyses(userId: string): Promise<DocumentAnalysis[]> {
    const prisma = getPrismaClient();
    return prisma.documentAnalysis.findMany({
      where: {
        document: {
          userId
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const documentAnalysisService = new DocumentAnalysisService();

