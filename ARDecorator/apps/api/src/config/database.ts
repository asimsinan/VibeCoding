import { PrismaClient } from '@prisma/client';

// Database configuration
export const databaseConfig = {
  url: process.env.DATABASE_URL || 'file:./dev.db',
  connectionTimeout: 10000,
  maxConnections: process.env.NODE_ENV === 'production' ? 50 : 10,
  minConnections: 2,
};

// Create Prisma client instance
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseConfig.url,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Database connection test
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
 
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

