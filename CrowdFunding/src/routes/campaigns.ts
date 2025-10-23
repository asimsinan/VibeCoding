import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authenticate, authorize } from '../middleware/auth';
import { validateUUID, validatePagination, validateBody } from '../middleware/validation';
import { CampaignController } from '../controllers/campaignController';
import { DonationController } from '../controllers/donationController';
import { CommentController } from '../controllers/commentController';
import { 
  CreateCampaignDto, 
  UpdateCampaignDto, 
  CreateDonationDto, 
  CreateCommentDto 
} from '../dto';

const router = Router();

// Campaign routes
router.get('/', validatePagination, asyncHandler(CampaignController.getCampaigns));
router.get('/my-campaigns', authenticate, validatePagination, asyncHandler(CampaignController.getMyCampaigns));
router.get('/featured', asyncHandler(CampaignController.getFeaturedCampaigns));
router.get('/trending', asyncHandler(CampaignController.getTrendingCampaigns));
router.post('/', authenticate, validateBody(CreateCampaignDto), asyncHandler(CampaignController.createCampaign));
router.get('/:id', validateUUID('id'), asyncHandler(CampaignController.getCampaignById));
router.put('/:id', authenticate, authorize(['USER'], 'id'), validateUUID('id'), validateBody(UpdateCampaignDto), asyncHandler(CampaignController.updateCampaign));
router.delete('/:id', authenticate, authorize(['USER'], 'id'), validateUUID('id'), asyncHandler(CampaignController.deleteCampaign));

// Donation routes
router.post('/:id/donations', authenticate, validateUUID('id'), validateBody(CreateDonationDto), asyncHandler(DonationController.createDonation));
router.post('/:id/donate', authenticate, validateUUID('id'), validateBody(CreateDonationDto), asyncHandler(DonationController.createDonation)); // Alias for /donations
router.get('/:id/donations', validateUUID('id'), validatePagination, asyncHandler(DonationController.getCampaignDonations));

// Comment routes
router.get('/:id/comments', validateUUID('id'), validatePagination, asyncHandler(CommentController.getCampaignComments));
router.post('/:id/comments', authenticate, validateUUID('id'), validateBody(CreateCommentDto), asyncHandler(CommentController.createComment));

export default router;