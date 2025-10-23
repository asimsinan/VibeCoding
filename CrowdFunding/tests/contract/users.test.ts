import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Contract tests for User API endpoints
describe('User API Contract Tests', () => {
  let testUser: any;
  let userToken: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.donation.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'contract-user@example.com',
        password: hashedPassword,
        name: 'Contract Test User',
        role: 'USER'
      }
    });

    // Login to get token
    const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'contract-user@example.com',
        password: 'testpassword123'
      });
    userToken = userLoginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.donation.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /users/profile', () => {
    it('should return user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('role');
      expect(response.body).toHaveProperty('isVerified');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/users/profile')
        .expect(401);
    });
  });

  describe('PUT /users/profile', () => {
    const updateData = {
      name: 'Updated Name',
      bio: 'Updated bio',
      avatar: 'https://example.com/avatar.jpg'
    };

    it('should update user profile with valid data', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.bio).toBe(updateData.bio);
      expect(response.body.avatar).toBe(updateData.avatar);
    });

    it('should return 400 for invalid name length', async () => {
      const invalidData = {
        name: '', // Empty name should fail
        bio: 'Valid bio'
      };

      await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for name too long', async () => {
      const invalidData = {
        name: 'a'.repeat(101), // Name too long
        bio: 'Valid bio'
      };

      await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for bio too long', async () => {
      const invalidData = {
        name: 'Valid Name',
        bio: 'a'.repeat(501) // Bio too long
      };

      await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for invalid avatar URL', async () => {
      const invalidData = {
        name: 'Valid Name',
        avatar: 'not-a-valid-url'
      };

      await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .put('/api/v1/users/profile')
        .send(updateData)
        .expect(401);
    });
  });
});