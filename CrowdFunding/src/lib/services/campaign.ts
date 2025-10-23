import { CampaignCore } from '../core/campaign';
import { CampaignRepository } from '../../repositories/CampaignRepository';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateCampaignData {
  title: string;
  description: string;
  goal: number;
  deadline: Date;
  category: string;
  images?: string[];
}

export interface UpdateCampaignData {
  title?: string;
  description?: string;
  goal?: number;
  deadline?: Date;
  category?: any;
}

export interface CampaignStats {
  totalDonations: number;
  uniqueDonors: number;
  progressPercentage: number;
}

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  campaign?: T;
  stats?: T;
  campaigns?: T;
  pagination?: T;
}

export class CampaignService {
  constructor(
    private campaignCore: CampaignCore,
    private campaignRepository: CampaignRepository
  ) {}

  async createCampaign(campaignData: CreateCampaignData, userId: string): Promise<ServiceResult<any>> {
    try {
      // Validate goal
      if (!this.campaignCore.validateCampaignGoal(campaignData.goal)) {
        return { success: false, error: 'Invalid campaign goal' };
      }

      // Convert deadline to Date if it's a string
      const deadline = typeof campaignData.deadline === 'string' 
        ? new Date(campaignData.deadline) 
        : campaignData.deadline;

      // Validate deadline
      if (!this.campaignCore.validateCampaignDeadline(deadline)) {
        return { success: false, error: 'Invalid campaign deadline' };
      }

      // Generate slug
      const slug = this.campaignCore.generateCampaignSlug(campaignData.title);

      // Create campaign
      const campaign = await this.campaignRepository.create({
        title: campaignData.title,
        description: campaignData.description,
        goal: campaignData.goal,
        deadline: deadline,
        category: campaignData.category as any,
        images: []
      }, userId);

      return { success: true, campaign };
    } catch (error) {
      return { success: false, error: 'Failed to create campaign' };
    }
  }

  async updateCampaign(campaignId: string, updateData: UpdateCampaignData, userId: string): Promise<ServiceResult<any>> {
    try {
      console.log('CampaignService.updateCampaign called:', { campaignId, updateData, userId });
      
      // Check if campaign exists
      console.log('Checking if campaign exists...');
      const campaign = await this.campaignRepository.findById(campaignId);
      console.log('Campaign found:', campaign ? 'YES' : 'NO', campaign ? { id: campaign.id, ownerId: campaign.ownerId } : null);
      
      if (!campaign) {
        console.log('Campaign not found, returning error');
        return { success: false, error: 'Campaign not found' };
      }

      // Check authorization
      console.log('Checking authorization:', { campaignOwnerId: campaign.ownerId, userId, authorized: campaign.ownerId === userId });
      if (campaign.ownerId !== userId) {
        console.log('Unauthorized, returning error');
        return { success: false, error: 'Unauthorized to update this campaign' };
      }

      // Update campaign
      console.log('Updating campaign...');
      const updatedCampaign = await this.campaignRepository.update(campaignId, updateData, userId);
      console.log('Campaign updated successfully:', updatedCampaign ? 'YES' : 'NO');
      return { success: true, campaign: updatedCampaign };
    } catch (error) {
      console.log('CampaignService.updateCampaign error:', error);
      return { success: false, error: 'Failed to update campaign' };
    }
  }

  async getCampaignStats(campaignId: string): Promise<ServiceResult<any>> {
    try {
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      const stats = await this.campaignRepository.getCampaignStats(campaignId);
      const progressPercentage = this.campaignCore.calculateProgress(
        Number(campaign.current),
        Number(campaign.goal)
      );
      const daysRemaining = this.campaignCore.calculateDaysRemaining(campaign.deadline);
      const isActive = this.campaignCore.isCampaignActive(campaign.status, campaign.deadline);

      return {
        success: true,
        campaign,
        stats: {
          ...stats,
          progressPercentage,
          daysRemaining,
          isActive
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to get campaign stats' };
    }
  }

  async getUserCampaigns(userId: string, page: number, limit: number, status?: string): Promise<ServiceResult<any>> {
    try {
      const campaigns = await this.campaignRepository.findByOwnerId(userId, page, limit, status);
      
      return {
        success: true,
        campaigns: campaigns.campaigns,
        pagination: {
          page: campaigns.page,
          limit: campaigns.limit,
          total: campaigns.total,
          totalPages: Math.ceil(campaigns.total / campaigns.limit)
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to get user campaigns' };
    }
  }

  async searchCampaigns(filters: any, page: number, limit: number): Promise<ServiceResult<any>> {
    try {
      const result = await this.campaignRepository.findAll({
        ...filters,
        page,
        limit
      });
      return { 
        success: true, 
        campaigns: result.campaigns, 
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit)
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to search campaigns' };
    }
  }

  async getFeaturedCampaigns(limit: number = 6): Promise<ServiceResult<any>> {
    try {
      // Get campaigns with highest funding progress
      const result = await this.campaignRepository.findAll({
        status: 'ACTIVE',
        page: 1,
        limit
      });
      
      // Sort by progress percentage (current/goal ratio)
      const featuredCampaigns = result.campaigns
        .filter(campaign => {
          // Filter out campaigns with invalid IDs (not UUIDs)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(campaign.id);
        })
        .map(campaign => ({
          ...campaign,
          progressPercentage: this.campaignCore.calculateProgress(
            Number(campaign.current),
            Number(campaign.goal)
          )
        }))
        .sort((a, b) => b.progressPercentage - a.progressPercentage)
        .slice(0, limit);

      return { 
        success: true, 
        campaigns: featuredCampaigns
      };
    } catch (error) {
      return { success: false, error: 'Failed to get featured campaigns' };
    }
  }

  async getTrendingCampaigns(limit: number = 8): Promise<ServiceResult<any>> {
    try {
      // Get recent campaigns with good progress
      const result = await this.campaignRepository.findAll({
        status: 'ACTIVE',
        page: 1,
        limit: limit * 2 // Get more to filter
      });
      
      // Sort by recent activity and progress
      const trendingCampaigns = result.campaigns
        .filter(campaign => {
          // Filter out campaigns with invalid IDs (not UUIDs)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(campaign.id);
        })
        .map(campaign => ({
          ...campaign,
          progressPercentage: this.campaignCore.calculateProgress(
            Number(campaign.current),
            Number(campaign.goal)
          ),
          daysSinceCreated: Math.floor(
            (new Date().getTime() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          )
        }))
        .filter(campaign => campaign.progressPercentage > 10) // At least 10% funded
        .sort((a, b) => {
          // Sort by recent creation and good progress
          const scoreA = a.progressPercentage + (30 - a.daysSinceCreated) * 0.1;
          const scoreB = b.progressPercentage + (30 - b.daysSinceCreated) * 0.1;
          return scoreB - scoreA;
        })
        .slice(0, limit);

      return { 
        success: true, 
        campaigns: trendingCampaigns
      };
    } catch (error) {
      return { success: false, error: 'Failed to get trending campaigns' };
    }
  }

  async activateCampaign(campaignId: string, userId: string): Promise<ServiceResult<any>> {
    try {
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      // Check if deadline is valid
      if (!this.campaignCore.validateCampaignDeadline(campaign.deadline)) {
        return { success: false, error: 'Campaign deadline has passed' };
      }

      // Activate campaign
      const updatedCampaign = await this.campaignRepository.updateStatus(campaignId, 'ACTIVE', userId);
      return { success: true, campaign: updatedCampaign };
    } catch (error) {
      return { success: false, error: 'Failed to activate campaign' };
    }
  }

  async deactivateCampaign(campaignId: string, userId: string): Promise<ServiceResult<any>> {
    try {
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      // Check permissions
      if (campaign.ownerId !== userId) {
        return { success: false, error: 'Unauthorized to deactivate this campaign' };
      }

      // Deactivate campaign
      const updatedCampaign = await this.campaignRepository.updateStatus(campaignId, 'DRAFT', userId);
      return { success: true, campaign: updatedCampaign };
    } catch (error) {
      return { success: false, error: 'Failed to deactivate campaign' };
    }
  }

  async deleteCampaign(campaignId: string, userId: string): Promise<ServiceResult<any>> {
    try {
      const campaign = await this.campaignRepository.findById(campaignId);
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      // Check permissions
      if (campaign.ownerId !== userId) {
        return { success: false, error: 'Unauthorized to delete this campaign' };
      }

      await this.campaignRepository.delete(campaignId, userId);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete campaign' };
    }
  }
}
