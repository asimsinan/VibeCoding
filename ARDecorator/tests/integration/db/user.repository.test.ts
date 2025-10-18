import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('User Repository Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('CREATE operations', () => {
    it('should create a new user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashed-password',
          name: 'Test User',
          role: 'user',
        },
      });

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('READ operations', () => {
    it('should find user by email', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
    });

    it('should list all users', async () => {
      const users = await prisma.user.findMany();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe('UPDATE operations', () => {
    it('should update user name', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      if (user) {
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: { name: 'Updated Name' },
        });

        expect(updated.name).toBe('Updated Name');
      }
    });
  });

  describe('DELETE operations', () => {
    it('should delete user', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' },
      });

      if (user) {
        await prisma.user.delete({
          where: { id: user.id },
        });

        const deleted = await prisma.user.findUnique({
          where: { id: user.id },
        });

        expect(deleted).toBeNull();
      }
    });
  });
});

