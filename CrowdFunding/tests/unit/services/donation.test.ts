import { DonationService } from '../../../src/lib/services/donation';
import { DonationCore } from '../../../src/lib/core/donation';
import { DonationRepository } from '../../../src/repositories/DonationRepository';
import { CampaignRepository } from '../../../src/repositories/CampaignRepository';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies
jest.mock('../../../src/lib/core/donation');
jest.mock('../../../src/repositories/DonationRepository');
jest.mock('../../../src/repositories/CampaignRepository');

describe('DonationService', () => {
  let donationService: DonationService;
  let mockDonationCore: jest.Mocked<DonationCore>;
  let mockDonationRepository: jest.Mocked<DonationRepository>;
  let mockCampaignRepository: jest.Mocked<CampaignRepository>;

  beforeEach(() => {
    mockDonationCore = new DonationCore() as jest.Mocked<DonationCore>;
    mockDonationRepository = new DonationRepository({} as any) as jest.Mocked<DonationRepository>;
    mockCampaignRepository = new CampaignRepository({} as any) as jest.Mocked<CampaignRepository>;
    donationService = new DonationService(mockDonationCore, mockDonationRepository, mockCampaignRepository);
  });

  describe('processDonation', () => {
    it('should process donation successfully', async () => {
      const donationData = {
        amount: 100,
        campaignId: 'campaign-123',
        donorId: 'user-456',
        paymentMethod: 'CREDIT_CARD',
        message: 'Great project!'
      };

      const campaign = {
        id: 'campaign-123',
        title: 'Test Campaign',
        status: 'ACTIVE',
        goal: new Decimal(10000),
        current: new Decimal(5000),
        ownerId: 'user-123'
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);
      mockDonationCore.validateDonationAmount.mockReturnValue(true);
      mockDonationCore.validatePaymentMethod.mockReturnValue(true);
      mockDonationCore.processDonation.mockReturnValue({
        success: true,
        donationId: 'donation-123',
        fees: { platform: 5, processing: 2.9, total: 7.9 },
        netAmount: 92.1
      });

      mockDonationRepository.create.mockResolvedValue({
        id: 'donation-123',
        amount: new Decimal(100),
        campaignId: 'campaign-123',
        donorId: 'user-456',
        paymentMethod: 'CREDIT_CARD' as any,
        message: 'Great project!',
        status: 'PENDING' as any,
        isAnonymous: false,
        createdAt: new Date()
      });

      const result = await donationService.processDonation(donationData);

      expect(result.success).toBe(true);
      expect(result.donation).toBeDefined();
      expect(mockCampaignRepository.findById).toHaveBeenCalledWith('campaign-123');
      expect(mockDonationCore.validateDonationAmount).toHaveBeenCalledWith(100);
      expect(mockDonationCore.validatePaymentMethod).toHaveBeenCalledWith('CREDIT_CARD');
    });

    it('should fail for non-existent campaign', async () => {
      const donationData = {
        amount: 100,
        campaignId: 'non-existent',
        donorId: 'user-456',
        paymentMethod: 'CREDIT_CARD'
      };

      mockCampaignRepository.findById.mockResolvedValue(null);

      const result = await donationService.processDonation(donationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Campaign not found');
    });

    it('should fail for inactive campaign', async () => {
      const donationData = {
        amount: 100,
        campaignId: 'campaign-123',
        donorId: 'user-456',
        paymentMethod: 'CREDIT_CARD'
      };

      const campaign = {
        id: 'campaign-123',
        title: 'Test Campaign',
        status: 'COMPLETED', // Not active
        goal: new Decimal(10000),
        current: new Decimal(10000),
        ownerId: 'user-123'
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);

      const result = await donationService.processDonation(donationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Campaign is not active');
    });

    it('should fail for self-donation', async () => {
      const donationData = {
        amount: 100,
        campaignId: 'campaign-123',
        donorId: 'user-123', // Same as campaign owner
        paymentMethod: 'CREDIT_CARD'
      };

      const campaign = {
        id: 'campaign-123',
        title: 'Test Campaign',
        status: 'ACTIVE',
        goal: new Decimal(10000),
        current: new Decimal(5000),
        ownerId: 'user-123'
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);

      const result = await donationService.processDonation(donationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot donate to your own campaign');
    });

    it('should fail for invalid amount', async () => {
      const donationData = {
        amount: -100, // Invalid amount
        campaignId: 'campaign-123',
        donorId: 'user-456',
        paymentMethod: 'CREDIT_CARD'
      };

      const campaign = {
        id: 'campaign-123',
        title: 'Test Campaign',
        status: 'ACTIVE',
        goal: new Decimal(10000),
        current: new Decimal(5000),
        ownerId: 'user-123'
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);
      mockDonationCore.validateDonationAmount.mockReturnValue(false);

      const result = await donationService.processDonation(donationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid donation amount');
    });
  });

  describe('completeDonation', () => {
    it('should complete donation successfully', async () => {
      const donationId = 'donation-123';
      const donation = {
        id: donationId,
        amount: new Decimal(100),
        campaignId: 'campaign-123',
        donorId: 'user-456',
        paymentMethod: 'CREDIT_CARD' as any,
        status: 'PENDING' as any,
        isAnonymous: false,
        message: 'Great project!',
        createdAt: new Date()
      };

      mockDonationRepository.findById.mockResolvedValue(donation);
      mockDonationRepository.completeDonation.mockResolvedValue({
        ...donation,
        status: 'COMPLETED' as any
      });

      const result = await donationService.completeDonation(donationId);

      expect(result.success).toBe(true);
      expect(result.donation.status).toBe('COMPLETED');
      expect(mockDonationRepository.completeDonation).toHaveBeenCalledWith(donationId);
    });

    it('should fail for non-existent donation', async () => {
      const donationId = 'non-existent';

      mockDonationRepository.findById.mockResolvedValue(null);

      const result = await donationService.completeDonation(donationId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Donation not found');
    });
  });

  describe('getDonationHistory', () => {
    it('should get donation history for user', async () => {
      const userId = 'user-456';
      const donations = [
        {
          id: 'donation-1',
          amount: new Decimal(100),
          campaignId: 'campaign-1',
          donorId: userId,
          paymentMethod: 'CREDIT_CARD' as any,
          status: 'COMPLETED' as any,
          isAnonymous: false,
          message: 'Great project!',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'donation-2',
          amount: new Decimal(200),
          campaignId: 'campaign-2',
          donorId: userId,
          paymentMethod: 'CREDIT_CARD' as any,
          status: 'COMPLETED' as any,
          isAnonymous: false,
          message: 'Amazing!',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockDonationRepository.findByDonor.mockResolvedValue({
        donations,
        total: 2,
        page: 1,
        limit: 20
      });

      const result = await donationService.getDonationHistory(userId, 1, 20);

      expect(result.success).toBe(true);
      expect(result.donations).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(mockDonationRepository.findByDonor).toHaveBeenCalledWith(userId, 1, 20);
    });
  });

  describe('getCampaignDonations', () => {
    it('should get donations for campaign', async () => {
      const campaignId = 'campaign-123';
      const donations = [
        {
          id: 'donation-1',
          amount: new Decimal(100),
          campaignId,
          donorId: 'user-1',
          paymentMethod: 'CREDIT_CARD' as any,
          status: 'COMPLETED' as any,
          isAnonymous: false,
          message: 'Great!',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'donation-2',
          amount: new Decimal(200),
          campaignId,
          donorId: 'user-2',
          paymentMethod: 'CREDIT_CARD' as any,
          status: 'COMPLETED' as any,
          isAnonymous: false,
          message: 'Amazing!',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockDonationRepository.findByCampaign.mockResolvedValue({
        donations,
        total: 2,
        page: 1,
        limit: 20
      });

      const result = await donationService.getCampaignDonations(campaignId, 1, 20);

      expect(result.success).toBe(true);
      expect(result.donations).toHaveLength(2);
      expect(mockDonationRepository.findByCampaign).toHaveBeenCalledWith(campaignId, 1, 20);
    });
  });

  describe('refundDonation', () => {
    it('should refund donation successfully', async () => {
      const donationId = 'donation-123';
      const donation = {
        id: donationId,
        amount: new Decimal(100),
        campaignId: 'campaign-123',
        donorId: 'user-456',
        paymentMethod: 'CREDIT_CARD' as any,
        status: 'COMPLETED' as any,
        isAnonymous: false,
        message: 'Great project!',
        createdAt: new Date()
      };

      mockDonationRepository.findById.mockResolvedValue(donation);
      mockDonationRepository.refundDonation.mockResolvedValue({
        ...donation,
        status: 'REFUNDED' as any
      });

      const result = await donationService.refundDonation(donationId, 'admin-123');

      expect(result.success).toBe(true);
      expect(result.donation.status).toBe('REFUNDED');
      expect(mockDonationRepository.refundDonation).toHaveBeenCalledWith(donationId);
    });

    it('should fail to refund non-existent donation', async () => {
      const donationId = 'non-existent';

      mockDonationRepository.findById.mockResolvedValue(null);

      const result = await donationService.refundDonation(donationId, 'admin-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Donation not found');
    });
  });
});