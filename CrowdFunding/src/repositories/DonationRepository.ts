import { PrismaClient, Donation, DonationStatus, PaymentMethod, Prisma } from '@prisma/client';

export interface CreateDonationData {
  amount: number;
  paymentMethod: PaymentMethod;
  isAnonymous?: boolean;
  message?: string;
}

export interface DonationListResult {
  donations: Donation[];
  total: number;
  page: number;
  limit: number;
}

export interface DonationStats {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  topDonors: Array<{ donorId: string; totalAmount: number; count: number }>;
}

export type DonationWithRelations = any;

export class DonationRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: CreateDonationData, campaignId: string, donorId: string): Promise<Donation> {
    // Validate campaign exists and is active
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'ACTIVE') {
      throw new Error('Campaign is not accepting donations');
    }

    // Check if campaign deadline has passed
    if (new Date() > campaign.deadline) {
      throw new Error('Campaign deadline has passed');
    }

    // Validate donor exists
    const donor = await this.prisma.user.findUnique({
      where: { id: donorId }
    });

    if (!donor) {
      throw new Error('Donor not found');
    }

    // Prevent self-donation
    if (campaign.ownerId === donorId) {
      throw new Error('Campaign owners cannot donate to their own campaigns');
    }

    const donation = await this.prisma.donation.create({
      data: {
        amount: data.amount,
        campaignId: campaignId,
        donorId: donorId,
        paymentMethod: data.paymentMethod,
        status: DonationStatus.PENDING,
        isAnonymous: data.isAnonymous || false,
        message: data.message || null
      },
      include: {
        campaign: true,
        donor: true
      }
    });

    return {
      ...donation,
      amount: Number(donation.amount)
    } as any;
  }

  async findById(id: string): Promise<DonationWithRelations | null> {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      include: {
        campaign: true,
        donor: true
      }
    });

    if (!donation) return null;

    return {
      ...donation,
      amount: Number(donation.amount)
    } as any;
  }

  async findByCampaign(campaignId: string, page: number = 1, limit: number = 20): Promise<DonationListResult> {
    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      this.prisma.donation.findMany({
        where: { campaignId },
        skip,
        take: limit,
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
      }),
      this.prisma.donation.count({ where: { campaignId } })
    ]);

    return { donations, total, page, limit };
  }

  async findByDonor(donorId: string, page: number = 1, limit: number = 20): Promise<DonationListResult> {
    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      this.prisma.donation.findMany({
        where: { donorId },
        skip,
        take: limit,
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
      }),
      this.prisma.donation.count({ where: { donorId } })
    ]);

    return { donations, total, page, limit };
  }

  async updateStatus(id: string, status: DonationStatus): Promise<Donation> {
    const donation = await this.findById(id);
    if (!donation) {
      throw new Error('Donation not found');
    }

    return this.prisma.donation.update({
      where: { id },
      data: { status }
    });
  }

  async completeDonation(id: string): Promise<Donation> {
    const donation = await this.findById(id);
    if (!donation) {
      throw new Error('Donation not found');
    }

    if (donation.status !== DonationStatus.PENDING) {
      throw new Error('Donation is not in pending status');
    }

    // Update donation status
    const updatedDonation = await this.prisma.donation.update({
      where: { id },
      data: { status: DonationStatus.COMPLETED }
    });

    // Update campaign current amount
    await this.prisma.campaign.update({
      where: { id: donation.campaignId },
      data: {
        current: {
          increment: donation.amount
        }
      }
    });

    return updatedDonation;
  }

  async refundDonation(id: string): Promise<Donation> {
    const donation = await this.findById(id);
    if (!donation) {
      throw new Error('Donation not found');
    }

    if (donation.status !== DonationStatus.COMPLETED) {
      throw new Error('Only completed donations can be refunded');
    }

    // Update donation status
    const updatedDonation = await this.prisma.donation.update({
      where: { id },
      data: { status: DonationStatus.REFUNDED }
    });

    // Decrease campaign current amount
    await this.prisma.campaign.update({
      where: { id: donation.campaignId },
      data: {
        current: {
          decrement: donation.amount
        }
      }
    });

    return updatedDonation;
  }

  async getDonationStats(campaignId?: string): Promise<DonationStats> {
    const where: any = {};
    if (campaignId) where.campaignId = campaignId;

    const [totalAmount, totalCount, averageAmount, topDonors] = await Promise.all([
      this.prisma.donation.aggregate({
        where: { ...where, status: DonationStatus.COMPLETED },
        _sum: { amount: true }
      }),
      this.prisma.donation.count({
        where: { ...where, status: DonationStatus.COMPLETED }
      }),
      this.prisma.donation.aggregate({
        where: { ...where, status: DonationStatus.COMPLETED },
        _avg: { amount: true }
      }),
      this.prisma.donation.groupBy({
        by: ['donorId'],
        where: { ...where, status: DonationStatus.COMPLETED },
        _sum: { amount: true },
        _count: { donorId: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 10
      })
    ]);

    return {
      totalAmount: Number(totalAmount._sum.amount) || 0,
      totalCount,
      averageAmount: Number(averageAmount._avg.amount) || 0,
      topDonors: topDonors.map(donor => ({
        donorId: donor.donorId,
        totalAmount: Number(donor._sum.amount) || 0,
        count: donor._count.donorId
      }))
    };
  }

  async delete(id: string): Promise<void> {
    const donation = await this.findById(id);
    if (!donation) {
      throw new Error('Donation not found');
    }

    await this.prisma.donation.delete({
      where: { id }
    });
  }
}
