import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function cleanDatabase() {
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.documentAnalysis.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser(email: string = 'test@example.com') {
  return prisma.user.create({
    data: { email, name: 'Test User' }
  });
}

export async function createTestDocument(userId: string) {
  return prisma.document.create({
    data: {
      title: 'Test Document',
      filePath: '/test.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      userId
    }
  });
}

export async function createTestChatSession(userId: string, documentId?: string) {
  return prisma.chatSession.create({
    data: {
      userId,
      documentId: documentId || null
    }
  });
}

