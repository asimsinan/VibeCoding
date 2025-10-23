import { PrismaClient, Campaign, CampaignCategory, CampaignStatus, Prisma, PaymentMethod, DonationStatus } from '@prisma/client';

export interface CreateCampaignData {
  title: string;
  description: string;
  goal: number;
  deadline: Date;
  category: CampaignCategory;
  images?: string[];
}

export interface UpdateCampaignData {
  title?: string;
  description?: string;
  goal?: number;
  deadline?: Date;
  category?: CampaignCategory;
  images?: string[];
  status?: CampaignStatus;
}

export interface CampaignFilters {
  page?: number;
  limit?: number;
  category?: CampaignCategory;
  status?: CampaignStatus;
  search?: string;
}

export interface CampaignListResult {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
}

export interface CampaignStats {
  totalDonations: number;
  uniqueDonors: number;
  averageDonation: number;
  progressPercentage: number;
}

export type CampaignWithRelations = any;

export class CampaignRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: CreateCampaignData, ownerId: string): Promise<Campaign> {
    // Validate deadline is in the future
    if (data.deadline <= new Date()) {
      throw new Error('Campaign deadline must be in the future');
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        title: data.title,
        description: data.description,
        goal: data.goal,
        deadline: data.deadline,
        category: data.category,
        images: data.images || [],
        ownerId: ownerId,
        status: CampaignStatus.DRAFT
      }
    });

    return {
      ...campaign,
      goal: Number(campaign.goal),
      current: Number(campaign.current)
    } as any;
  }

  async findById(id: string): Promise<CampaignWithRelations | null> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
          }
        },
        donations: {
          include: {
            donor: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!campaign) return null;

    return {
      ...campaign,
      goal: Number(campaign.goal),
      current: Number(campaign.current),
      donations: campaign.donations.map(donation => ({
        ...donation,
        amount: Number(donation.amount)
      }))
    } as any;
  }

  async update(id: string, data: UpdateCampaignData, userId: string): Promise<Campaign> {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if user is owner
    if (campaign.ownerId !== userId) {
      throw new Error('Unauthorized to update this campaign');
    }

    // Convert deadline string to Date object if provided
    const updateData: any = {
      title: data.title,
      description: data.description,
      goal: data.goal,
      category: data.category,
      images: data.images,
      status: data.status
    };
    
    if (data.deadline) {
      updateData.deadline = new Date(data.deadline);
    }

    console.log('CampaignRepository.update - updateData:', updateData);

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id },
      data: updateData
    });

    console.log('CampaignRepository.update - updatedCampaign:', { id: updatedCampaign.id, status: updatedCampaign.status });

    return {
      ...updatedCampaign,
      goal: Number(updatedCampaign.goal),
      current: Number(updatedCampaign.current)
    } as any;
  }

  async delete(id: string, userId: string): Promise<void> {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if user is owner
    if (campaign.ownerId !== userId) {
      throw new Error('Unauthorized to delete this campaign');
    }

    await this.prisma.campaign.delete({
      where: { id }
    });
  }

  async findAll(filters: CampaignFilters = {}): Promise<CampaignListResult> {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      search
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      }),
      this.prisma.campaign.count({ where })
    ]);

    return { campaigns, total, page, limit };
  }

  async activate(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if user is owner
    if (campaign.ownerId !== userId) {
      throw new Error('Unauthorized to activate this campaign');
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new Error('Only draft campaigns can be activated');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.ACTIVE }
    });
  }

  async updateStatus(id: string, status: CampaignStatus, adminId: string): Promise<Campaign> {
    const user = await this.prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!user || user.role !== 'ADMIN') {
      throw new Error('Unauthorized to update campaign status');
    }

    const campaign = await this.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return this.prisma.campaign.update({
      where: { id },
      data: { status }
    });
  }

  async addDonation(id: string, amount: number): Promise<Campaign> {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new Error('Campaign is not accepting donations');
    }

    const newCurrent = Number(campaign.current) + amount;
    const newStatus = newCurrent >= Number(campaign.goal) ? CampaignStatus.COMPLETED : campaign.status;

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id },
      data: {
        current: newCurrent,
        status: newStatus
      }
    });

    return {
      ...updatedCampaign,
      goal: Number(updatedCampaign.goal),
      current: Number(updatedCampaign.current)
    } as any;
  }

  async getCampaignStats(id: string): Promise<CampaignStats> {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const [totalDonations, uniqueDonors, averageDonation] = await Promise.all([
      this.prisma.donation.count({
        where: { campaignId: id }
      }),
      this.prisma.donation.findMany({
        where: { campaignId: id },
        select: { donorId: true },
        distinct: ['donorId']
      }),
      this.prisma.donation.aggregate({
        _avg: { amount: true },
        where: { campaignId: id }
      })
    ]);

    const progressPercentage = Math.min((Number(campaign.current) / Number(campaign.goal)) * 100, 100);

    return {
      totalDonations,
      uniqueDonors: uniqueDonors.length,
      averageDonation: Number(averageDonation._avg.amount) || 0,
      progressPercentage
    };
  }

  async findByOwnerId(ownerId: string, page: number = 1, limit: number = 20, status?: string): Promise<{
    campaigns: any[];
    page: number;
    limit: number;
    total: number;
  }> {
    const skip = (page - 1) * limit;
    
    const where: any = {
      ownerId: ownerId
    };
    
    if (status) {
      where.status = status;
    }

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          _count: {
            select: {
              donations: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      this.prisma.campaign.count({ where })
    ]);

    return {
      campaigns: campaigns.map(campaign => ({
        ...campaign,
        current: Number(campaign.current),
        goal: Number(campaign.goal)
      })),
      page,
      limit,
      total
    };
  }
}
