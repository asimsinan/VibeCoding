import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Contract tests for Campaign API endpoints
describe('Campaign API Contract Tests', () => {
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
        email: 'contract-campaign-user@example.com',
        password: hashedPassword,
        name: 'Contract Campaign User',
        role: 'USER'
      }
    });

    // Create test admin
    testAdmin = await prisma.user.create({
      data: {
        email: 'contract-campaign-admin@example.com',
        password: hashedPassword,
        name: 'Contract Campaign Admin',
        role: 'ADMIN'
      }
    });

    // Login to get tokens
    const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'contract-campaign-user@example.com',
        password: 'testpassword123'
      });
    userToken = userLoginResponse.body.token;

    const adminLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'contract-campaign-admin@example.com',
        password: 'testpassword123'
      });
    adminToken = adminLoginResponse.body.token;
  });

  afterAll(async () => {
    await prisma.donation.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /campaigns', () => {
    it('should return paginated list of campaigns', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns')
        .expect(200);

      expect(response.body).toHaveProperty('campaigns');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.campaigns)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns?page=2&limit=10')
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should support category filtering', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns?category=TECHNOLOGY')
        .expect(200);

      response.body.campaigns.forEach((campaign: any) => {
        expect(campaign.category).toBe('TECHNOLOGY');
      });
    });

    it('should support status filtering', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns?status=ACTIVE')
        .expect(200);

      response.body.campaigns.forEach((campaign: any) => {
        expect(campaign.status).toBe('ACTIVE');
      });
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns?search=technology')
        .expect(200);

      expect(Array.isArray(response.body.campaigns)).toBe(true);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      await request(app)
        .get('/api/v1/campaigns?page=0&limit=0')
        .expect(400);
    });
  });

  describe('POST /campaigns', () => {
    it('should create a new campaign with valid data', async () => {
      const campaignData = {
        title: 'Test Campaign',
        description: 'This is a test campaign description',
        goal: 10000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'TECHNOLOGY'
      };

      const response = await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .send(campaignData)
        .expect(201);

      expect(response.body.campaign).toHaveProperty('id');
      expect(response.body.campaign.title).toBe(campaignData.title);
      expect(response.body.campaign.description).toBe(campaignData.description);
      expect(response.body.campaign.goal).toBe(campaignData.goal);
      expect(response.body.campaign.category).toBe(campaignData.category);
      expect(response.body.campaign.status).toBe('DRAFT');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        title: 'Test Campaign'
        // Missing required fields
      };

      await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for invalid goal amount', async () => {
      const invalidData = {
        title: 'Test Campaign',
        description: 'Test description',
        goal: -100,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'TECHNOLOGY'
      };

      await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for past deadline', async () => {
      const invalidData = {
        title: 'Test Campaign',
        description: 'Test description',
        goal: 10000,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        category: 'TECHNOLOGY'
      };

      await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const campaignData = {
        title: 'Test Campaign',
        description: 'Test description',
        goal: 10000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'TECHNOLOGY'
      };

      await request(app)
        .post('/api/v1/campaigns')
        .send(campaignData)
        .expect(401);
    });
  });

  describe('GET /campaigns/:id', () => {
    let campaignId: string;

    beforeAll(async () => {
      // Create a test campaign for these tests
      const campaignData = {
        title: 'Test Campaign for GET',
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

    it('should return campaign details', async () => {
      const response = await request(app)
        .get(`/api/v1/campaigns/${campaignId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', campaignId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('goal');
      expect(response.body).toHaveProperty('current');
      expect(response.body).toHaveProperty('deadline');
      expect(response.body).toHaveProperty('category');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('ownerId');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 404 for non-existent campaign', async () => {
      await request(app)
        .get('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440999')
        .expect(404);
    });

    it('should return 400 for invalid campaign ID format', async () => {
      await request(app)
        .get('/api/v1/campaigns/invalid-id')
        .expect(400);
    });
  });

  describe('PUT /campaigns/:id', () => {
    let campaignId: string;

    beforeAll(async () => {
      // Create a test campaign for these tests
      const campaignData = {
        title: 'Test Campaign for PUT',
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

    it('should update campaign with valid data', async () => {
      const updateData = {
        title: 'Updated Campaign Title',
        description: 'Updated description',
        goal: 15000
      };

      const response = await request(app)
        .put(`/api/v1/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.goal).toBe(updateData.goal);
    });

    it('should return 404 for non-existent campaign', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      await request(app)
        .put('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      await request(app)
        .put(`/api/v1/campaigns/${campaignId}`)
        .send(updateData)
        .expect(401);
    });

    it('should return 403 for unauthorized user', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      await request(app)
        .put(`/api/v1/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('DELETE /campaigns/:id', () => {
    let campaignId: string;

    beforeAll(async () => {
      // Create a test campaign for these tests
      const campaignData = {
        title: 'Test Campaign for DELETE',
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

    it('should delete campaign', async () => {
      await request(app)
        .delete(`/api/v1/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
    });

    it('should return 404 for non-existent campaign', async () => {
      await request(app)
        .delete('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .delete(`/api/v1/campaigns/${campaignId}`)
        .expect(401);
    });

    it('should return 403 for unauthorized user', async () => {
      // Create a separate campaign for this test
      const campaignData = {
        title: 'Test Campaign for DELETE Authorization',
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

      const testCampaignId = response.body.campaign.id;

      await request(app)
        .delete(`/api/v1/campaigns/${testCampaignId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });
  });

  describe('POST /campaigns/:id/donate', () => {
    let campaignId: string;

    beforeAll(async () => {
      // Create a test campaign for these tests
      const campaignData = {
        title: 'Test Campaign for Donation',
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

      // Activate the campaign so it can accept donations
      await request(app)
        .put(`/api/v1/admin/campaigns/${campaignId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);
    });

    it('should process donation with valid data', async () => {
      const donationData = {
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        isAnonymous: false,
        message: 'Great project!'
      };

      const response = await request(app)
        .post(`/api/v1/campaigns/${campaignId}/donate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(donationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(donationData.amount);
      expect(response.body.paymentMethod).toBe(donationData.paymentMethod);
      expect(response.body.campaignId).toBe(campaignId);
      expect(response.body.status).toBe('PENDING');
    });

    it('should return 400 for invalid donation amount', async () => {
      const invalidData = {
        amount: -100,
        paymentMethod: 'CREDIT_CARD'
      };

      await request(app)
        .post(`/api/v1/campaigns/${campaignId}/donate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for invalid payment method', async () => {
      const invalidData = {
        amount: 100,
        paymentMethod: 'INVALID_METHOD'
      };

      await request(app)
        .post(`/api/v1/campaigns/${campaignId}/donate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 404 for non-existent campaign', async () => {
      const donationData = {
        amount: 100,
        paymentMethod: 'CREDIT_CARD'
      };

      await request(app)
        .post('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440999/donate')
        .set('Authorization', `Bearer ${userToken}`)
        .send(donationData)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const donationData = {
        amount: 100,
        paymentMethod: 'CREDIT_CARD'
      };

      await request(app)
        .post(`/api/v1/campaigns/${campaignId}/donate`)
        .send(donationData)
        .expect(401);
    });
  });

  describe('GET /campaigns/:id/comments', () => {
    let campaignId: string;

    beforeAll(async () => {
      // Create a test campaign for these tests
      const campaignData = {
        title: 'Test Campaign for Comments',
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

    it('should return campaign comments', async () => {
      const response = await request(app)
        .get(`/api/v1/campaigns/${campaignId}/comments`)
        .expect(200);

      expect(response.body).toHaveProperty('comments');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.comments)).toBe(true);
    });

    it('should support pagination for comments', async () => {
      const response = await request(app)
        .get(`/api/v1/campaigns/${campaignId}/comments?page=1&limit=5`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should return 404 for non-existent campaign', async () => {
      await request(app)
        .get('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440999/comments')
        .expect(404);
    });
  });

  describe('POST /campaigns/:id/comments', () => {
    let campaignId: string;

    beforeAll(async () => {
      // Create a test campaign for these tests
      const campaignData = {
        title: 'Test Campaign for Comment Creation',
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

    it('should create comment with valid data', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/v1/campaigns/${campaignId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe(commentData.content);
      expect(response.body.campaignId).toBe(campaignId);
      expect(response.body).toHaveProperty('authorId');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should create reply comment with parentId', async () => {
      // First create a parent comment
      const parentCommentData = {
        content: 'Parent comment'
      };

      const parentResponse = await request(app)
        .post(`/api/v1/campaigns/${campaignId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(parentCommentData)
        .expect(201);

      // Then create a reply
      const replyData = {
        content: 'This is a reply',
        parentId: parentResponse.body.id
      };

      const response = await request(app)
        .post(`/api/v1/campaigns/${campaignId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(replyData)
        .expect(201);

      expect(response.body.content).toBe(replyData.content);
      expect(response.body.parentId).toBe(parentResponse.body.id);
    });

    it('should return 400 for empty comment content', async () => {
      const invalidData = {
        content: ''
      };

      await request(app)
        .post(`/api/v1/campaigns/${campaignId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for comment content too long', async () => {
      const invalidData = {
        content: 'a'.repeat(1001) // Exceeds 1000 character limit
      };

      await request(app)
        .post(`/api/v1/campaigns/${campaignId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should return 404 for non-existent campaign', async () => {
      const commentData = {
        content: 'Test comment'
      };

      await request(app)
        .post('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440999/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(commentData)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const commentData = {
        content: 'Test comment'
      };

      await request(app)
        .post(`/api/v1/campaigns/${campaignId}/comments`)
        .send(commentData)
        .expect(401);
    });
  });
});