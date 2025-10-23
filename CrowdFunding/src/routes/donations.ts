import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { authenticate, authorize } from '../middleware/auth';
import { validateUUID, validatePagination } from '../middleware/validation';
import { DonationController } from '../controllers/donationController';

const router = Router();

// Donation routes
router.get('/profile/donations', authenticate, validatePagination, asyncHandler(DonationController.getUserDonations));
router.post('/:id/complete', authenticate, validateUUID('id'), asyncHandler(DonationController.completeDonation));
router.post('/:id/refund', authenticate, authorize(['ADMIN']), validateUUID('id'), asyncHandler(DonationController.refundDonation));

export default router;
