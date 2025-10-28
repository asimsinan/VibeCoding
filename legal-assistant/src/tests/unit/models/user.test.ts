import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const prisma = new PrismaClient();

describe('User Model', () => {
  beforeAll(async () => {
    // Clean database
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('User Creation', () => {
    it('should create a user with email', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com', name: 'Test User' }
      });
      
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
    });

    it('should generate UUID for id', async () => {
      const user = await prisma.user.create({
        data: { email: 'uuid@test.com' }
      });
      
      expect(user.id).toBeDefined();
      expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should enforce unique email constraint', async () => {
      await prisma.user.create({
        data: { email: 'duplicate@test.com' }
      });
      
      await expect(
        prisma.user.create({ data: { email: 'duplicate@test.com' } })
      ).rejects.toThrow();
    });

    it('should set createdAt timestamp', async () => {
      const before = new Date();
      const user = await prisma.user.create({
        data: { email: 'timestamp@test.com' }
      });
      const after = new Date();
      
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should update updatedAt on modifications', async () => {
      const user = await prisma.user.create({
        data: { email: 'update@test.com', name: 'Original' }
      });
      
      const originalUpdatedAt = user.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { name: 'Updated' }
      });
      
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('User Relationships', () => {
    it('should have relationship with documents', async () => {
      const user = await prisma.user.create({
        data: { email: 'rels@test.com' }
      });
      
      const doc = await prisma.document.create({
        data: {
          title: 'Test Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      expect(doc.userId).toBe(user.id);
    });

    it('should have relationship with chat sessions', async () => {
      const user = await prisma.user.create({
        data: { email: 'chat@test.com' }
      });
      
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      expect(session.userId).toBe(user.id);
    });

    it('should cascade delete documents when user is deleted', async () => {
      const user = await prisma.user.create({
        data: { email: 'cascade@test.com' }
      });
      
      await prisma.document.create({
        data: {
          title: 'Cascade Test',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      await prisma.user.delete({ where: { id: user.id } });
      
      const docs = await prisma.document.findMany({ where: { userId: user.id } });
      expect(docs.length).toBe(0);
    });

    it('should cascade delete chat sessions when user is deleted', async () => {
      const user = await prisma.user.create({
        data: { email: 'session@test.com' }
      });
      
      await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      await prisma.user.delete({ where: { id: user.id } });
      
      const sessions = await prisma.chatSession.findMany({ where: { userId: user.id } });
      expect(sessions.length).toBe(0);
    });
  });

  describe('User Indexing', () => {
    it('should have index on email field', async () => {
      const user = await prisma.user.create({
        data: { email: 'index@test.com' }
      });
      
      const found = await prisma.user.findUnique({ where: { email: 'index@test.com' } });
      expect(found).toBeDefined();
      expect(found?.id).toBe(user.id);
    });
  });
});

