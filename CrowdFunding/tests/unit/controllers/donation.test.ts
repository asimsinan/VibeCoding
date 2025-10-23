import request from 'supertest';
import app from '../../../src/app';
import { DonationService } from '../../../src/lib/services/donation';

// Mock services
jest.mock('../../../src/lib/services/donation');

describe('DonationController', () => {
  let mockDonationService: jest.Mocked<DonationService>;

  beforeEach(() => {
    mockDonationService = new DonationService({} as any, {} as any, {} as any) as jest.Mocked<DonationService>;
    (DonationService as jest.MockedClass<typeof DonationService>).mockImplementation(() => mockDonationService);
  });

  describe('POST /api/v1/campaigns/:id/donations', () => {
    it('should create donation successfully', async () => {
      const donationData = {
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        message: 'Great project!'
      };

      mockDonationService.processDonation.mockResolvedValue({
        success: true,
        donation: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          amount: 100,
          campaignId: '550e8400-e29b-41d4-a716-446655440000',
          donorId: 'user-456',
          paymentMethod: 'CREDIT_CARD',
          message: 'Great project!',
          status: 'PENDING',
          isAnonymous: false,
          createdAt: new Date()
        }
      });

      const response = await request(app)
        .post('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440000/donations')
        .set('Authorization', 'Bearer user-token')
        .send(donationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.donation).toBeDefined();
      expect(mockDonationService.processDonation).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: donationData.amount,
          campaignId: '550e8400-e29b-41d4-a716-446655440000',
          paymentMethod: donationData.paymentMethod,
          message: donationData.message
        })
      );
    });

    it('should return 400 for invalid donation data', async () => {
      const invalidData = {
        amount: -100, // Invalid negative amount
        paymentMethod: 'INVALID',
        message: 'Test message'
      };

      mockDonationService.processDonation.mockResolvedValue({
        success: false,
        error: 'Invalid donation amount'
      });

      const response = await request(app)
        .post('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440000/donations')
        .set('Authorization', 'Bearer user-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for unauthorized request', async () => {
      const donationData = {
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        message: 'Great project!'
      };

      const response = await request(app)
        .post('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440000/donations')
        .send(donationData);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent campaign', async () => {
      const donationData = {
        amount: 100,
        paymentMethod: 'CREDIT_CARD',
        message: 'Great project!'
      };

      mockDonationService.processDonation.mockResolvedValue({
        success: false,
        error: 'Campaign not found'
      });

      const response = await request(app)
        .post('/api/v1/campaigns/non-existent/donations')
        .set('Authorization', 'Bearer user-token')
        .send(donationData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/campaigns/:id/donations', () => {
    it('should get campaign donations', async () => {
      const donations = [
        {
          id: 'donation-1',
          amount: 100,
          campaignId: '550e8400-e29b-41d4-a716-446655440000',
          donorId: 'user-1',
          paymentMethod: 'CREDIT_CARD',
          message: 'Great!',
          status: 'COMPLETED',
          isAnonymous: false,
          createdAt: new Date()
        },
        {
          id: 'donation-2',
          amount: 200,
          campaignId: '550e8400-e29b-41d4-a716-446655440000',
          donorId: 'user-2',
          paymentMethod: 'CREDIT_CARD',
          message: 'Amazing!',
          status: 'COMPLETED',
          isAnonymous: false,
          createdAt: new Date()
        }
      ];

      mockDonationService.getCampaignDonations.mockResolvedValue({
        success: true,
        donations,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      });

      const response = await request(app)
        .get('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440000/donations')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.donations).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should return 400 for invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440000/donations')
        .query({ page: 0, limit: 0 });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/users/profile/donations', () => {
    it('should get user donation history', async () => {
      const donations = [
        {
          id: 'donation-1',
          amount: 100,
          campaignId: 'campaign-1',
          donorId: 'user-456',
          paymentMethod: 'CREDIT_CARD',
          message: 'Great project!',
          status: 'COMPLETED',
          isAnonymous: false,
          createdAt: new Date()
        },
        {
          id: 'donation-2',
          amount: 200,
          campaignId: 'campaign-2',
          donorId: 'user-456',
          paymentMethod: 'CREDIT_CARD',
          message: 'Amazing!',
          status: 'COMPLETED',
          isAnonymous: false,
          createdAt: new Date()
        }
      ];

      mockDonationService.getDonationHistory.mockResolvedValue({
        success: true,
        donations,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        }
      });

      const response = await request(app)
        .get('/api/v1/users/profile/donations')
        .set('Authorization', 'Bearer user-token')
        .query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.donations).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile/donations');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/donations/:id/complete', () => {
    it('should complete donation successfully', async () => {
      mockDonationService.completeDonation.mockResolvedValue({
        success: true,
        donation: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          amount: 100,
          campaignId: '550e8400-e29b-41d4-a716-446655440000',
          donorId: 'user-456',
          paymentMethod: 'CREDIT_CARD',
          message: 'Great project!',
          status: 'COMPLETED',
          isAnonymous: false,
          createdAt: new Date()
        }
      });

      const response = await request(app)
        .post('/api/v1/donations/550e8400-e29b-41d4-a716-446655440001/complete')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.donation.status).toBe('COMPLETED');
    });

    it('should return 404 for non-existent donation', async () => {
      mockDonationService.completeDonation.mockResolvedValue({
        success: false,
        error: 'Donation not found'
      });

      const response = await request(app)
        .post('/api/v1/donations/non-existent/complete')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/donations/:id/refund', () => {
    it('should refund donation successfully', async () => {
      mockDonationService.refundDonation.mockResolvedValue({
        success: true,
        donation: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          amount: 100,
          campaignId: '550e8400-e29b-41d4-a716-446655440000',
          donorId: 'user-456',
          paymentMethod: 'CREDIT_CARD',
          message: 'Great project!',
          status: 'REFUNDED',
          isAnonymous: false,
          createdAt: new Date()
        }
      });

      const response = await request(app)
        .post('/api/v1/donations/550e8400-e29b-41d4-a716-446655440001/refund')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.donation.status).toBe('REFUNDED');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post('/api/v1/donations/550e8400-e29b-41d4-a716-446655440001/refund')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
    });
  });
});
