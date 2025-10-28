import { getPrismaClient } from './prisma-client';
import type { Document, Prisma } from '@prisma/client';

export class DocumentService {
  /**
   * Create a new document
   */
  async createDocument(data: Prisma.DocumentCreateInput): Promise<Document> {
    const prisma = getPrismaClient();
    return prisma.document.create({
      data,
    });
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string): Promise<Document | null> {
    const prisma = getPrismaClient();
    return prisma.document.findUnique({
      where: { id },
    });
  }

  /**
   * Get all documents for a user
   */
  async getUserDocuments(userId: string, skip: number = 0, take: number = 10): Promise<Document[]> {
    const prisma = getPrismaClient();
    return prisma.document.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Search documents by text (full-text search)
   */
  async searchDocuments(query: string, userId?: string): Promise<Document[]> {
    const prisma = getPrismaClient();
    
    // Use raw SQL for PostgreSQL full-text search with trigram
    const result = await prisma.$queryRaw<Document[]>`
      SELECT * FROM documents
      WHERE "userId" = ${userId}
        AND "extractedText" ILIKE ${`%${query}%`}
        OR "extractedText" % ${query}
      ORDER BY similarity("extractedText", ${query}) DESC
      LIMIT 10
    `;
    
    return result;
  }

  /**
   * Update document
   */
  async updateDocument(id: string, data: Partial<Pick<Document, 'title' | 'description' | 'extractedText'>>): Promise<Document> {
    const prisma = getPrismaClient();
    return prisma.document.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.document.delete({
      where: { id },
    });
  }

  /**
   * Get total count of documents for a user
   */
  async getUserDocumentCount(userId: string): Promise<number> {
    const prisma = getPrismaClient();
    return prisma.document.count({
      where: { userId },
    });
  }
}

export const documentService = new DocumentService();

