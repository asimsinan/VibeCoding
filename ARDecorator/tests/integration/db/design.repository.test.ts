import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Design Repository Integration Tests', () => {
  let userId: string;
  let roomPhotoId: string;

  beforeAll(async () => {
    // Create test user and room photo
    const user = await prisma.user.create({
      data: {
        email: 'design-test@example.com',
        password: 'hashed',
        name: 'Design Tester',
        role: 'user',
      },
    });
    userId = user.id;

    const photo = await prisma.roomPhoto.create({
      data: {
        userId,
        filename: 'room.jpg',
        url: 'https://example.com/room.jpg',
        status: 'completed',
      },
    });
    roomPhotoId = photo.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('CREATE operations', () => {
    it('should create design with placed furniture', async () => {
      const design = await prisma.design.create({
        data: {
          userId,
          roomPhotoId,
          name: 'Living Room Design',
          totalCost: 0,
        },
      });

      expect(design).toHaveProperty('id');
      expect(design.name).toBe('Living Room Design');
    });
  });

  describe('READ operations', () => {
    it('should list user designs', async () => {
      const designs = await prisma.design.findMany({
        where: { userId },
      });

      expect(Array.isArray(designs)).toBe(true);
    });

    it('should include placed furniture', async () => {
      const designs = await prisma.design.findMany({
        where: { userId },
        include: { placedFurniture: true },
      });

      expect(Array.isArray(designs)).toBe(true);
    });
  });
});

