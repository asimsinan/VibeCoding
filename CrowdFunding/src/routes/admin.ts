import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authenticate, authorize } from '../middleware/auth';
import { validateUUID, validatePagination, validateBody } from '../middleware/validation';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { PrismaClient } from '@prisma/client';
import { UpdateCampaignStatusDto } from '../dto';

const router = Router();
const prisma = new PrismaClient();
const campaignRepository = new CampaignRepository(prisma);

// GET /admin/campaigns - List all campaigns for admin
router.get('/campaigns',
  authenticate,
  authorize(['ADMIN']),
  validatePagination,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as any;

    const result = await campaignRepository.findAll({
      page,
      limit,
      status
    });
    
    res.json({
      success: true,
      campaigns: result.campaigns,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });
  })
);

// PUT /admin/campaigns/:id/status - Update campaign status
router.put('/campaigns/:id/status',
  authenticate,
  authorize(['ADMIN']),
  validateUUID('id'),
  validateBody(UpdateCampaignStatusDto),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    const user = (req as any).user;

    try {
      const campaign = await campaignRepository.updateStatus(id, status, user.id);
      res.json({
        success: true,
        id: campaign.id,
        status: campaign.status,
        reason: reason || null,
        updatedAt: campaign.updatedAt
      });
    } catch (error: any) {
      if (error.message === 'Campaign not found') {
        res.status(404).json({ 
          success: false,
          error: 'Campaign not found' 
        });
        return;
      }
      throw error;
    }
  })
);

export default router;