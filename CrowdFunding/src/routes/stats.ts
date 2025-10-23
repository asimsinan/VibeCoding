import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/stats - Get platform statistics
router.get('/', asyncHandler(async (req, res) => {
  try {
    // Get total campaigns
    const totalCampaigns = await prisma.campaign.count();
    
    // Get total raised amount
    const totalRaisedResult = await prisma.campaign.aggregate({
      _sum: {
        current: true
      }
    });
    const totalRaised = totalRaisedResult._sum.current || 0;
    
    // Get total donations count
    const totalDonations = await prisma.donation.count();
    
    // Get total users
    const totalUsers = await prisma.user.count();
    
    // Get successful campaigns (completed)
    const successfulCampaigns = await prisma.campaign.count({
      where: {
        status: 'COMPLETED'
      }
    });
    
    // Calculate success rate
    const successRate = totalCampaigns > 0 ? Math.round((successfulCampaigns / totalCampaigns) * 100) : 0;
    
    res.json({
      success: true,
      data: {
        totalRaised,
        totalCampaigns,
        totalDonations,
        totalUsers,
        successRate
      }
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform statistics'
    });
  }
}));

export default router;
