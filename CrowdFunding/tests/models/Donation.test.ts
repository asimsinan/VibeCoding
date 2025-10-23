import { PrismaClient, DonationStatus, PaymentMethod } from '@prisma/client';
import { DonationModel, CreateDonationDto } from '../../src/models/Donation';

// Mock Prisma client
const mockPrisma = {
  donation: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  campaign: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  }
} as any;

describe('DonationModel', () => {
  let donationModel: DonationModel;

  beforeEach(() => {
    donationModel = new DonationModel(mockPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a donation with valid data', async () => {
      const donationData: CreateDonationDto = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        isAnonymous: false,
        message: 'Great project!'
      };

      const campaignId = 'campaign-id';
      const donorId = 'donor-id';

      const campaign = {
        id: campaignId,
        status: 'ACTIVE',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ownerId: 'different-user-id'
      };

      const donor = {
        id: donorId,
        email: 'donor@example.com',
        name: 'Donor Name'
      };

      const expectedDonation = {
        id: 'donation-id',
        amount: donationData.amount,
        campaignId: campaignId,
        donorId: donorId,
        paymentMethod: donationData.paymentMethod,
        status: DonationStatus.PENDING,
        isAnonymous: donationData.isAnonymous,
        message: donationData.message,
        createdAt: new Date()
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(campaign);
      mockPrisma.user.findUnique.mockResolvedValue(donor);
      mockPrisma.donation.create.mockResolvedValue(expectedDonation);

      const result = await donationModel.create(donationData, campaignId, donorId);

      expect(mockPrisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: campaignId }
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: donorId }
      });
      expect(mockPrisma.donation.create).toHaveBeenCalledWith({
        data: {
          amount: donationData.amount,
          campaignId: campaignId,
          donorId: donorId,
          paymentMethod: donationData.paymentMethod,
          status: DonationStatus.PENDING,
          isAnonymous: donationData.isAnonymous,
          message: donationData.message
        },
        include: {
          campaign: true,
          donor: true
        }
      });
      expect(result).toEqual(expectedDonation);
    });

    it('should throw error if campaign not found', async () => {
      const donationData: CreateDonationDto = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const campaignId = 'non-existent-id';
      const donorId = 'donor-id';

      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(donationModel.create(donationData, campaignId, donorId)).rejects.toThrow('Campaign not found');
    });

    it('should throw error if campaign is not active', async () => {
      const donationData: CreateDonationDto = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const campaignId = 'campaign-id';
      const donorId = 'donor-id';

      const campaign = {
        id: campaignId,
        status: 'DRAFT'
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(campaign);

      await expect(donationModel.create(donationData, campaignId, donorId)).rejects.toThrow('Campaign is not active');
    });

    it('should throw error if campaign deadline has passed', async () => {
      const donationData: CreateDonationDto = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const campaignId = 'campaign-id';
      const donorId = 'donor-id';

      const campaign = {
        id: campaignId,
        status: 'ACTIVE',
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(campaign);

      await expect(donationModel.create(donationData, campaignId, donorId)).rejects.toThrow('Campaign deadline has passed');
    });

    it('should throw error if donor not found', async () => {
      const donationData: CreateDonationDto = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const campaignId = 'campaign-id';
      const donorId = 'non-existent-id';

      const campaign = {
        id: campaignId,
        status: 'ACTIVE',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(campaign);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(donationModel.create(donationData, campaignId, donorId)).rejects.toThrow('Donor not found');
    });

    it('should throw error if campaign owner tries to donate to own campaign', async () => {
      const donationData: CreateDonationDto = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const campaignId = 'campaign-id';
      const donorId = 'owner-id';

      const campaign = {
        id: campaignId,
        status: 'ACTIVE',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ownerId: donorId
      };

      const donor = {
        id: donorId,
        email: 'owner@example.com',
        name: 'Owner Name'
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(campaign);
      mockPrisma.user.findUnique.mockResolvedValue(donor);

      await expect(donationModel.create(donationData, campaignId, donorId)).rejects.toThrow('Campaign owners cannot donate to their own campaigns');
    });

    it('should use default values for optional fields', async () => {
      const donationData: CreateDonationDto = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const campaignId = 'campaign-id';
      const donorId = 'donor-id';

      const campaign = {
        id: campaignId,
        status: 'ACTIVE',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ownerId: 'different-user-id'
      };

      const donor = {
        id: donorId,
        email: 'donor@example.com',
        name: 'Donor Name'
      };

      const expectedDonation = {
        id: 'donation-id',
        amount: donationData.amount,
        campaignId: campaignId,
        donorId: donorId,
        paymentMethod: donationData.paymentMethod,
        status: DonationStatus.PENDING,
        isAnonymous: false,
        message: null,
        createdAt: new Date()
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(campaign);
      mockPrisma.user.findUnique.mockResolvedValue(donor);
      mockPrisma.donation.create.mockResolvedValue(expectedDonation);

      await donationModel.create(donationData, campaignId, donorId);

      expect(mockPrisma.donation.create).toHaveBeenCalledWith({
        data: {
          amount: donationData.amount,
          campaignId: campaignId,
          donorId: donorId,
          paymentMethod: donationData.paymentMethod,
          status: DonationStatus.PENDING,
          isAnonymous: false,
          message: null
        },
        include: {
          campaign: true,
          donor: true
        }
      });
    });
  });

  describe('findById', () => {
    it('should return donation with relations when found', async () => {
      const donationId = 'donation-id';
      const expectedDonation = {
        id: donationId,
        amount: 100,
        campaignId: 'campaign-id',
        donorId: 'donor-id',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: DonationStatus.PENDING,
        campaign: { id: 'campaign-id', title: 'Test Campaign' },
        donor: { id: 'donor-id', name: 'Donor Name' },
        payment: null
      };

      mockPrisma.donation.findUnique.mockResolvedValue(expectedDonation);

      const result = await donationModel.findById(donationId);

      expect(mockPrisma.donation.findUnique).toHaveBeenCalledWith({
        where: { id: donationId },
        include: {
          campaign: true,
          donor: true,
          payment: true
        }
      });
      expect(result).toEqual(expectedDonation);
    });

    it('should return null when donation not found', async () => {
      const donationId = 'non-existent-id';

      mockPrisma.donation.findUnique.mockResolvedValue(null);

      const result = await donationModel.findById(donationId);

      expect(result).toBeNull();
    });
  });

  describe('findByCampaign', () => {
    it('should return paginated donations for campaign', async () => {
      const campaignId = 'campaign-id';
      const page = 2;
      const limit = 10;

      const donations = [
        { id: 'donation-1', amount: 100, donor: { id: 'donor-1', name: 'Donor 1' } },
        { id: 'donation-2', amount: 200, donor: { id: 'donor-2', name: 'Donor 2' } }
      ];
      const total = 25;

      mockPrisma.donation.findMany.mockResolvedValue(donations);
      mockPrisma.donation.count.mockResolvedValue(total);

      const result = await donationModel.findByCampaign(campaignId, page, limit);

      expect(mockPrisma.donation.findMany).toHaveBeenCalledWith({
        where: { campaignId },
        skip: 10, // (page - 1) * limit
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          donor: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });
      expect(result).toEqual({ donations, total });
    });

    it('should use default pagination values', async () => {
      const campaignId = 'campaign-id';
      const donations = [];
      const total = 0;

      mockPrisma.donation.findMany.mockResolvedValue(donations);
      mockPrisma.donation.count.mockResolvedValue(total);

      const result = await donationModel.findByCampaign(campaignId);

      expect(mockPrisma.donation.findMany).toHaveBeenCalledWith({
        where: { campaignId },
        skip: 0, // (1 - 1) * 20
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          donor: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });
      expect(result).toEqual({ donations, total });
    });
  });

  describe('findByDonor', () => {
    it('should return paginated donations by donor', async () => {
      const donorId = 'donor-id';
      const page = 1;
      const limit = 5;

      const donations = [
        { id: 'donation-1', amount: 100, campaign: { id: 'campaign-1', title: 'Campaign 1' } },
        { id: 'donation-2', amount: 200, campaign: { id: 'campaign-2', title: 'Campaign 2' } }
      ];
      const total = 10;

      mockPrisma.donation.findMany.mockResolvedValue(donations);
      mockPrisma.donation.count.mockResolvedValue(total);

      const result = await donationModel.findByDonor(donorId, page, limit);

      expect(mockPrisma.donation.findMany).toHaveBeenCalledWith({
        where: { donorId },
        skip: 0, // (page - 1) * limit
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
              category: true,
              status: true
            }
          }
        }
      });
      expect(result).toEqual({ donations, total });
    });
  });

  describe('updateStatus', () => {
    it('should update donation status', async () => {
      const donationId = 'donation-id';
      const newStatus = DonationStatus.COMPLETED;

      const existingDonation = {
        id: donationId,
        amount: 100,
        status: DonationStatus.PENDING
      };

      const updatedDonation = {
        ...existingDonation,
        status: newStatus
      };

      mockPrisma.donation.findUnique.mockResolvedValue(existingDonation);
      mockPrisma.donation.update.mockResolvedValue(updatedDonation);

      const result = await donationModel.updateStatus(donationId, newStatus);

      expect(mockPrisma.donation.update).toHaveBeenCalledWith({
        where: { id: donationId },
        data: { status: newStatus }
      });
      expect(result).toEqual(updatedDonation);
    });

    it('should throw error if donation not found', async () => {
      const donationId = 'non-existent-id';
      const newStatus = DonationStatus.COMPLETED;

      mockPrisma.donation.findUnique.mockResolvedValue(null);

      await expect(donationModel.updateStatus(donationId, newStatus)).rejects.toThrow('Donation not found');
    });
  });

  describe('completeDonation', () => {
    it('should complete donation and update campaign', async () => {
      const donationId = 'donation-id';

      const existingDonation = {
        id: donationId,
        amount: 100,
        campaignId: 'campaign-id',
        status: DonationStatus.PENDING
      };

      const updatedDonation = {
        ...existingDonation,
        status: DonationStatus.COMPLETED
      };

      mockPrisma.donation.findUnique.mockResolvedValue(existingDonation);
      mockPrisma.donation.update.mockResolvedValue(updatedDonation);
      mockPrisma.campaign.update.mockResolvedValue({});

      const result = await donationModel.completeDonation(donationId);

      expect(mockPrisma.donation.update).toHaveBeenCalledWith({
        where: { id: donationId },
        data: { status: DonationStatus.COMPLETED }
      });
      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-id' },
        data: {
          current: {
            increment: 100
          }
        }
      });
      expect(result).toEqual(updatedDonation);
    });

    it('should throw error if donation is not pending', async () => {
      const donationId = 'donation-id';

      const existingDonation = {
        id: donationId,
        amount: 100,
        campaignId: 'campaign-id',
        status: DonationStatus.COMPLETED
      };

      mockPrisma.donation.findUnique.mockResolvedValue(existingDonation);

      await expect(donationModel.completeDonation(donationId)).rejects.toThrow('Donation is not in pending status');
    });
  });

  describe('refundDonation', () => {
    it('should refund completed donation and update campaign', async () => {
      const donationId = 'donation-id';

      const existingDonation = {
        id: donationId,
        amount: 100,
        campaignId: 'campaign-id',
        status: DonationStatus.COMPLETED
      };

      const refundedDonation = {
        ...existingDonation,
        status: DonationStatus.REFUNDED
      };

      mockPrisma.donation.findUnique.mockResolvedValue(existingDonation);
      mockPrisma.donation.update.mockResolvedValue(refundedDonation);
      mockPrisma.campaign.update.mockResolvedValue({});

      const result = await donationModel.refundDonation(donationId);

      expect(mockPrisma.donation.update).toHaveBeenCalledWith({
        where: { id: donationId },
        data: { status: DonationStatus.REFUNDED }
      });
      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'campaign-id' },
        data: {
          current: {
            decrement: 100
          }
        }
      });
      expect(result).toEqual(refundedDonation);
    });

    it('should throw error if donation is not completed', async () => {
      const donationId = 'donation-id';

      const existingDonation = {
        id: donationId,
        amount: 100,
        campaignId: 'campaign-id',
        status: DonationStatus.PENDING
      };

      mockPrisma.donation.findUnique.mockResolvedValue(existingDonation);

      await expect(donationModel.refundDonation(donationId)).rejects.toThrow('Only completed donations can be refunded');
    });
  });

  describe('getDonationStats', () => {
    it('should return donation statistics', async () => {
      const campaignId = 'campaign-id';
      const donorId = 'donor-id';

      const totalAmount = { _sum: { amount: 1000 } };
      const totalCount = 10;
      const averageAmount = { _avg: { amount: 100 } };
      const topDonors = [
        { donorId: 'donor-1', _sum: { amount: 500 }, _count: { donorId: 5 } },
        { donorId: 'donor-2', _sum: { amount: 300 }, _count: { donorId: 3 } }
      ];

      mockPrisma.donation.aggregate.mockResolvedValueOnce(totalAmount);
      mockPrisma.donation.count.mockResolvedValue(totalCount);
      mockPrisma.donation.aggregate.mockResolvedValueOnce(averageAmount);
      mockPrisma.donation.groupBy.mockResolvedValue(topDonors);

      const result = await donationModel.getDonationStats(campaignId, donorId);

      expect(result).toEqual({
        totalAmount: 1000,
        totalCount: 10,
        averageAmount: 100,
        topDonors: [
          { donorId: 'donor-1', totalAmount: 500, count: 5 },
          { donorId: 'donor-2', totalAmount: 300, count: 3 }
        ]
      });
    });

    it('should handle zero values in aggregates', async () => {
      const totalAmount = { _sum: { amount: null } };
      const totalCount = 0;
      const averageAmount = { _avg: { amount: null } };
      const topDonors = [];

      mockPrisma.donation.aggregate.mockResolvedValueOnce(totalAmount);
      mockPrisma.donation.count.mockResolvedValue(totalCount);
      mockPrisma.donation.aggregate.mockResolvedValueOnce(averageAmount);
      mockPrisma.donation.groupBy.mockResolvedValue(topDonors);

      const result = await donationModel.getDonationStats();

      expect(result).toEqual({
        totalAmount: 0,
        totalCount: 0,
        averageAmount: 0,
        topDonors: []
      });
    });
  });

  describe('delete', () => {
    it('should delete donation when found', async () => {
      const donationId = 'donation-id';

      const existingDonation = {
        id: donationId,
        amount: 100,
        campaignId: 'campaign-id'
      };

      mockPrisma.donation.findUnique.mockResolvedValue(existingDonation);
      mockPrisma.donation.delete.mockResolvedValue(existingDonation);

      await donationModel.delete(donationId);

      expect(mockPrisma.donation.findUnique).toHaveBeenCalledWith({
        where: { id: donationId },
        include: {
          campaign: true,
          donor: true,
          payment: true
        }
      });
      expect(mockPrisma.donation.delete).toHaveBeenCalledWith({
        where: { id: donationId }
      });
    });

    it('should throw error if donation not found', async () => {
      const donationId = 'non-existent-id';

      mockPrisma.donation.findUnique.mockResolvedValue(null);

      await expect(donationModel.delete(donationId)).rejects.toThrow('Donation not found');
    });
  });
});
