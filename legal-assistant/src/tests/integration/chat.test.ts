import { PrismaClient, ChatRole } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { chatSessionService, chatMessageService } from '@/lib/database';

const prisma = new PrismaClient();

describe('Chat Integration Tests', () => {
  let testUserId: string;
  let testDocumentId: string;

  beforeAll(async () => {
    await prisma.chatMessage.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
  });

  beforeEach(async () => {
    await prisma.chatMessage.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();

    // Create test user and document
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });
    testUserId = user.id;

    const document = await prisma.document.create({
      data: {
        title: 'Test Document',
        filePath: '/test.pdf',
        fileSize: 1234,
        mimeType: 'application/pdf',
        userId: testUserId,
      },
    });
    testDocumentId = document.id;
  });

  afterAll(async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      // Ignore disconnect errors
    }
  });

  describe('Chat Session Management', () => {
    it('should create chat session with document', async () => {
      const session = await chatSessionService.createSession({
        userId: testUserId,
        documentId: testDocumentId,
        title: 'Test Session'
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(testUserId);
      expect(session.documentId).toBe(testDocumentId);
    });

    it('should create chat session without document', async () => {
      const session = await chatSessionService.createSession({
        userId: testUserId
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(testUserId);
      expect(session.documentId).toBeNull();
    });

    it('should retrieve chat sessions for user', async () => {
      await chatSessionService.createSession({ userId: testUserId });
      await chatSessionService.createSession({ userId: testUserId });

      const sessions = await chatSessionService.getUserSessions(testUserId);
      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should delete chat session and cascade delete messages', async () => {
      const session = await chatSessionService.createSession({ userId: testUserId });
      
      // Add messages
      await chatMessageService.createMessage({
        sessionId: session.id,
        role: 'user',
        content: 'Test message'
      });

      // Delete session
      await chatSessionService.deleteSession(session.id);

      // Verify messages are deleted (cascade)
      const messages = await chatMessageService.getSessionMessages(session.id);
      expect(messages.length).toBe(0);
    });
  });

  describe('Chat Message Persistence', () => {
    it('should persist user message in database', async () => {
      const session = await chatSessionService.createSession({ userId: testUserId });
      
      const message = await chatMessageService.createMessage({
        sessionId: session.id,
        role: 'user',
        content: 'Bu bir kullanıcı mesajıdır'
      });

      expect(message).toBeDefined();
      expect(message.role).toBe('user');
      expect(message.content).toBe('Bu bir kullanıcı mesajıdır');
    });

    it('should persist assistant message in database', async () => {
      const session = await chatSessionService.createSession({ userId: testUserId });
      
      const message = await chatMessageService.createMessage({
        sessionId: session.id,
        role: 'assistant',
        content: 'Bu bir asistan yanıtıdır'
      });

      expect(message).toBeDefined();
      expect(message.role).toBe('assistant');
    });

    it('should retrieve all messages for session', async () => {
      const session = await chatSessionService.createSession({ userId: testUserId });
      
      await chatMessageService.createMessage({
        sessionId: session.id,
        role: 'user',
        content: 'Message 1'
      });
      await chatMessageService.createMessage({
        sessionId: session.id,
        role: 'assistant',
        content: 'Message 2'
      });

      const messages = await chatMessageService.getSessionMessages(session.id);
      expect(messages.length).toBe(2);
    });

    it('should preserve message order', async () => {
      const session = await chatSessionService.createSession({ userId: testUserId });
      
      await chatMessageService.createMessage({
        sessionId: session.id,
        role: 'user',
        content: 'First'
      });
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await chatMessageService.createMessage({
        sessionId: session.id,
        role: 'assistant',
        content: 'Second'
      });

      const messages = await chatMessageService.getSessionMessages(session.id);
      expect(messages[0].content).toBe('First');
      expect(messages[1].content).toBe('Second');
    });

    it('should support message metadata', async () => {
      const session = await chatSessionService.createSession({ userId: testUserId });
      
      const message = await chatMessageService.createMessage({
        sessionId: session.id,
        role: 'user',
        content: 'Test message',
        metadata: { source: 'api', timestamp: Date.now() }
      });

      expect(message.metadata).toBeDefined();
    });
  });
});

