import { getPrismaClient } from './prisma-client';
import type { ChatSession, ChatMessage, Prisma, ChatRole } from '@prisma/client';

export class ChatSessionService {
  /**
   * Create a new chat session
   */
  async createSession(data: {
    userId: string;
    documentId?: string | null;
    title?: string | null;
  }): Promise<ChatSession> {
    const prisma = getPrismaClient();
    return prisma.chatSession.create({
      data: {
        userId: data.userId,
        documentId: data.documentId,
        title: data.title
      },
    });
  }

  /**
   * Get session by ID
   */
  async getSessionById(id: string): Promise<ChatSession | null> {
    const prisma = getPrismaClient();
    return prisma.chatSession.findUnique({
      where: { id },
    });
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    const prisma = getPrismaClient();
    return prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Update session
   */
  async updateSession(id: string, data: Partial<Pick<ChatSession, 'title'>>): Promise<ChatSession> {
    const prisma = getPrismaClient();
    return prisma.chatSession.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete session
   */
  async deleteSession(id: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.chatSession.delete({
      where: { id },
    });
  }
}

export class ChatMessageService {
  /**
   * Create a new message
   */
  async createMessage(data: {
    sessionId: string;
    role: ChatRole;
    content: string;
    metadata?: Record<string, any>;
  }): Promise<ChatMessage> {
    const prisma = getPrismaClient();
    return prisma.chatMessage.create({
      data,
    });
  }

  /**
   * Get all messages for a session
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const prisma = getPrismaClient();
    return prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get message by ID
   */
  async getMessageById(id: string): Promise<ChatMessage | null> {
    const prisma = getPrismaClient();
    return prisma.chatMessage.findUnique({
      where: { id },
    });
  }

  /**
   * Delete message
   */
  async deleteMessage(id: string): Promise<void> {
    const prisma = getPrismaClient();
    await prisma.chatMessage.delete({
      where: { id },
    });
  }
}

export const chatSessionService = new ChatSessionService();
export const chatMessageService = new ChatMessageService();

