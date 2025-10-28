import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const prisma = new PrismaClient();

describe('ChatSession Model', () => {
  beforeAll(async () => {
    await prisma.chatMessage.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('ChatSession Creation', () => {
    it('should create session with user', async () => {
      const user = await prisma.user.create({ data: { email: 'session@test.com' } });
      
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      expect(session).toBeDefined();
      expect(session.userId).toBe(user.id);
    });

    it('should create session with document', async () => {
      const user = await prisma.user.create({ data: { email: 'session2@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Session Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const session = await prisma.chatSession.create({
        data: { userId: user.id, documentId: doc.id }
      });
      
      expect(session.documentId).toBe(doc.id);
    });

    it('should support optional title field', async () => {
      const user = await prisma.user.create({ data: { email: 'title@test.com' } });
      
      const session = await prisma.chatSession.create({
        data: { userId: user.id, title: 'My Chat Session' }
      });
      
      expect(session.title).toBe('My Chat Session');
    });

    it('should generate UUID for id', async () => {
      const user = await prisma.user.create({ data: { email: 'uuid3@test.com' } });
      
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should set timestamps', async () => {
      const user = await prisma.user.create({ data: { email: 'time2@test.com' } });
      
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      expect(session.createdAt).toBeDefined();
      expect(session.updatedAt).toBeDefined();
    });
  });

  describe('ChatSession Relationships', () => {
    it('should have relationship with user', async () => {
      const user = await prisma.user.create({ data: { email: 'rel2@test.com' } });
      
      const session = await prisma.chatSession.create({
        data: { userId: user.id },
        include: { user: true }
      });
      
      expect(session.user).toBeDefined();
      expect(session.user.email).toBe('rel2@test.com');
    });

    it('should have relationship with document', async () => {
      const user = await prisma.user.create({ data: { email: 'doc2@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Rel Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      const session = await prisma.chatSession.create({
        data: { userId: user.id, documentId: doc.id },
        include: { document: true }
      });
      
      expect(session.document).toBeDefined();
      expect(session.document?.title).toBe('Rel Doc');
    });

    it('should have relationship with messages', async () => {
      const user = await prisma.user.create({ data: { email: 'msg@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: 'Test message'
        }
      });
      
      const sessionWithMsgs = await prisma.chatSession.findUnique({
        where: { id: session.id },
        include: { messages: true }
      });
      
      expect(sessionWithMsgs?.messages.length).toBeGreaterThan(0);
    });

    it('should cascade delete messages when deleted', async () => {
      const user = await prisma.user.create({ data: { email: 'cascade3@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      await prisma.chatMessage.create({
        data: { sessionId: session.id, role: 'user', content: 'Test' }
      });
      
      await prisma.chatSession.delete({ where: { id: session.id } });
      
      const messages = await prisma.chatMessage.findMany({ where: { sessionId: session.id } });
      expect(messages.length).toBe(0);
    });

    it('should cascade delete when user is deleted', async () => {
      const user = await prisma.user.create({ data: { email: 'cascade4@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      await prisma.user.delete({ where: { id: user.id } });
      
      const deleted = await prisma.chatSession.findUnique({ where: { id: session.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('ChatSession Indexing', () => {
    it('should have index on userId', async () => {
      const user = await prisma.user.create({ data: { email: 'index3@test.com' } });
      
      await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const sessions = await prisma.chatSession.findMany({ where: { userId: user.id } });
      expect(sessions.length).toBeGreaterThan(0);
    });

    it('should have index on documentId', async () => {
      const user = await prisma.user.create({ data: { email: 'index4@test.com' } });
      const doc = await prisma.document.create({
        data: {
          title: 'Index Doc',
          filePath: '/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          userId: user.id
        }
      });
      
      await prisma.chatSession.create({
        data: { userId: user.id, documentId: doc.id }
      });
      
      const sessions = await prisma.chatSession.findMany({ where: { documentId: doc.id } });
      expect(sessions.length).toBeGreaterThan(0);
    });
  });
});

