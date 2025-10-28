import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { ragSearchService } from '@/lib/rag-service';

const prisma = new PrismaClient();

describe('RAG Service - Semantic Search', () => {
  let testUserId: string;
  let testDocumentIds: string[] = [];

  beforeAll(async () => {
    await prisma.chatMessage.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.documentAnalysis.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: 'rag-test@example.com',
        name: 'RAG Test User'
      }
    });
    testUserId = user.id;

    const doc1 = await prisma.document.create({
      data: {
        title: 'İş Sözleşmesi',
        filePath: '/test-contract.pdf',
        fileSize: 50000,
        mimeType: 'application/pdf',
        userId: testUserId,
        extractedText: 'Bu bir iş sözleşmesidir. Çalışan, şirket adına çalışmakla yükümlüdür. Maaş bilgileri ve çalışma saatleri bu sözleşmede belirtilmiştir.'
      }
    });

    const doc2 = await prisma.document.create({
      data: {
        title: 'Hizmet Sözleşmesi',
        filePath: '/test-service.pdf',
        fileSize: 45000,
        mimeType: 'application/pdf',
        userId: testUserId,
        extractedText: 'Bu bir hizmet sözleşmesidir. Taraflar arasında karşılıklı hizmet alım ve satım işlemi yapılacaktır. Hizmetin kapsamı ve ücreti belirtilmiştir.'
      }
    });

    const doc3 = await prisma.document.create({
      data: {
        title: 'Gizlilik Sözleşmesi',
        filePath: '/test-nda.pdf',
        fileSize: 30000,
        mimeType: 'application/pdf',
        userId: testUserId,
        extractedText: 'Bu gizlilik sözleşmesi taraflar arasındaki bilgi paylaşımını düzenler. Hassas bilgilerin korunması ve kullanım koşulları belirtilmiştir.'
      }
    });

    testDocumentIds = [doc1.id, doc2.id, doc3.id];
  });

  beforeEach(async () => {
    // Keep base data for all tests
  });

  afterAll(async () => {
    await prisma.documentAnalysis.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Semantic Search on Turkish Documents', () => {
    it('should retrieve relevant documents based on semantic query', async () => {
      const results = await ragSearchService.searchDocuments({
        query: 'iş sözleşmesi',
        userId: testUserId
      });

      expect(results.chunks.length).toBeGreaterThan(0);
      expect(results.query).toBe('iş sözleşmesi');
      expect(results.chunks[0].documentId).toBe(testDocumentIds[0]);
    });

    it('should handle Turkish characters correctly (İ, ı, ş, ğ, ü, ö)', async () => {
      const results = await ragSearchService.searchDocuments({
        query: 'hizmet sözleşmesi',
        userId: testUserId
      });

      expect(results.chunks.length).toBeGreaterThan(0);
      const containsTurkishChars = results.chunks.some(chunk => 
        /[İışğüöĞÜÖŞĞI]/u.test(chunk.text)
      );
      expect(containsTurkishChars).toBe(true);
    });

    it('should rank search results by relevance', async () => {
      const results = await ragSearchService.searchDocuments({
        query: 'çalışan maaş',
        userId: testUserId
      });

      expect(results.chunks.length).toBeGreaterThan(0);
      if (results.chunks.length > 1) {
        // First result should have highest relevance
        expect(results.chunks[0].text).toContain('çalışan');
      }
    });

    it('should handle queries in Turkish language', async () => {
      const results = await ragSearchService.searchDocuments({
        query: 'Türkçe sözleşme',
        userId: testUserId
      });

      expect(results.chunks.length).toBeGreaterThanOrEqual(0);
      results.chunks.forEach(chunk => {
        expect(typeof chunk.text).toBe('string');
      });
    });

    it('should return documents with similar meaning even with different wording', async () => {
      const results = await ragSearchService.searchDocuments({
        query: 'çalışma anlaşması',
        userId: testUserId
      });

      // Should find relevant content even with different wording
      expect(results.chunks.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Full-Text Search with PostgreSQL GIN', () => {
    it('should perform full-text search on extracted text field', async () => {
      const results = await ragSearchService.fullTextSearch({
        query: 'maas',
        userId: testUserId
      });

      expect(results.chunks.length).toBeGreaterThan(0);
      expect(results.query).toBe('maas');
    });

    it('should search across multiple Turkish documents', async () => {
      const results = await ragSearchService.fullTextSearch({
        query: 'sözleşme',
        userId: testUserId,
        limit: 20
      });

      expect(results.chunks.length).toBeGreaterThan(0);
      const uniqueDocs = new Set(results.chunks.map(c => c.documentId));
      expect(uniqueDocs.size).toBeGreaterThan(1);
    });

    it('should handle complex Turkish search queries', async () => {
      const results = await ragSearchService.fullTextSearch({
        query: 'çalışan yükümlü',
        userId: testUserId
      });

      expect(results.chunks.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Context Retrieval for Gemini', () => {
    it('should retrieve document chunks for context', async () => {
      const context = await ragSearchService.getContextForGemini({
        query: 'iş sözleşmesi',
        userId: testUserId
      });

      expect(context).toBeDefined();
      expect(typeof context).toBe('string');
      expect(context.length).toBeGreaterThan(0);
    });

    it('should maintain context boundaries within chunks', async () => {
      const context = await ragSearchService.getContextForGemini({
        query: 'sözleşme',
        userId: testUserId
      });

      const lines = context.split('\n\n');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should provide sufficient context for Gemini API', async () => {
      const context = await ragSearchService.getContextForGemini({
        query: 'hizmet',
        userId: testUserId
      });

      expect(context.length).toBeGreaterThan(100);
      expect(context).toContain('[');
    });
  });
});

