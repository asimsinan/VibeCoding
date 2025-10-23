import { PrismaClient, Campaign, CampaignCategory, CampaignStatus } from '@prisma/client';
import { IsString, IsEnum, IsNumber, IsOptional, IsArray, IsDateString, MinLength, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateCampaignDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description: string;

  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseFloat(value))
  goal: number;

  @IsDateString()
  deadline: string;

  @IsEnum(CampaignCategory)
  category: CampaignCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[] = [];
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseFloat(value))
  goal?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsEnum(CampaignCategory)
  category?: CampaignCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class CampaignModel {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async create(data: CreateCampaignDto, ownerId: string): Promise<Campaign> {
    // Validate deadline is in the future
    const deadline = new Date(data.deadline);
    if (deadline <= new Date()) {
      throw new Error('Campaign deadline must be in the future');
    }

    return this.prisma.campaign.create({
      data: {
        title: data.title,
        description: data.description,
        goal: data.goal,
        deadline: deadline,
        category: data.category,
        images: data.images || [],
        ownerId: ownerId,
        status: CampaignStatus.DRAFT
      }
    });
  }

  async findById(id: string): Promise<Campaign | null> {
    return this.prisma.campaign.findUnique({
      where: { id },
      include: {
        owner: true,
        donations: {
          include: { donor: true }
        },
        comments: {
          include: { author: true }
        }
      }
    });
  }

  async update(id: string, data: UpdateCampaignDto, userId: string): Promise<Campaign> {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if user is the owner or admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || (campaign.ownerId !== userId && user.role !== 'ADMIN')) {
      throw new Error('Unauthorized to update this campaign');
    }

    const updateData: any = {};
    
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.goal) updateData.goal = data.goal;
    if (data.deadline) {
      const deadline = new Date(data.deadline);
      if (deadline <= new Date()) {
        throw new Error('Campaign deadline must be in the future');
      }
      updateData.deadline = deadline;
    }
    if (data.category) updateData.category = data.category;
    if (data.images) updateData.images = data.images;

    return this.prisma.campaign.update({
      where: { id },
      data: updateData
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Check if user is the owner or admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || (campaign.ownerId !== userId && user.role !== 'ADMIN')) {
      throw new Error('Unauthorized to delete this campaign');
    }

    await this.prisma.campaign.delete({
      where: { id }
    });
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    category?: CampaignCategory;
    status?: CampaignStatus;
    search?: string;
  } = {}): Promise<{ campaigns: Campaign[]; total: number }> {
    const { page = 1, limit = 20, category, status, search } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (category) where.category = category;
    if (status) where.status = status;
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
          owner: true,
          _count: {
            select: {
              donations: true,
              comments: true
            }
          }
        }
      }),
      this.prisma.campaign.count({ where })
    ]);

    return { campaigns, total };
  }

  async activate(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

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
      throw new Error('Campaign is not active');
    }

    const newCurrent = Number(campaign.current) + amount;
    
    return this.prisma.campaign.update({
      where: { id },
      data: { 
        current: newCurrent,
        status: newCurrent >= Number(campaign.goal) ? CampaignStatus.COMPLETED : campaign.status
      }
    });
  }

  async getCampaignStats(id: string): Promise<{
    totalDonations: number;
    uniqueDonors: number;
    averageDonation: number;
    progressPercentage: number;
  }> {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const [totalDonations, uniqueDonors, averageDonation] = await Promise.all([
      this.prisma.donation.count({ where: { campaignId: id } }),
      this.prisma.donation.groupBy({
        by: ['donorId'],
        where: { campaignId: id }
      }).then(result => result.length),
      this.prisma.donation.aggregate({
        where: { campaignId: id },
        _avg: { amount: true }
      })
    ]);

    const progressPercentage = Math.min((Number(campaign.current) / Number(campaign.goal)) * 100, 100);

    return {
      totalDonations,
      uniqueDonors,
      averageDonation: Number(averageDonation._avg.amount) || 0,
      progressPercentage
    };
  }
}
