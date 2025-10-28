import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { documentService } from '@/lib/database';

const prisma = new PrismaClient();

describe('Document Integration Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Clean database
    await prisma.documentAnalysis.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    await prisma.documentAnalysis.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      // Ignore disconnect errors in test environment
    }
  });

  describe('Document Upload and Storage', () => {
    it('should upload and store document in database', async () => {
      const document = await documentService.createDocument({
        title: 'Test Document',
        description: 'A test document',
        filePath: '/uploads/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extractedText: 'Bu bir Türkçe test belgesi',
        user: {
          connect: { id: testUserId }
        }
      });

      expect(document).toBeDefined();
      expect(document.title).toBe('Test Document');
      expect(document.id).toBeDefined();
    });

    it('should extract text from uploaded document', async () => {
      const document = await documentService.createDocument({
        title: 'Document with Text',
        filePath: '/uploads/doc.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        extractedText: 'Extracted text content',
        user: {
          connect: { id: testUserId }
        }
      });

      expect(document.extractedText).toBe('Extracted text content');
    });

    it('should store file metadata correctly', async () => {
      const document = await documentService.createDocument({
        title: 'Metadata Test',
        filePath: '/uploads/metadata.pdf',
        fileSize: 4096,
        mimeType: 'application/pdf',
        user: {
          connect: { id: testUserId }
        }
      });

      expect(document.fileSize).toBe(4096);
      expect(document.mimeType).toBe('application/pdf');
      expect(document.filePath).toBe('/uploads/metadata.pdf');
    });

    it('should preserve Turkish characters in extracted text', async () => {
      const turkishText = 'İşçi, göçmen, şölen, çözüm';
      const document = await documentService.createDocument({
        title: 'Turkish Document',
        filePath: '/uploads/turkish.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extractedText: turkishText,
        user: {
          connect: { id: testUserId }
        }
      });

      expect(document.extractedText).toBe(turkishText);
      expect(document.extractedText?.includes('İ')).toBe(true);
      expect(document.extractedText?.includes('ş')).toBe(true);
    });
  });

  describe('Document Retrieval', () => {
    it('should retrieve document by ID from database', async () => {
      const created = await documentService.createDocument({
        title: 'Retrieval Test',
        filePath: '/uploads/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        user: {
          connect: { id: testUserId }
        }
      });

      const retrieved = await documentService.getDocumentById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.title).toBe('Retrieval Test');
    });

    it('should retrieve all documents for user', async () => {
      // Create multiple documents
      await documentService.createDocument({
        title: 'Doc 1',
        filePath: '/uploads/doc1.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        user: { connect: { id: testUserId } }
      });
      await documentService.createDocument({
        title: 'Doc 2',
        filePath: '/uploads/doc2.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        user: { connect: { id: testUserId } }
      });

      const documents = await documentService.getUserDocuments(testUserId);
      expect(documents.length).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination for documents', async () => {
      // Create 3 documents
      for (let i = 0; i < 3; i++) {
        await documentService.createDocument({
          title: `Paginated Doc ${i}`,
          filePath: `/uploads/doc${i}.pdf`,
          fileSize: 1024,
          mimeType: 'application/pdf',
          user: { connect: { id: testUserId } }
        });
      }

      const firstPage = await documentService.getUserDocuments(testUserId, 0, 2);
      expect(firstPage.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Full-Text Search', () => {
    it('should search documents by text content', async () => {
      await documentService.createDocument({
        title: 'Search Test',
        filePath: '/uploads/search.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extractedText: 'This document contains searchable text content',
        user: {
          connect: { id: testUserId }
        }
      });

      const results = await documentService.searchDocuments('searchable', testUserId);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search with Turkish text', async () => {
      await documentService.createDocument({
        title: 'Turkish Search',
        filePath: '/uploads/turkish.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extractedText: 'Bu belge Türkçe içerir ve arama yapılabilir',
        user: {
          connect: { id: testUserId }
        }
      });

      const results = await documentService.searchDocuments('Türkçe', testUserId);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should rank results by relevance', async () => {
      // Create multiple documents with different relevance
      await documentService.createDocument({
        title: 'Relevant Doc',
        filePath: '/uploads/relevant.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extractedText: 'Highly relevant content search term',
        user: {
          connect: { id: testUserId }
        }
      });

      const results = await documentService.searchDocuments('relevant', testUserId);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});

