import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
let prismaInstance: PrismaClient | undefined;

export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }
  return prismaInstance;
};

// Export a shared prisma instance
export const prisma = getPrismaClient();

export const disconnectPrisma = async (): Promise<void> => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = undefined;
  }
};

