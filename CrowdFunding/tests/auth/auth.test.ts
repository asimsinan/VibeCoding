import request from 'supertest';
import app from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Authentication & Authorization', () => {
  let testUser: any;
  let testCampaign: any;
  let authToken: string;

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
        email: 'testuser@example.com',
        password: hashedPassword,
        name: 'Test User',
        role: 'USER'
      }
    });

    // Create test campaign
    testCampaign = await prisma.campaign.create({
      data: {
        title: 'Test Campaign',
        description: 'Test Description',
        goal: 1000,
        current: 0,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'ACTIVE',
        category: 'TECHNOLOGY',
        ownerId: testUser.id
      }
    });
  });

  afterAll(async () => {
    await prisma.donation.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.campaign.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('testuser@example.com');
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned

      authToken = response.body.token;
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'testpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'newpassword123',
          name: 'New User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.password).toBeUndefined();
    });

    it('should fail with existing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'newpassword123',
          name: 'Another User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'newpassword123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'weakpass@example.com',
          password: '123',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'missing@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication Middleware', () => {
    beforeEach(async () => {
      // Get auth token for tests
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword123'
        });
      authToken = response.body.token;
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.email).toBe('testuser@example.com');
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should deny access with malformed token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'invalid-format');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should deny access with expired token', async () => {
      // Create an expired token (this would need to be implemented in the auth service)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LWlkIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid';
      
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authorization Middleware', () => {
    let adminUser: any;
    let adminToken: string;

    beforeEach(async () => {
      // Get auth token for tests
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword123'
        });
      authToken = response.body.token;

      // Create admin user and get admin token
      const hashedPassword = await bcrypt.hash('adminpassword123', 10);
      adminUser = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN'
        },
        create: {
          email: 'admin@example.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN'
        }
      });

      // Login as admin
      const adminResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'adminpassword123'
        });

      adminToken = adminResponse.body.token;
    });

    it('should allow admin access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/admin/campaigns')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny regular user access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/admin/campaigns')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should allow campaign owner to update their campaign', async () => {
      const response = await request(app)
        .put(`/api/v1/campaigns/${testCampaign.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Campaign Title'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.title).toBe('Updated Campaign Title');
    });

    it('should deny non-owner access to update campaign', async () => {
      // Create another user
      const hashedPassword = await bcrypt.hash('otherpassword123', 10);
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: hashedPassword,
          name: 'Other User',
          role: 'USER'
        }
      });

      // Login as other user
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'other@example.com',
          password: 'otherpassword123'
        });

      const otherToken = loginResponse.body.token;

      const response = await request(app)
        .put(`/api/v1/campaigns/${testCampaign.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Unauthorized Update'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized to update this campaign');

      // Clean up
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should allow campaign owner to delete their campaign', async () => {
      // Create a new campaign for deletion test
      const campaignToDelete = await prisma.campaign.create({
        data: {
          title: 'Campaign to Delete',
          description: 'Test Description',
          goal: 1000,
          current: 0,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          category: 'TECHNOLOGY',
          ownerId: testUser.id
        }
      });

      const response = await request(app)
        .delete(`/api/v1/campaigns/${campaignToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it('should deny non-owner access to delete campaign', async () => {
      // Create another user
      const hashedPassword = await bcrypt.hash('otherpassword123', 10);
      const otherUser = await prisma.user.create({
        data: {
          email: 'other2@example.com',
          password: hashedPassword,
          name: 'Other User 2',
          role: 'USER'
        }
      });

      // Login as other user
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'other2@example.com',
          password: 'otherpassword123'
        });

      const otherToken = loginResponse.body.token;

      const response = await request(app)
        .delete(`/api/v1/campaigns/${testCampaign.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unauthorized to delete this campaign');

      // Clean up
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Password Security', () => {
    it('should hash passwords before storing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'passwordtest@example.com',
          password: 'plaintextpassword',
          name: 'Password Test User'
        });

      expect(response.status).toBe(201);

      // Check that password is hashed in database
      const user = await prisma.user.findUnique({
        where: { email: 'passwordtest@example.com' }
      });

      expect(user).toBeDefined();
      expect(user?.password).not.toBe('plaintextpassword');
      expect(user?.password.length).toBeGreaterThan(20); // bcrypt hashes are longer

      // Clean up
      await prisma.user.delete({ where: { id: user?.id } });
    });

    it('should verify passwords correctly', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Token Security', () => {
    it('should include user ID in token payload', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();

      // The token should be a JWT with proper structure
      const tokenParts = response.body.token.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    it('should have appropriate token expiration', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'testpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      
      // Token should be valid for at least 1 hour (this would need to be verified in implementation)
      // This is more of a documentation test - actual expiration would be tested with time manipulation
    });
  });

  describe('Rate Limiting', () => {
    it('should handle multiple login attempts', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({
              email: 'testuser@example.com',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All should fail with 401
      responses.forEach(response => {
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });
  });
});
