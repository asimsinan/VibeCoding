import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Contract tests for Admin API endpoints
describe('Admin API Contract Tests', () => {
  let testUser: any;
  let testAdmin: any;
  let userToken: string;
  let adminToken: string;
  let campaignId: string;

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
        email: 'contract-admin-user@example.com',
        password: hashedPassword,
        name: 'Contract Admin User',
        role: 'USER'
      }
    });

    // Create test admin
    testAdmin = await prisma.user.create({
      data: {
        email: 'contract-admin-admin@example.com',
        password: hashedPassword,
        name: 'Contract Admin Admin',
        role: 'ADMIN'
      }
    });

    // Login to get tokens
    const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'contract-admin-user@example.com',
        password: 'testpassword123'
      });
    userToken = userLoginResponse.body.token;

    const adminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'contract-admin-admin@example.com',
        password: 'testpassword123'
      });
    adminToken = adminLoginResponse.body.token;

    // Create a test campaign
    const campaignData = {
      title: 'Test Campaign',
      description: 'This is a test campaign description',
      goal: 10000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'TECHNOLOGY'
    };

    const campaignResponse = await request(app)
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${userToken}`)
      .send(campaignData)
      .expect(201);

    campaignId = campaignResponse.body.campaign.id;
  });

  afterAll(async () => {
    await prisma.donation.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /admin/campaigns', () => {
    it('should return all campaigns for admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/campaigns')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('campaigns');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.campaigns)).toBe(true);
    });

    it('should support pagination for admin campaigns', async () => {
      const response = await request(app)
        .get('/api/v1/admin/campaigns?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should support status filtering for admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/campaigns?status=DRAFT')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.campaigns.forEach((campaign: any) => {
        expect(campaign.status).toBe('DRAFT');
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/v1/admin/campaigns')
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app)
        .get('/api/v1/admin/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('PUT /admin/campaigns/:id/status', () => {
    let campaignId: string;

    beforeAll(async () => {
      // Create a test campaign for these tests
      const campaignData = {
        title: 'Test Campaign for Admin Status Update',
        description: 'Test description',
        goal: 10000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'TECHNOLOGY'
      };

      const response = await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .send(campaignData)
        .expect(201);

      campaignId = response.body.campaign.id;
    });

    it('should update campaign status with valid data', async () => {
      const statusData = {
        status: 'ACTIVE',
        reason: 'Campaign approved by admin'
      };

      const response = await request(app)
        .put(`/api/v1/admin/campaigns/${campaignId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.status).toBe(statusData.status);
    });

    it('should update campaign status without reason', async () => {
      const statusData = {
        status: 'SUSPENDED'
      };

      const response = await request(app)
        .put(`/api/v1/admin/campaigns/${campaignId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusData)
        .expect(200);

      expect(response.body.status).toBe(statusData.status);
    });

    it('should return 400 for invalid status', async () => {
      const invalidData = {
        status: 'INVALID_STATUS'
      };

      await request(app)
        .put(`/api/v1/admin/campaigns/${campaignId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for missing status', async () => {
      const invalidData = {
        reason: 'Some reason'
      };

      await request(app)
        .put(`/api/v1/admin/campaigns/${campaignId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for reason too long', async () => {
      const invalidData = {
        status: 'SUSPENDED',
        reason: 'a'.repeat(501) // Exceeds 500 character limit
      };

      await request(app)
        .put(`/api/v1/admin/campaigns/${campaignId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 404 for non-existent campaign', async () => {
      const statusData = {
        status: 'ACTIVE'
      };

      await request(app)
        .put('/api/v1/admin/campaigns/550e8400-e29b-41d4-a716-446655440999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusData)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const statusData = {
        status: 'ACTIVE'
      };

      await request(app)
        .put(`/api/v1/admin/campaigns/${campaignId}/status`)
        .send(statusData)
        .expect(401);
    });

    it('should return 403 for non-admin user', async () => {
      const statusData = {
        status: 'ACTIVE'
      };

      await request(app)
        .put(`/api/v1/admin/campaigns/${campaignId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(statusData)
        .expect(403);
    });
  });
});
