import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { CampaignService } from '../lib/services/campaign';
import { DonationService } from '../lib/services/donation';
import { CommentService } from '../lib/services/comment';
import { CampaignCore } from '../lib/core/campaign';
import { DonationCore } from '../lib/core/donation';
import { CommentCore } from '../lib/core/comment';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { DonationRepository } from '../repositories/DonationRepository';
import { CommentRepository } from '../repositories/CommentRepository';
import { PrismaClient } from '@prisma/client';

// Default service instances
const prisma = new PrismaClient();
const campaignCore = new CampaignCore();
const campaignRepository = new CampaignRepository(prisma);
const campaignService = new CampaignService(campaignCore, campaignRepository);

const donationCore = new DonationCore();
const donationRepository = new DonationRepository(prisma);
const donationService = new DonationService(donationCore, donationRepository, campaignRepository);

const commentCore = new CommentCore();
const commentRepository = new CommentRepository(prisma);
const commentService = new CommentService(commentCore, commentRepository, campaignRepository);

export class CampaignController {
  // POST /api/v1/campaigns
  static async createCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const campaignData = {
        ...req.body,
        ownerId: req.user?.id
      };

      const result = await campaignService.createCampaign(campaignData, req.user?.id || '');

      if (result.success) {
        res.status(201).json({
          success: true,
          campaign: result.campaign
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/v1/campaigns
  static async getCampaigns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        category: req.query.category as string,
        status: req.query.status as string,
        search: req.query.search as string
      };

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await campaignService.searchCampaigns(filters, page, limit);

      if (result.success) {
        res.status(200).json({
          success: true,
          campaigns: result.campaigns,
          pagination: result.pagination
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/v1/campaigns/my - Get current user's campaigns
  static async getMyCampaigns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      const result = await campaignService.getUserCampaigns(req.user.id, page, limit, status);

      if (result.success) {
        res.status(200).json({
          success: true,
          campaigns: result.campaigns,
          pagination: result.pagination
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/v1/campaigns/featured
  static async getFeaturedCampaigns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 6;
      
      const result = await campaignService.getFeaturedCampaigns(limit);

      if (result.success) {
        res.status(200).json({
          success: true,
          campaigns: result.campaigns
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/v1/campaigns/trending
  static async getTrendingCampaigns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 8;
      
      const result = await campaignService.getTrendingCampaigns(limit);

      if (result.success) {
        res.status(200).json({
          success: true,
          campaigns: result.campaigns
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/v1/campaigns/:id
  static async getCampaignById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await campaignService.getCampaignStats(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          ...result.campaign,
          stats: result.stats
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // PUT /api/v1/campaigns/:id
    static async updateCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
      try {
        console.log('UpdateCampaign called:', { 
          id: req.params.id, 
          userId: req.user?.id, 
          body: req.body 
        });
        
        const { id } = req.params;
        const updateData = req.body;

        console.log('About to call campaignService.updateCampaign...');
        const result = await campaignService.updateCampaign(id, updateData, req.user?.id || '');
        console.log('campaignService.updateCampaign result:', result);

      if (result.success) {
        res.status(200).json({
          success: true,
          ...result.campaign
        });
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 404;
        const errorMessage = result.error?.includes('Unauthorized') ? 'Unauthorized to update this campaign' : result.error;
        res.status(statusCode).json({
          success: false,
          error: errorMessage
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // DELETE /api/v1/campaigns/:id
  static async deleteCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await campaignService.deleteCampaign(id, req.user?.id || '');

      if (result.success) {
        res.status(204).send();
      } else {
        const statusCode = result.error?.includes('Unauthorized') ? 403 : 404;
        const errorMessage = result.error?.includes('Unauthorized') ? 'Unauthorized to delete this campaign' : result.error;
        res.status(statusCode).json({
          success: false,
          error: errorMessage
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // POST /api/v1/campaigns/:id/donations
  static async createDonation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: campaignId } = req.params;
      const donationData = {
        ...req.body,
        campaignId,
        donorId: req.user?.id
      };

      const result = await donationService.processDonation(donationData);

      if (result.success) {
        res.status(201).json({
          success: true,
          donation: result.donation
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/v1/campaigns/:id/donations
  static async getCampaignDonations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: campaignId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await donationService.getCampaignDonations(campaignId, page, limit);

      if (result.success) {
        res.status(200).json({
          success: true,
          donations: result.donations,
          pagination: result.pagination
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // POST /api/v1/campaigns/:id/comments
  static async createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: campaignId } = req.params;
      const commentData = {
        ...req.body,
        campaignId,
        authorId: req.user?.id
      };

      const result = await commentService.createComment(commentData);

      if (result.success) {
        res.status(201).json({
          success: true,
          comment: result.comment
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // GET /api/v1/campaigns/:id/comments
  static async getCampaignComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: campaignId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await commentService.getCampaignComments(campaignId, page, limit);

      if (result.success) {
        res.status(200).json({
          success: true,
          comments: result.comments,
          pagination: result.pagination
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
