import { PrismaClient } from '@prisma/client';
import { DonationRepository } from '../../src/repositories/DonationRepository';
import { DonationStatus, PaymentMethod } from '@prisma/client';

describe('DonationRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let donationRepository: DonationRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    donationRepository = new DonationRepository(prisma);
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
    it('should create a donation in the database', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        isAnonymous: false,
        message: 'Great project!'
      };

      const donation = await donationRepository.create(donationData, campaign.id, donor.id);

      expect(donation).toMatchObject({
        amount: donationData.amount,
        campaignId: campaign.id,
        donorId: donor.id,
        paymentMethod: donationData.paymentMethod,
        status: DonationStatus.PENDING,
        isAnonymous: donationData.isAnonymous,
        message: donationData.message
      });
      expect(donation.id).toBeDefined();
      expect(donation.createdAt).toBeDefined();

      // Verify donation exists in database
      const dbDonation = await prisma.donation.findUnique({
        where: { id: donation.id }
      });
      expect(dbDonation?.amount.toString()).toBe(donationData.amount.toString());
    });

    it('should throw error if campaign not found', async () => {
      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      await expect(donationRepository.create(donationData, 'non-existent-id', donor.id)).rejects.toThrow('Campaign not found');
    });

    it('should throw error if campaign is not active', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Draft Campaign',
          description: 'Draft description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'DRAFT'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      await expect(donationRepository.create(donationData, campaign.id, donor.id)).rejects.toThrow('Campaign is not active');
    });

    it('should throw error if campaign deadline has passed', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Expired Campaign',
          description: 'Expired description',
          goal: 10000,
          deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      await expect(donationRepository.create(donationData, campaign.id, donor.id)).rejects.toThrow('Campaign deadline has passed');
    });

    it('should throw error if donor not found', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      await expect(donationRepository.create(donationData, campaign.id, 'non-existent-id')).rejects.toThrow('Donor not found');
    });

    it('should throw error if campaign owner tries to donate to own campaign', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Owner Campaign',
          description: 'Owner description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      await expect(donationRepository.create(donationData, campaign.id, owner.id)).rejects.toThrow('Campaign owners cannot donate to their own campaigns');
    });
  });

  describe('findById', () => {
    it('should find donation by ID with relations', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const createdDonation = await donationRepository.create(donationData, campaign.id, donor.id);
      const foundDonation = await donationRepository.findById(createdDonation.id);

      expect(foundDonation).toMatchObject(createdDonation);
      expect(foundDonation?.campaign).toMatchObject({
        id: campaign.id,
        title: campaign.title
      });
      expect(foundDonation?.donor).toMatchObject({
        id: donor.id,
        name: donor.name
      });
    });

    it('should return null if donation not found', async () => {
      const foundDonation = await donationRepository.findById('non-existent-id');
      expect(foundDonation).toBeNull();
    });
  });

  describe('findByCampaign', () => {
    it('should return paginated donations for campaign', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      // Create multiple donors and donations
      const donations = [];
      for (let i = 0; i < 5; i++) {
        const donor = await prisma.user.create({
          data: {
            email: `donor${i}@example.com`,
            name: `Donor ${i}`,
            password: 'testpassword123',
            role: 'USER'
          }
        });

        const donation = await donationRepository.create({
          amount: 100 * (i + 1),
          paymentMethod: PaymentMethod.CREDIT_CARD
        }, campaign.id, donor.id);

        donations.push(donation);
      }

      const result = await donationRepository.findByCampaign(campaign.id, 1, 3);

      expect(result.donations).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.donations[0].createdAt.getTime()).toBeGreaterThanOrEqual(result.donations[1].createdAt.getTime());
    });

    it('should handle empty results', async () => {
      const result = await donationRepository.findByCampaign('non-existent-id');

      expect(result.donations).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findByDonor', () => {
    it('should return paginated donations by donor', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      // Create multiple campaigns and donations
      const donations = [];
      for (let i = 0; i < 3; i++) {
        const campaign = await prisma.campaign.create({
          data: {
            title: `Campaign ${i}`,
            description: `Description ${i}`,
            goal: 1000,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            category: 'TECHNOLOGY',
            ownerId: owner.id,
            status: 'ACTIVE'
          }
        });

        const donation = await donationRepository.create({
          amount: 100 * (i + 1),
          paymentMethod: PaymentMethod.CREDIT_CARD
        }, campaign.id, donor.id);

        donations.push(donation);
      }

      const result = await donationRepository.findByDonor(donor.id, 1, 2);

      expect(result.donations).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.donations[0].createdAt.getTime()).toBeGreaterThanOrEqual(result.donations[1].createdAt.getTime());
    });

    it('should handle empty results', async () => {
      const result = await donationRepository.findByDonor('non-existent-id');

      expect(result.donations).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateStatus', () => {
    it('should update donation status', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const createdDonation = await donationRepository.create(donationData, campaign.id, donor.id);
      expect(createdDonation.status).toBe(DonationStatus.PENDING);

      const updatedDonation = await donationRepository.updateStatus(createdDonation.id, DonationStatus.COMPLETED);

      expect(updatedDonation.status).toBe(DonationStatus.COMPLETED);

      // Verify in database
      const dbDonation = await prisma.donation.findUnique({
        where: { id: createdDonation.id }
      });
      expect(dbDonation?.status).toBe(DonationStatus.COMPLETED);
    });

    it('should throw error if donation not found', async () => {
      await expect(donationRepository.updateStatus('non-existent-id', DonationStatus.COMPLETED)).rejects.toThrow('Donation not found');
    });
  });

  describe('completeDonation', () => {
    it('should complete donation and update campaign', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const createdDonation = await donationRepository.create(donationData, campaign.id, donor.id);
      const completedDonation = await donationRepository.completeDonation(createdDonation.id);

      expect(completedDonation.status).toBe(DonationStatus.COMPLETED);

      // Verify campaign current amount is updated
      const dbCampaign = await prisma.campaign.findUnique({
        where: { id: campaign.id }
      });
      expect(dbCampaign?.current.toString()).toBe("100"); // Database stores as Decimal object
    });

    it('should throw error if donation is not pending', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const createdDonation = await donationRepository.create(donationData, campaign.id, donor.id);
      await donationRepository.completeDonation(createdDonation.id);

      await expect(donationRepository.completeDonation(createdDonation.id)).rejects.toThrow('Donation is not in pending status');
    });
  });

  describe('refundDonation', () => {
    it('should refund completed donation and update campaign', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const createdDonation = await donationRepository.create(donationData, campaign.id, donor.id);
      await donationRepository.completeDonation(createdDonation.id);

      const refundedDonation = await donationRepository.refundDonation(createdDonation.id);

      expect(refundedDonation.status).toBe(DonationStatus.REFUNDED);

      // Verify campaign current amount is decreased
      const dbCampaign = await prisma.campaign.findUnique({
        where: { id: campaign.id }
      });
      expect(dbCampaign?.current.toString()).toBe("0"); // Database stores as Decimal object
    });

    it('should throw error if donation is not completed', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const createdDonation = await donationRepository.create(donationData, campaign.id, donor.id);

      await expect(donationRepository.refundDonation(createdDonation.id)).rejects.toThrow('Only completed donations can be refunded');
    });
  });

  describe('getDonationStats', () => {
    it('should return donation statistics', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor1 = await prisma.user.create({
        data: {
          email: 'donor1@example.com',
          name: 'Donor 1',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const donor2 = await prisma.user.create({
        data: {
          email: 'donor2@example.com',
          name: 'Donor 2',
          password: 'testpassword123',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Stats Campaign',
          description: 'Campaign for stats',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      // Create donations
      const donation1 = await donationRepository.create({
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      }, campaign.id, donor1.id);

      const donation2 = await donationRepository.create({
        amount: 200,
        paymentMethod: PaymentMethod.CREDIT_CARD
      }, campaign.id, donor2.id);

      const donation3 = await donationRepository.create({
        amount: 300,
        paymentMethod: PaymentMethod.CREDIT_CARD
      }, campaign.id, donor1.id);

      // Complete donations
      await donationRepository.completeDonation(donation1.id);
      await donationRepository.completeDonation(donation2.id);
      await donationRepository.completeDonation(donation3.id);

      const stats = await donationRepository.getDonationStats(campaign.id);

      expect(stats).toEqual({
        totalAmount: 600,
        totalCount: 3,
        averageAmount: 200,
        topDonors: [
          { donorId: donor1.id, totalAmount: 400, count: 2 },
          { donorId: donor2.id, totalAmount: 200, count: 1 }
        ]
      });
    });

    it('should handle donations with no completed status', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'No Completed Campaign',
          description: 'Campaign with no completed donations',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      await donationRepository.create({
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      }, campaign.id, donor.id);

      const stats = await donationRepository.getDonationStats(campaign.id);

      expect(stats).toEqual({
        totalAmount: 0,
        totalCount: 0,
        averageAmount: 0,
        topDonors: []
      });
    });
  });

  describe('delete', () => {
    it('should delete donation from database', async () => {
      const owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          password: 'testpassword123',
          name: 'Campaign Owner',
          role: 'USER'
        }
      });

      const donor = await prisma.user.create({
        data: {
          email: 'donor@example.com',
          password: 'testpassword123',
          name: 'Donor User',
          role: 'USER'
        }
      });

      const campaign = await prisma.campaign.create({
        data: {
          title: 'Test Campaign',
          description: 'Test description',
          goal: 10000,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          category: 'TECHNOLOGY',
          ownerId: owner.id,
          status: 'ACTIVE'
        }
      });

      const donationData = {
        amount: 100,
        paymentMethod: PaymentMethod.CREDIT_CARD
      };

      const createdDonation = await donationRepository.create(donationData, campaign.id, donor.id);
      await donationRepository.delete(createdDonation.id);

      // Verify donation is deleted
      const dbDonation = await prisma.donation.findUnique({
        where: { id: createdDonation.id }
      });
      expect(dbDonation).toBeNull();
    });

    it('should throw error if donation not found', async () => {
      await expect(donationRepository.delete('non-existent-id')).rejects.toThrow('Donation not found');
    });
  });
});
