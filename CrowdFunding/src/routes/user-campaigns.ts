import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authenticate } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';
import { CampaignController } from '../controllers/campaignController';

const router = Router();

// User campaigns route
router.get('/my-campaigns', authenticate, validatePagination, asyncHandler(CampaignController.getMyCampaigns));

export default router;
