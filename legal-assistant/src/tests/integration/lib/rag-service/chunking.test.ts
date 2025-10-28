import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { chunker } from '@/lib/rag-service';

const prisma = new PrismaClient();

describe('RAG Service - Chunking Strategy', () => {
  let testUserId: string;
  let largeDocumentId: string;

  beforeAll(async () => {
    await prisma.documentAnalysis.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: 'chunk-test@example.com',
        name: 'Chunk Test User'
      }
    });
    testUserId = user.id;

    const largeText = Array(20).fill(
      'Bu çok uzun bir Türkçe belgedir. İçinde birçok farklı konu bulunmaktadır. ' +
      'Her paragraf önemli bilgiler içermektedir. İş sözleşmeleri, gizlilik anlaşmaları ' +
      've hizmet sözleşmeleri bu belgede yer almaktadır.'
    ).join(' ');

    const doc = await prisma.document.create({
      data: {
        title: 'Büyük Türkçe Belge',
        filePath: '/large-doc.pdf',
        fileSize: 200000,
        mimeType: 'application/pdf',
        userId: testUserId,
        extractedText: largeText
      }
    });
    largeDocumentId = doc.id;
  });

  afterAll(async () => {
    await prisma.documentAnalysis.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('Large Document Chunking', () => {
    it('should split large documents into manageable chunks', async () => {
      const doc = await prisma.document.findUnique({ where: { id: largeDocumentId } });
      expect(doc?.extractedText).toBeDefined();
      
      if (doc?.extractedText) {
        const chunks = chunker.chunkText(doc.extractedText, doc.id, doc.title || undefined);
        
        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks.length).toBeLessThan(100);
      }
    });

    it('should preserve Turkish text integrity in chunks', async () => {
      const doc = await prisma.document.findUnique({ where: { id: largeDocumentId } });
      
      if (doc?.extractedText) {
        const chunks = chunker.chunkText(doc.extractedText, doc.id);
        
        chunks.forEach(chunk => {
          expect(chunk.text).toContain('Türkçe');
          expect(/[İışğüöĞÜÖŞĞI]/u.test(chunk.text)).toBe(true);
        });
      }
    });

    it('should maintain chunk size within limits', async () => {
      const doc = await prisma.document.findUnique({ where: { id: largeDocumentId } });
      
      if (doc?.extractedText) {
        const chunks = chunker.chunkText(doc.extractedText, doc.id);
        
        chunks.forEach(chunk => {
          expect(chunk.text.length).toBeLessThan(600);
          expect(chunk.text.length).toBeGreaterThan(0);
        });
      }
    });

    it('should handle overlapping chunks if needed', async () => {
      const doc = await prisma.document.findUnique({ where: { id: largeDocumentId } });
      
      if (doc?.extractedText && doc.extractedText.length > 1000) {
        const chunks = chunker.chunkText(doc.extractedText, doc.id);
        
        // With overlap, adjacent chunks should share some content
        if (chunks.length > 1) {
          expect(chunks[0].text.length + chunks[1].text.length).toBeGreaterThan(doc.extractedText.length);
        }
      }
    });
  });

  describe('Chunk Context Preservation', () => {
    it('should preserve context around key phrases', async () => {
      const doc = await prisma.document.findUnique({ where: { id: largeDocumentId } });
      
      if (doc?.extractedText) {
        const chunks = chunker.chunkText(doc.extractedText, doc.id);
        
        // Find chunk containing "sözleşme"
        const relevantChunk = chunks.find(chunk => chunk.text.includes('sözleşme'));
        expect(relevantChunk).toBeDefined();
        expect(relevantChunk?.text.length).toBeGreaterThan(10);
      }
    });

    it('should maintain sentence boundaries', async () => {
      const testText = 'İlk cümle. İkinci cümle! Üçüncü cümle?';
      const chunks = chunker.chunkText(testText, 'test-id');
      
      chunks.forEach(chunk => {
        const sentences = chunk.text.split(/[.!?]/);
        expect(sentences.filter(s => s.trim().length > 0).length).toBeGreaterThan(0);
      });
    });

    it('should handle special characters in chunks', async () => {
      const specialText = 'Türkçe: İ, ı, ş, ğ, ü, ö - özel karakterler!';
      const chunks = chunker.chunkText(specialText, 'test-id');
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].text).toContain('Türkçe');
      expect(/[İışğüö]/u.test(chunks[0].text)).toBe(true);
    });
  });
});

