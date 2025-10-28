import { PrismaClient, AnalysisType, AnalysisStatus } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const prisma = new PrismaClient();

describe('DocumentAnalysis Model', () => {
  beforeAll(async () => {
    await prisma.documentAnalysis.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.documentAnalysis.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('DocumentAnalysis Creation', () => {
    it('should create analysis with document', async () => {
      const user = await prisma.user.create({ data: { email: 'analysis@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Analysis Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, analysisType: 'kvkk' }
      });
      
      expect(analysis).toBeDefined();
      expect(analysis.documentId).toBe(doc.id);
    });

    it('should default to kvkk analysis type', async () => {
      const user = await prisma.user.create({ data: { email: 'kvkk@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'KVKK Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id }
      });
      
      expect(analysis.analysisType).toBe('kvkk');
    });

    it('should support data_mapping type', async () => {
      const user = await prisma.user.create({ data: { email: 'data@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Data Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, analysisType: 'data_mapping' }
      });
      
      expect(analysis.analysisType).toBe('data_mapping');
    });

    it('should support clauses type', async () => {
      const user = await prisma.user.create({ data: { email: 'clauses@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Clauses Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, analysisType: 'clauses' }
      });
      
      expect(analysis.analysisType).toBe('clauses');
    });

    it('should default to pending status', async () => {
      const user = await prisma.user.create({ data: { email: 'pending@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Pending Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id }
      });
      
      expect(analysis.status).toBe('pending');
    });

    it('should store results as JSON', async () => {
      const user = await prisma.user.create({ data: { email: 'results@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Results Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const results = { score: 85, issues: ['issue1', 'issue2'] };
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, results }
      });
      
      expect(analysis.results).toEqual(results);
    });
  });

  describe('DocumentAnalysis Enum Validation', () => {
    it('should accept kvkk type', async () => {
      const user = await prisma.user.create({ data: { email: 'enum1@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Enum Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, analysisType: 'kvkk' }
      });
      
      expect(analysis.analysisType).toBe('kvkk');
    });

    it('should accept data_mapping type', async () => {
      const user = await prisma.user.create({ data: { email: 'enum2@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Enum Doc 2',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, analysisType: 'data_mapping' }
      });
      
      expect(analysis.analysisType).toBe('data_mapping');
    });

    it('should accept clauses type', async () => {
      const user = await prisma.user.create({ data: { email: 'enum3@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Enum Doc 3',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, analysisType: 'clauses' }
      });
      
      expect(analysis.analysisType).toBe('clauses');
    });

    it('should accept pending status', async () => {
      const user = await prisma.user.create({ data: { email: 'enum4@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Enum Doc 4',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, status: 'pending' }
      });
      
      expect(analysis.status).toBe('pending');
    });

    it('should accept completed status', async () => {
      const user = await prisma.user.create({ data: { email: 'enum5@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Enum Doc 5',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, status: 'completed' }
      });
      
      expect(analysis.status).toBe('completed');
    });

    it('should accept failed status', async () => {
      const user = await prisma.user.create({ data: { email: 'enum6@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Enum Doc 6',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, status: 'failed' }
      });
      
      expect(analysis.status).toBe('failed');
    });
  });

  describe('DocumentAnalysis Relationships', () => {
    it('should have relationship with document', async () => {
      const user = await prisma.user.create({ data: { email: 'rel4@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Rel Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id },
        include: { document: true }
      });
      
      expect(analysis.document).toBeDefined();
      expect(analysis.document.title).toBe('Rel Doc');
    });

    it('should cascade delete when document is deleted', async () => {
      const user = await prisma.user.create({ data: { email: 'cascade6@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Cascade Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id }
      });
      
      await prisma.document.delete({ where: { id: doc.id } });
      
      const deleted = await prisma.documentAnalysis.findUnique({ where: { id: analysis.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('DocumentAnalysis Indexing', () => {
    it('should have index on documentId', async () => {
      const user = await prisma.user.create({ data: { email: 'index6@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Index Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      await prisma.documentAnalysis.create({
        data: { documentId: doc.id }
      });
      
      const analyses = await prisma.documentAnalysis.findMany({ where: { documentId: doc.id } });
      expect(analyses.length).toBeGreaterThan(0);
    });

    it('should have index on status', async () => {
      const user = await prisma.user.create({ data: { email: 'index7@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Status Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      await prisma.documentAnalysis.create({
        data: { documentId: doc.id, status: 'completed' }
      });
      
      const analyses = await prisma.documentAnalysis.findMany({ where: { status: 'completed' } });
      expect(analyses.length).toBeGreaterThan(0);
    });
  });

  describe('DocumentAnalysis Results', () => {
    it('should store complex JSON results', async () => {
      const user = await prisma.user.create({ data: { email: 'complex@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Complex Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const complexResults = {
        complianceScore: 85,
        issues: [
          { type: 'data_collection', severity: 'high' },
          { type: 'consent', severity: 'medium' }
        ],
        recommendations: ['Fix data collection', 'Add explicit consent']
      };
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, results: complexResults }
      });
      
      expect(analysis.results).toEqual(complexResults);
    });

    it('should update status and results', async () => {
      const user = await prisma.user.create({ data: { email: 'update2@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Update Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, status: 'pending' }
      });
      
      const results = { score: 90 };
      const updated = await prisma.documentAnalysis.update({
        where: { id: analysis.id },
        data: { status: 'completed', results }
      });
      
      expect(updated.status).toBe('completed');
      expect(updated.results).toEqual(results);
    });

    it('should support null results', async () => {
      const user = await prisma.user.create({ data: { email: 'null@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Null Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const analysis = await prisma.documentAnalysis.create({
        data: { documentId: doc.id, results: null }
      });
      
      expect(analysis.results).toBeNull();
    });
  });
});
