import { PrismaClient } from '@prisma/client';
import { CampaignRepository } from '../../src/repositories/CampaignRepository';
import { DonationRepository } from '../../src/repositories/DonationRepository';
import { CampaignCategory, CampaignStatus, PaymentMethod } from '@prisma/client';

describe('CampaignRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let campaignRepository: CampaignRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    campaignRepository = new CampaignRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.donation.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('create', () => {
    it('should create a campaign in the database', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Test Campaign',
        description: 'This is a test campaign',
        goal: 10000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY,
        images: ['https://example.com/image.jpg']
      };

      const campaign = await campaignRepository.create(campaignData, user.id);

      expect(campaign).toMatchObject({
        title: campaignData.title,
        description: campaignData.description,
        goal: campaignData.goal,
        category: campaignData.category,
        images: campaignData.images,
        ownerId: user.id,
        status: CampaignStatus.DRAFT,
        current: 0
      });
      expect(campaign.id).toBeDefined();
      expect(campaign.createdAt).toBeDefined();
      expect(campaign.updatedAt).toBeDefined();

      // Verify campaign exists in database
      const dbCampaign = await prisma.campaign.findUnique({
        where: { id: campaign.id }
      });
      expect(dbCampaign?.goal.toString()).toBe(campaignData.goal.toString());
      expect(dbCampaign?.current.toString()).toBe("0");
    });

    it('should throw error if deadline is in the past', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Test Campaign',
        description: 'This is a test campaign',
        goal: 10000,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        category: CampaignCategory.TECHNOLOGY
      };

      await expect(campaignRepository.create(campaignData, user.id)).rejects.toThrow('Campaign deadline must be in the future');
    });
  });

  describe('findById', () => {
    it('should find campaign by ID with relations', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Find Campaign',
        description: 'Campaign to find',
        goal: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.ART
      };

      const createdCampaign = await campaignRepository.create(campaignData, user.id);
      const foundCampaign = await campaignRepository.findById(createdCampaign.id);

      expect(foundCampaign).toMatchObject(createdCampaign);
      expect(foundCampaign?.owner).toMatchObject({
        id: user.id,
        email: user.email,
        name: user.name
      });
      expect(foundCampaign?.donations).toEqual([]);
      expect(foundCampaign?.comments).toEqual([]);
    });

    it('should return null if campaign not found', async () => {
      const foundCampaign = await campaignRepository.findById('non-existent-id');
      expect(foundCampaign).toBeNull();
    });
  });

  describe('update', () => {
    it('should update campaign data', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Original Campaign',
        description: 'Original description',
        goal: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, user.id);
      
      const updateData = {
        title: 'Updated Campaign',
        description: 'Updated description',
        goal: 7500
      };

      const updatedCampaign = await campaignRepository.update(createdCampaign.id, updateData, user.id);

      expect(updatedCampaign.title).toBe(updateData.title);
      expect(updatedCampaign.description).toBe(updateData.description);
      expect(updatedCampaign.goal).toBe(updateData.goal);
      expect(updatedCampaign.category).toBe(campaignData.category); // Should remain unchanged
      expect(updatedCampaign.updatedAt.getTime()).toBeGreaterThan(createdCampaign.updatedAt.getTime());

      // Verify in database
      const dbCampaign = await prisma.campaign.findUnique({
        where: { id: createdCampaign.id }
      });
      expect(dbCampaign?.goal.toString()).toBe(updateData.goal?.toString());
    });

    it('should throw error if user is not owner', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const admin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: 'testpassword123',
          name: 'Admin User',
          role: 'ADMIN'
        }
      });

      const campaignData = {
        title: 'Admin Update Campaign',
        description: 'Original description',
        goal: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, owner.id);
      
      const updateData = {
        title: 'Admin Updated Campaign'
      };

      await expect(
        campaignRepository.update(createdCampaign.id, updateData, admin.id)
      ).rejects.toThrow('Unauthorized to update this campaign');
    });

    it('should throw error if user is not owner or admin', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: 'testpassword123',
          name: 'Other User',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Unauthorized Update Campaign',
        description: 'Original description',
        goal: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, owner.id);
      
      const updateData = {
        title: 'Unauthorized Update'
      };

      await expect(campaignRepository.update(createdCampaign.id, updateData, otherUser.id)).rejects.toThrow('Unauthorized to update this campaign');
    });

    it('should throw error if campaign not found', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user@example.com',
          password: 'testpassword123',
          name: 'User',
          role: 'USER'
        }
      });

      const updateData = {
        title: 'Updated Title'
      };

      await expect(campaignRepository.update('non-existent-id', updateData, user.id)).rejects.toThrow('Campaign not found');
    });
  });

  describe('delete', () => {
    it('should delete campaign from database', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Delete Campaign',
        description: 'Campaign to delete',
        goal: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, user.id);
      await campaignRepository.delete(createdCampaign.id, user.id);

      // Verify campaign is deleted
      const dbCampaign = await prisma.campaign.findUnique({
        where: { id: createdCampaign.id }
      });
      expect(dbCampaign).toBeNull();
    });

    it('should throw error if user is not owner', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const admin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: 'testpassword123',
          name: 'Admin User',
          role: 'ADMIN'
        }
      });

      const campaignData = {
        title: 'Admin Delete Campaign',
        description: 'Campaign to delete by admin',
        goal: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, owner.id);
      
      await expect(
        campaignRepository.delete(createdCampaign.id, admin.id)
      ).rejects.toThrow('Unauthorized to delete this campaign');
    });

    it('should throw error if user is not owner or admin', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: 'testpassword123',
          name: 'Other User',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Unauthorized Delete Campaign',
        description: 'Campaign to delete',
        goal: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, owner.id);

      await expect(campaignRepository.delete(createdCampaign.id, otherUser.id)).rejects.toThrow('Unauthorized to delete this campaign');
    });
  });

  describe('findAll', () => {
    it('should return paginated campaigns with filters', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      // Create multiple campaigns
      const campaigns = [];
      for (let i = 0; i < 5; i++) {
        const campaign = await campaignRepository.create({
          title: `Campaign ${i}`,
          description: `Description ${i}`,
          goal: 1000 * (i + 1),
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: i % 2 === 0 ? CampaignCategory.TECHNOLOGY : CampaignCategory.ART
        }, user.id);
        campaigns.push(campaign);
      }

      // Test pagination
      const result = await campaignRepository.findAll({ page: 1, limit: 3 });

      expect(result.campaigns).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.campaigns[0].createdAt.getTime()).toBeGreaterThanOrEqual(result.campaigns[1].createdAt.getTime());

      // Test category filter
      const techResult = await campaignRepository.findAll({ category: CampaignCategory.TECHNOLOGY });
      expect(techResult.campaigns).toHaveLength(3);
      techResult.campaigns.forEach(campaign => {
        expect(campaign.category).toBe(CampaignCategory.TECHNOLOGY);
      });

      // Test search filter
      const searchResult = await campaignRepository.findAll({ search: 'Campaign 1' });
      expect(searchResult.campaigns).toHaveLength(1);
      expect(searchResult.campaigns[0].title).toBe('Campaign 1');
    });

    it('should handle empty results', async () => {
      const result = await campaignRepository.findAll();

      expect(result.campaigns).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('activate', () => {
    it('should activate draft campaign', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Activate Campaign',
        description: 'Campaign to activate',
        goal: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, user.id);
      expect(createdCampaign.status).toBe(CampaignStatus.DRAFT);

      const activatedCampaign = await campaignRepository.activate(createdCampaign.id, user.id);

      expect(activatedCampaign.status).toBe(CampaignStatus.ACTIVE);

      // Verify in database
      const dbCampaign = await prisma.campaign.findUnique({
        where: { id: createdCampaign.id }
      });
      expect(dbCampaign?.status).toBe(CampaignStatus.ACTIVE);
    });

    it('should throw error if user is not owner', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: 'testpassword123',
          name: 'Other User',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Unauthorized Activate Campaign',
        description: 'Campaign to activate',
        goal: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, owner.id);

      await expect(campaignRepository.activate(createdCampaign.id, otherUser.id)).rejects.toThrow('Unauthorized to activate this campaign');
    });

    it('should throw error if campaign is not draft', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Already Active Campaign',
        description: 'Campaign already active',
        goal: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, user.id);
      await campaignRepository.activate(createdCampaign.id, user.id);

      await expect(campaignRepository.activate(createdCampaign.id, user.id)).rejects.toThrow('Only draft campaigns can be activated');
    });
  });

  describe('updateStatus', () => {
    it('should update campaign status when user is admin', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const admin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: 'testpassword123',
          name: 'Admin User',
          role: 'ADMIN'
        }
      });

      const campaignData = {
        title: 'Status Update Campaign',
        description: 'Campaign for status update',
        goal: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, user.id);
      const updatedCampaign = await campaignRepository.updateStatus(createdCampaign.id, CampaignStatus.SUSPENDED, admin.id);

      expect(updatedCampaign.status).toBe(CampaignStatus.SUSPENDED);

      // Verify in database
      const dbCampaign = await prisma.campaign.findUnique({
        where: { id: createdCampaign.id }
      });
      expect(dbCampaign?.status).toBe(CampaignStatus.SUSPENDED);
    });

    it('should throw error if user is not admin', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'user@example.com',
          password: 'testpassword123',
          name: 'User',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Unauthorized Status Update Campaign',
        description: 'Campaign for status update',
        goal: 5000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, user.id);

      await expect(campaignRepository.updateStatus(createdCampaign.id, CampaignStatus.SUSPENDED, user.id)).rejects.toThrow('Unauthorized to update campaign status');
    });
  });

  describe('addDonation', () => {
    it('should add donation to active campaign', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Donation Campaign',
        description: 'Campaign for donations',
        goal: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, user.id);
      await campaignRepository.activate(createdCampaign.id, user.id);

      const updatedCampaign = await campaignRepository.addDonation(createdCampaign.id, 100);

      expect(updatedCampaign.current).toBe(100);
      expect(updatedCampaign.status).toBe(CampaignStatus.ACTIVE);

      // Verify in database
      const dbCampaign = await prisma.campaign.findUnique({
        where: { id: createdCampaign.id }
      });
      expect(dbCampaign?.current.toString()).toBe("100"); // Database stores as Decimal object
    });

    it('should complete campaign when goal is reached', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Complete Campaign',
        description: 'Campaign to complete',
        goal: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, user.id);
      await campaignRepository.activate(createdCampaign.id, user.id);

      const updatedCampaign = await campaignRepository.addDonation(createdCampaign.id, 1000);

      expect(updatedCampaign.current).toBe(1000);
      expect(updatedCampaign.status).toBe(CampaignStatus.COMPLETED);

      // Verify in database
      const dbCampaign = await prisma.campaign.findUnique({
        where: { id: createdCampaign.id }
      });
      expect(dbCampaign?.status).toBe(CampaignStatus.COMPLETED);
    });

    it('should throw error if campaign is not active', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Inactive Campaign',
        description: 'Inactive campaign',
        goal: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, user.id);

      await expect(campaignRepository.addDonation(createdCampaign.id, 100)).rejects.toThrow('Campaign is not active');
    });
  });

  describe('getCampaignStats', () => {
    it('should return campaign statistics', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const donor1 = await prisma.user.create({
        data: {
          email: 'donor1@example.com',
          password: 'testpassword123',
          name: 'Donor 1',
          role: 'USER'
        }
      });

      const donor2 = await prisma.user.create({
        data: {
          email: 'donor2@example.com',
          password: 'testpassword123',
          name: 'Donor 2',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'Stats Campaign',
        description: 'Campaign for stats',
        goal: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, owner.id);
      await campaignRepository.activate(createdCampaign.id, owner.id);

      // Add donations using DonationRepository
      const donationRepository = new DonationRepository(prisma);
      
      const donation1 = await donationRepository.create({
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        isAnonymous: false,
        message: 'First donation'
      }, createdCampaign.id, donor1.id);
      
      const donation2 = await donationRepository.create({
        amount: 200,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        isAnonymous: false,
        message: 'Second donation'
      }, createdCampaign.id, donor2.id);
      
      const donation3 = await donationRepository.create({
        amount: 300,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        isAnonymous: false,
        message: 'Third donation'
      }, createdCampaign.id, donor1.id);

      // Complete the donations to update campaign current amount
      await donationRepository.completeDonation(donation1.id);
      await donationRepository.completeDonation(donation2.id);
      await donationRepository.completeDonation(donation3.id);

      const stats = await campaignRepository.getCampaignStats(createdCampaign.id);

      expect(stats).toEqual({
        totalDonations: 3,
        uniqueDonors: 2, // donor1 made 2 donations, donor2 made 1
        averageDonation: 200, // (100 + 200 + 300) / 3
        progressPercentage: 60 // (600 / 1000) * 100
      });
    });

    it('should handle campaign with no donations', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Campaign Owner',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaignData = {
        title: 'No Donations Campaign',
        description: 'Campaign with no donations',
        goal: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: CampaignCategory.TECHNOLOGY
      };

      const createdCampaign = await campaignRepository.create(campaignData, user.id);
      const stats = await campaignRepository.getCampaignStats(createdCampaign.id);

      expect(stats).toEqual({
        totalDonations: 0,
        uniqueDonors: 0,
        averageDonation: 0,
        progressPercentage: 0
      });
    });

    it('should throw error if campaign not found', async () => {
      await expect(campaignRepository.getCampaignStats('non-existent-id')).rejects.toThrow('Campaign not found');
    });
  });
});
