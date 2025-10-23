import { Request, Response } from 'express';
import { DonationService } from '../lib/services/donation';
import { DonationCore } from '../lib/core/donation';
import { DonationRepository } from '../repositories/DonationRepository';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const donationCore = new DonationCore();
const donationRepository = new DonationRepository(prisma);
const campaignRepository = new CampaignRepository(prisma);
const donationService = new DonationService(donationCore, donationRepository, campaignRepository);

export class DonationController {
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
          ...result.donation
        });
      } else {
        const statusCode = result.error?.includes('Campaign not found') ? 404 : 400;
        res.status(statusCode).json({
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

  // GET /api/v1/users/profile/donations
  static async getUserDonations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await donationService.getDonationHistory(req.user?.id || '', page, limit);

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

  // POST /api/v1/donations/:id/complete
  static async completeDonation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await donationService.completeDonation(id);

      if (result.success) {
        res.status(200).json({
          success: true,
          donation: result.donation
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

  // POST /api/v1/donations/:id/refund
  static async refundDonation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
        return;
      }

      const result = await donationService.refundDonation(id, req.user?.id || '');

      if (result.success) {
        res.status(200).json({
          success: true,
          donation: result.donation
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
}
