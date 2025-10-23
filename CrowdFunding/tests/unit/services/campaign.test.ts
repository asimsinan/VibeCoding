import { CampaignService } from '../../../src/lib/services/campaign';
import { CampaignCore } from '../../../src/lib/core/campaign';
import { CampaignRepository } from '../../../src/repositories/CampaignRepository';
import { Decimal } from '@prisma/client/runtime/library';

// Mock dependencies
jest.mock('../../../src/lib/core/campaign');
jest.mock('../../../src/repositories/CampaignRepository');

describe('CampaignService', () => {
  let campaignService: CampaignService;
  let mockCampaignCore: jest.Mocked<CampaignCore>;
  let mockCampaignRepository: jest.Mocked<CampaignRepository>;

  beforeEach(() => {
    mockCampaignCore = new CampaignCore() as jest.Mocked<CampaignCore>;
    mockCampaignRepository = new CampaignRepository({} as any) as jest.Mocked<CampaignRepository>;
    campaignService = new CampaignService(mockCampaignCore, mockCampaignRepository);
  });

  describe('createCampaign', () => {
    it('should create campaign successfully', async () => {
      const campaignData = {
        title: 'Test Campaign',
        description: 'Test description',
        goal: 10000,
        deadline: new Date('2024-12-31'),
        category: 'TECHNOLOGY' as any
      };

      mockCampaignCore.validateCampaignGoal.mockReturnValue(true);
      mockCampaignCore.validateCampaignDeadline.mockReturnValue(true);
      mockCampaignCore.generateCampaignSlug.mockReturnValue('test-campaign');
      mockCampaignRepository.create.mockResolvedValue({
        id: 'campaign-123',
        ...campaignData,
        goal: new Decimal(campaignData.goal),
        status: 'DRAFT',
        current: new Decimal(0),
        images: [],
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await campaignService.createCampaign(campaignData, 'user-123');

      expect(result.success).toBe(true);
      expect(result.campaign).toBeDefined();
      expect(mockCampaignCore.validateCampaignGoal).toHaveBeenCalledWith(10000);
      expect(mockCampaignCore.validateCampaignDeadline).toHaveBeenCalledWith(campaignData.deadline);
      expect(mockCampaignRepository.create).toHaveBeenCalled();
    });

    it('should fail for invalid goal', async () => {
      const campaignData = {
        title: 'Test Campaign',
        description: 'Test description',
        goal: -1000,
        deadline: new Date('2024-12-31'),
        category: 'TECHNOLOGY' as any
      };

      mockCampaignCore.validateCampaignGoal.mockReturnValue(false);

      const result = await campaignService.createCampaign(campaignData, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid campaign goal');
    });

    it('should fail for invalid deadline', async () => {
      const campaignData = {
        title: 'Test Campaign',
        description: 'Test description',
        goal: 10000,
        deadline: new Date('2023-01-01'), // Past date
        category: 'TECHNOLOGY' as any
      };

      mockCampaignCore.validateCampaignGoal.mockReturnValue(true);
      mockCampaignCore.validateCampaignDeadline.mockReturnValue(false);

      const result = await campaignService.createCampaign(campaignData, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid campaign deadline');
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign successfully', async () => {
      const campaignId = 'campaign-123';
      const updateData = {
        title: 'Updated Campaign',
        description: 'Updated description'
      };

      mockCampaignRepository.findById.mockResolvedValue({
        id: campaignId,
        title: 'Original Campaign',
        description: 'Original description',
        goal: new Decimal(10000),
        deadline: new Date('2024-12-31'),
        category: 'TECHNOLOGY' as any,
        status: 'ACTIVE',
        current: new Decimal(5000),
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockCampaignRepository.update.mockResolvedValue({
        id: campaignId,
        ...updateData,
        goal: new Decimal(10000),
        deadline: new Date('2024-12-31'),
        category: 'TECHNOLOGY' as any as any,
        status: 'ACTIVE' as any,
        current: new Decimal(5000),
        images: [],
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await campaignService.updateCampaign(campaignId, updateData, 'user-123');

      expect(result.success).toBe(true);
      expect(result.campaign).toBeDefined();
      expect(mockCampaignRepository.findById).toHaveBeenCalledWith(campaignId);
      expect(mockCampaignRepository.update).toHaveBeenCalledWith(campaignId, updateData, 'user-123');
    });

    it('should fail for non-existent campaign', async () => {
      const campaignId = 'non-existent';
      const updateData = { title: 'Updated Campaign' };

      mockCampaignRepository.findById.mockResolvedValue(null);

      const result = await campaignService.updateCampaign(campaignId, updateData, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Campaign not found');
    });

    it('should fail for unauthorized user', async () => {
      const campaignId = 'campaign-123';
      const updateData = { title: 'Updated Campaign' };

      mockCampaignRepository.findById.mockResolvedValue({
        id: campaignId,
        title: 'Original Campaign',
        description: 'Original description',
        goal: new Decimal(10000),
        deadline: new Date('2024-12-31'),
        category: 'TECHNOLOGY' as any,
        status: 'ACTIVE',
        current: new Decimal(5000),
        ownerId: 'user-456', // Different owner
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await campaignService.updateCampaign(campaignId, updateData, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized to update this campaign');
    });
  });

  describe('getCampaignStats', () => {
    it('should calculate campaign statistics', async () => {
      const campaignId = 'campaign-123';
      const campaign = {
        id: campaignId,
        title: 'Test Campaign',
        goal: new Decimal(10000),
        current: new Decimal(2500),
        deadline: new Date('2024-12-31'),
        status: 'ACTIVE'
      };

      const donations = [
        { amount: 100, donorId: 'user1' },
        { amount: 200, donorId: 'user2' },
        { amount: 150, donorId: 'user1' }
      ];

      mockCampaignRepository.findById.mockResolvedValue(campaign);
      mockCampaignRepository.getCampaignStats.mockResolvedValue({
        totalDonations: 3,
        uniqueDonors: 2,
        averageDonation: 150,
        progressPercentage: 25
      });

      mockCampaignCore.calculateProgress.mockReturnValue(25);
      mockCampaignCore.calculateDaysRemaining.mockReturnValue(15);
      mockCampaignCore.isCampaignActive.mockReturnValue(true);

      const result = await campaignService.getCampaignStats(campaignId);

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.progressPercentage).toBe(25);
      expect(result.stats.daysRemaining).toBe(15);
      expect(result.stats.isActive).toBe(true);
    });
  });

  describe('searchCampaigns', () => {
    it('should search campaigns with filters', async () => {
      const filters = {
        category: 'TECHNOLOGY' as any,
        status: 'ACTIVE',
        minGoal: 1000,
        maxGoal: 50000
      };

      const campaigns = [
        {
          id: 'campaign-1',
          title: 'Tech Campaign 1',
          category: 'TECHNOLOGY' as any,
          status: 'ACTIVE',
          goal: 10000
        },
        {
          id: 'campaign-2',
          title: 'Tech Campaign 2',
          category: 'TECHNOLOGY' as any,
          status: 'ACTIVE',
          goal: 20000
        }
      ];

      mockCampaignRepository.findAll.mockResolvedValue({
        campaigns: campaigns.map(c => ({
          id: c.id,
          title: c.title,
          description: 'Test description',
          goal: new Decimal(c.goal),
          current: new Decimal(0),
          deadline: new Date('2024-12-31'),
          category: c.category as any,
          images: [],
          status: c.status as any,
          ownerId: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        total: 2,
        page: 1,
        limit: 20
      });

      const result = await campaignService.searchCampaigns(filters, 1, 20);

      expect(result.success).toBe(true);
      expect(result.campaigns).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(mockCampaignRepository.findAll).toHaveBeenCalledWith({
        ...filters,
        page: 1,
        limit: 20
      });
    });
  });

  describe('activateCampaign', () => {
    it('should activate campaign successfully', async () => {
      const campaignId = 'campaign-123';
      const campaign = {
        id: campaignId,
        title: 'Test Campaign',
        status: 'DRAFT',
        goal: new Decimal(10000),
        deadline: new Date('2024-12-31'),
        ownerId: 'user-123'
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);
      mockCampaignCore.validateCampaignDeadline.mockReturnValue(true);
      mockCampaignRepository.updateStatus.mockResolvedValue({
        ...campaign,
        description: 'Test description',
        current: new Decimal(0),
        category: 'TECHNOLOGY' as any as any,
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'ACTIVE'
      });

      const result = await campaignService.activateCampaign(campaignId, 'user-123');

      expect(result.success).toBe(true);
      expect(result.campaign.status).toBe('ACTIVE');
    });

    it('should fail to activate expired campaign', async () => {
      const campaignId = 'campaign-123';
      const campaign = {
        id: campaignId,
        title: 'Test Campaign',
        status: 'DRAFT',
        goal: new Decimal(10000),
        deadline: new Date('2023-01-01'), // Past date
        ownerId: 'user-123'
      };

      mockCampaignRepository.findById.mockResolvedValue(campaign);
      mockCampaignCore.validateCampaignDeadline.mockReturnValue(false);

      const result = await campaignService.activateCampaign(campaignId, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Campaign deadline has passed');
    });
  });
});