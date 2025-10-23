import { PrismaClient, CampaignCategory, CampaignStatus } from '@prisma/client';
import { CampaignModel, CreateCampaignDto, UpdateCampaignDto } from '../../src/models/Campaign';

// Mock Prisma client
const mockPrisma = {
  campaign: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  },
  donation: {
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn()
  }
} as any;

describe('CampaignModel', () => {
  let campaignModel: CampaignModel;

  beforeEach(() => {
    campaignModel = new CampaignModel(mockPrisma);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a campaign with valid data', async () => {
      const campaignData: CreateCampaignDto = {
        title: 'Test Campaign',
        description: 'This is a test campaign',
        goal: 10000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: CampaignCategory.TECHNOLOGY,
        images: ['https://example.com/image.jpg']
      };

      const ownerId = 'owner-id';
      const expectedCampaign = {
        id: 'campaign-id',
        title: campaignData.title,
        description: campaignData.description,
        goal: campaignData.goal,
        deadline: new Date(campaignData.deadline),
        category: campaignData.category,
        images: campaignData.images,
        ownerId: ownerId,
        status: CampaignStatus.DRAFT,
        current: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.campaign.create.mockResolvedValue(expectedCampaign);

      const result = await campaignModel.create(campaignData, ownerId);

      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: {
          title: campaignData.title,
          description: campaignData.description,
          goal: campaignData.goal,
          deadline: new Date(campaignData.deadline),
          category: campaignData.category,
          images: campaignData.images,
          ownerId: ownerId,
          status: CampaignStatus.DRAFT
        }
      });
      expect(result).toEqual(expectedCampaign);
    });

    it('should throw error if deadline is in the past', async () => {
      const campaignData: CreateCampaignDto = {
        title: 'Test Campaign',
        description: 'This is a test campaign',
        goal: 10000,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        category: CampaignCategory.TECHNOLOGY
      };

      const ownerId = 'owner-id';

      await expect(campaignModel.create(campaignData, ownerId)).rejects.toThrow('Campaign deadline must be in the future');
    });

    it('should use default empty array for images', async () => {
      const campaignData: CreateCampaignDto = {
        title: 'Test Campaign',
        description: 'This is a test campaign',
        goal: 10000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: CampaignCategory.TECHNOLOGY
      };

      const ownerId = 'owner-id';
      const expectedCampaign = {
        id: 'campaign-id',
        title: campaignData.title,
        description: campaignData.description,
        goal: campaignData.goal,
        deadline: new Date(campaignData.deadline),
        category: campaignData.category,
        images: [],
        ownerId: ownerId,
        status: CampaignStatus.DRAFT,
        current: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.campaign.create.mockResolvedValue(expectedCampaign);

      await campaignModel.create(campaignData, ownerId);

      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: {
          title: campaignData.title,
          description: campaignData.description,
          goal: campaignData.goal,
          deadline: new Date(campaignData.deadline),
          category: campaignData.category,
          images: [],
          ownerId: ownerId,
          status: CampaignStatus.DRAFT
        }
      });
    });
  });

  describe('findById', () => {
    it('should return campaign with relations when found', async () => {
      const campaignId = 'campaign-id';
      const expectedCampaign = {
        id: campaignId,
        title: 'Test Campaign',
        description: 'Test description',
        goal: 10000,
        current: 5000,
        deadline: new Date(),
        category: CampaignCategory.TECHNOLOGY,
        status: CampaignStatus.ACTIVE,
        ownerId: 'owner-id',
        owner: { id: 'owner-id', name: 'Owner Name' },
        donations: [],
        comments: []
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(expectedCampaign);

      const result = await campaignModel.findById(campaignId);

      expect(mockPrisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: campaignId },
        include: {
          owner: true,
          donations: {
            include: { donor: true }
          },
          comments: {
            include: { author: true },
            where: { isDeleted: false }
          }
        }
      });
      expect(result).toEqual(expectedCampaign);
    });

    it('should return null when campaign not found', async () => {
      const campaignId = 'non-existent-id';

      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      const result = await campaignModel.findById(campaignId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update campaign when user is owner', async () => {
      const campaignId = 'campaign-id';
      const userId = 'owner-id';
      const updateData: UpdateCampaignDto = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const existingCampaign = {
        id: campaignId,
        title: 'Original Title',
        description: 'Original description',
        ownerId: userId
      };

      const updatedCampaign = {
        ...existingCampaign,
        ...updateData,
        updatedAt: new Date()
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'USER' });
      mockPrisma.campaign.update.mockResolvedValue(updatedCampaign);

      const result = await campaignModel.update(campaignId, updateData, userId);

      expect(mockPrisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: campaignId },
        include: {
          owner: true,
          donations: {
            include: { donor: true }
          },
          comments: {
            include: { author: true },
            where: { isDeleted: false }
          }
        }
      });
      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: campaignId },
        data: updateData
      });
      expect(result).toEqual(updatedCampaign);
    });

    it('should allow admin to update any campaign', async () => {
      const campaignId = 'campaign-id';
      const adminId = 'admin-id';
      const updateData: UpdateCampaignDto = {
        title: 'Updated Title'
      };

      const existingCampaign = {
        id: campaignId,
        title: 'Original Title',
        ownerId: 'different-user-id'
      };

      const updatedCampaign = {
        ...existingCampaign,
        ...updateData
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockPrisma.user.findUnique.mockResolvedValue({ id: adminId, role: 'ADMIN' });
      mockPrisma.campaign.update.mockResolvedValue(updatedCampaign);

      const result = await campaignModel.update(campaignId, updateData, adminId);

      expect(result).toEqual(updatedCampaign);
    });

    it('should throw error if user is not owner or admin', async () => {
      const campaignId = 'campaign-id';
      const userId = 'unauthorized-user-id';
      const updateData: UpdateCampaignDto = {
        title: 'Updated Title'
      };

      const existingCampaign = {
        id: campaignId,
        title: 'Original Title',
        ownerId: 'different-user-id'
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'USER' });

      await expect(campaignModel.update(campaignId, updateData, userId)).rejects.toThrow('Unauthorized to update this campaign');
    });

    it('should throw error if campaign not found', async () => {
      const campaignId = 'non-existent-id';
      const userId = 'user-id';
      const updateData: UpdateCampaignDto = {
        title: 'Updated Title'
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(campaignModel.update(campaignId, updateData, userId)).rejects.toThrow('Campaign not found');
    });

    it('should validate deadline is in the future', async () => {
      const campaignId = 'campaign-id';
      const userId = 'owner-id';
      const updateData: UpdateCampaignDto = {
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Yesterday
      };

      const existingCampaign = {
        id: campaignId,
        ownerId: userId
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'USER' });

      await expect(campaignModel.update(campaignId, updateData, userId)).rejects.toThrow('Campaign deadline must be in the future');
    });
  });

  describe('delete', () => {
    it('should delete campaign when user is owner', async () => {
      const campaignId = 'campaign-id';
      const userId = 'owner-id';

      const existingCampaign = {
        id: campaignId,
        ownerId: userId
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'USER' });
      mockPrisma.campaign.delete.mockResolvedValue(existingCampaign);

      await campaignModel.delete(campaignId, userId);

      expect(mockPrisma.campaign.delete).toHaveBeenCalledWith({
        where: { id: campaignId }
      });
    });

    it('should allow admin to delete any campaign', async () => {
      const campaignId = 'campaign-id';
      const adminId = 'admin-id';

      const existingCampaign = {
        id: campaignId,
        ownerId: 'different-user-id'
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockPrisma.user.findUnique.mockResolvedValue({ id: adminId, role: 'ADMIN' });
      mockPrisma.campaign.delete.mockResolvedValue(existingCampaign);

      await campaignModel.delete(campaignId, adminId);

      expect(mockPrisma.campaign.delete).toHaveBeenCalledWith({
        where: { id: campaignId }
      });
    });

    it('should throw error if user is not owner or admin', async () => {
      const campaignId = 'campaign-id';
      const userId = 'unauthorized-user-id';

      const existingCampaign = {
        id: campaignId,
        ownerId: 'different-user-id'
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'USER' });

      await expect(campaignModel.delete(campaignId, userId)).rejects.toThrow('Unauthorized to delete this campaign');
    });
  });

  describe('findAll', () => {
    it('should return campaigns with filters', async () => {
      const filters = {
        page: 2,
        limit: 10,
        category: CampaignCategory.TECHNOLOGY,
        status: CampaignStatus.ACTIVE,
        search: 'test'
      };

      const campaigns = [
        { id: 'campaign-1', title: 'Test Campaign 1', category: CampaignCategory.TECHNOLOGY },
        { id: 'campaign-2', title: 'Test Campaign 2', category: CampaignCategory.TECHNOLOGY }
      ];
      const total = 25;

      mockPrisma.campaign.findMany.mockResolvedValue(campaigns);
      mockPrisma.campaign.count.mockResolvedValue(total);

      const result = await campaignModel.findAll(filters);

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith({
        where: {
          category: CampaignCategory.TECHNOLOGY,
          status: CampaignStatus.ACTIVE,
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } }
          ]
        },
        skip: 10, // (page - 1) * limit
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: true,
          _count: {
            select: {
              donations: true,
              comments: true
            }
          }
        }
      });
      expect(result).toEqual({ campaigns, total });
    });

    it('should use default values when no filters provided', async () => {
      const campaigns = [];
      const total = 0;

      mockPrisma.campaign.findMany.mockResolvedValue(campaigns);
      mockPrisma.campaign.count.mockResolvedValue(total);

      const result = await campaignModel.findAll();

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0, // (1 - 1) * 20
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: true,
          _count: {
            select: {
              donations: true,
              comments: true
            }
          }
        }
      });
      expect(result).toEqual({ campaigns, total });
    });
  });

  describe('activate', () => {
    it('should activate draft campaign', async () => {
      const campaignId = 'campaign-id';
      const userId = 'owner-id';

      const existingCampaign = {
        id: campaignId,
        ownerId: userId,
        status: CampaignStatus.DRAFT
      };

      const activatedCampaign = {
        ...existingCampaign,
        status: CampaignStatus.ACTIVE
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockPrisma.campaign.update.mockResolvedValue(activatedCampaign);

      const result = await campaignModel.activate(campaignId, userId);

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: campaignId },
        data: { status: CampaignStatus.ACTIVE }
      });
      expect(result).toEqual(activatedCampaign);
    });

    it('should throw error if user is not owner', async () => {
      const campaignId = 'campaign-id';
      const userId = 'unauthorized-user-id';

      const existingCampaign = {
        id: campaignId,
        ownerId: 'different-user-id',
        status: CampaignStatus.DRAFT
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);

      await expect(campaignModel.activate(campaignId, userId)).rejects.toThrow('Unauthorized to activate this campaign');
    });

    it('should throw error if campaign is not draft', async () => {
      const campaignId = 'campaign-id';
      const userId = 'owner-id';

      const existingCampaign = {
        id: campaignId,
        ownerId: userId,
        status: CampaignStatus.ACTIVE
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);

      await expect(campaignModel.activate(campaignId, userId)).rejects.toThrow('Only draft campaigns can be activated');
    });
  });

  describe('updateStatus', () => {
    it('should update campaign status when user is admin', async () => {
      const campaignId = 'campaign-id';
      const adminId = 'admin-id';
      const newStatus = CampaignStatus.SUSPENDED;

      const updatedCampaign = {
        id: campaignId,
        status: newStatus
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: adminId, role: 'ADMIN' });
      mockPrisma.campaign.update.mockResolvedValue(updatedCampaign);

      const result = await campaignModel.updateStatus(campaignId, newStatus, adminId);

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: campaignId },
        data: { status: newStatus }
      });
      expect(result).toEqual(updatedCampaign);
    });

    it('should throw error if user is not admin', async () => {
      const campaignId = 'campaign-id';
      const userId = 'user-id';
      const newStatus = CampaignStatus.SUSPENDED;

      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'USER' });

      await expect(campaignModel.updateStatus(campaignId, newStatus, userId)).rejects.toThrow('Unauthorized to update campaign status');
    });
  });

  describe('addDonation', () => {
    it('should add donation to active campaign', async () => {
      const campaignId = 'campaign-id';
      const amount = 100;

      const existingCampaign = {
        id: campaignId,
        current: 500,
        goal: 1000,
        status: CampaignStatus.ACTIVE
      };

      const updatedCampaign = {
        ...existingCampaign,
        current: 600
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockPrisma.campaign.update.mockResolvedValue(updatedCampaign);

      const result = await campaignModel.addDonation(campaignId, amount);

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: campaignId },
        data: {
          current: 600,
          status: CampaignStatus.ACTIVE
        }
      });
      expect(result).toEqual(updatedCampaign);
    });

    it('should complete campaign when goal is reached', async () => {
      const campaignId = 'campaign-id';
      const amount = 500;

      const existingCampaign = {
        id: campaignId,
        current: 500,
        goal: 1000,
        status: CampaignStatus.ACTIVE
      };

      const updatedCampaign = {
        ...existingCampaign,
        current: 1000,
        status: CampaignStatus.COMPLETED
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockPrisma.campaign.update.mockResolvedValue(updatedCampaign);

      const result = await campaignModel.addDonation(campaignId, amount);

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: campaignId },
        data: {
          current: 1000,
          status: CampaignStatus.COMPLETED
        }
      });
      expect(result).toEqual(updatedCampaign);
    });

    it('should throw error if campaign is not active', async () => {
      const campaignId = 'campaign-id';
      const amount = 100;

      const existingCampaign = {
        id: campaignId,
        status: CampaignStatus.DRAFT
      };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);

      await expect(campaignModel.addDonation(campaignId, amount)).rejects.toThrow('Campaign is not active');
    });
  });

  describe('getCampaignStats', () => {
    it('should return campaign statistics', async () => {
      const campaignId = 'campaign-id';
      const existingCampaign = {
        id: campaignId,
        current: 500,
        goal: 1000
      };

      const totalDonations = 10;
      const uniqueDonors = 5;
      const averageDonation = { _avg: { amount: 50 } };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockPrisma.donation.count.mockResolvedValue(totalDonations);
      mockPrisma.donation.groupBy.mockResolvedValue([{ donorId: 'donor-1' }, { donorId: 'donor-2' }]);
      mockPrisma.donation.aggregate.mockResolvedValue(averageDonation);

      const result = await campaignModel.getCampaignStats(campaignId);

      expect(result).toEqual({
        totalDonations: 10,
        uniqueDonors: 2,
        averageDonation: 50,
        progressPercentage: 50
      });
    });

    it('should handle zero donations', async () => {
      const campaignId = 'campaign-id';
      const existingCampaign = {
        id: campaignId,
        current: 0,
        goal: 1000
      };

      const totalDonations = 0;
      const averageDonation = { _avg: { amount: null } };

      mockPrisma.campaign.findUnique.mockResolvedValue(existingCampaign);
      mockPrisma.donation.count.mockResolvedValue(totalDonations);
      mockPrisma.donation.groupBy.mockResolvedValue([]);
      mockPrisma.donation.aggregate.mockResolvedValue(averageDonation);

      const result = await campaignModel.getCampaignStats(campaignId);

      expect(result).toEqual({
        totalDonations: 0,
        uniqueDonors: 0,
        averageDonation: 0,
        progressPercentage: 0
      });
    });

    it('should throw error if campaign not found', async () => {
      const campaignId = 'non-existent-id';

      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(campaignModel.getCampaignStats(campaignId)).rejects.toThrow('Campaign not found');
    });
  });
});
