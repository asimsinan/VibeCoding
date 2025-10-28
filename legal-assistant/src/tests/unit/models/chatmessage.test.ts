import { PrismaClient, ChatRole } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const prisma = new PrismaClient();

describe('ChatMessage Model', () => {
  beforeAll(async () => {
    await prisma.chatMessage.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('ChatMessage Creation', () => {
    it('should create message with session', async () => {
      const user = await prisma.user.create({ data: { email: 'message@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: 'Test message'
        }
      });
      
      expect(message).toBeDefined();
      expect(message.sessionId).toBe(session.id);
      expect(message.content).toBe('Test message');
    });

    it('should default to user role', async () => {
      const user = await prisma.user.create({ data: { email: 'default@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          content: 'Test'
        }
      });
      
      expect(message.role).toBe('user');
    });

    it('should support assistant role', async () => {
      const user = await prisma.user.create({ data: { email: 'assistant@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: 'AI response'
        }
      });
      
      expect(message.role).toBe('assistant');
    });

    it('should support metadata JSON field', async () => {
      const user = await prisma.user.create({ data: { email: 'meta@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const metadata = { tokens: 100, model: 'gemini' };
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: 'Test',
          metadata
        }
      });
      
      expect(message.metadata).toEqual(metadata);
    });

    it('should store content as text', async () => {
      const user = await prisma.user.create({ data: { email: 'text@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const longText = 'Bu çok uzun bir Türkçe metindir. İçerik doğru şekilde saklanmalıdır.';
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: longText
        }
      });
      
      expect(message.content).toBe(longText);
    });

    it('should set timestamps', async () => {
      const user = await prisma.user.create({ data: { email: 'time3@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: 'Test'
        }
      });
      
      expect(message.createdAt).toBeDefined();
      expect(message.updatedAt).toBeDefined();
    });
  });

  describe('ChatMessage Enum Validation', () => {
    it('should accept user role', async () => {
      const user = await prisma.user.create({ data: { email: 'enum@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: 'Test'
        }
      });
      
      expect(message.role).toBe('user');
    });

    it('should accept assistant role', async () => {
      const user = await prisma.user.create({ data: { email: 'enum2@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: 'Test'
        }
      });
      
      expect(message.role).toBe('assistant');
    });

    it('should reject invalid role', async () => {
      const user = await prisma.user.create({ data: { email: 'enum3@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      await expect(
        prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'invalid' as any,
            content: 'Test'
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('ChatMessage Relationships', () => {
    it('should have relationship with session', async () => {
      const user = await prisma.user.create({ data: { email: 'rel3@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: 'Test'
        }
      });
      
      const messageWithSession = await prisma.chatMessage.findUnique({
        where: { id: message.id },
        include: { session: true }
      });
      
      expect(messageWithSession?.session).toBeDefined();
      expect(messageWithSession?.session.userId).toBe(user.id);
    });

    it('should cascade delete when session is deleted', async () => {
      const user = await prisma.user.create({ data: { email: 'cascade5@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: 'Test'
        }
      });
      
      await prisma.chatSession.delete({ where: { id: session.id } });
      
      const deleted = await prisma.chatMessage.findUnique({ where: { id: message.id } });
      expect(deleted).toBeNull();
    });
  });

  describe('ChatMessage Indexing', () => {
    it('should have index on sessionId', async () => {
      const user = await prisma.user.create({ data: { email: 'index5@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      await prisma.chatMessage.create({
        data: { sessionId: session.id, role: 'user', content: 'Test' }
      });
      
      const messages = await prisma.chatMessage.findMany({ where: { sessionId: session.id } });
      expect(messages.length).toBeGreaterThan(0);
    });
  });

  describe('ChatMessage Metadata', () => {
    it('should store JSON metadata', async () => {
      const user = await prisma.user.create({ data: { email: 'json@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const metadata = { custom: 'data', number: 42 };
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: 'Test',
          metadata
        }
      });
      
      expect(message.metadata).toEqual(metadata);
    });

    it('should support empty metadata object', async () => {
      const user = await prisma.user.create({ data: { email: 'empty@test.com' } });
      const session = await prisma.chatSession.create({
        data: { userId: user.id }
      });
      
      const message = await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: 'Test',
          metadata: {}
        }
      });
      
      expect(message.metadata).toEqual({});
    });
  });
});

