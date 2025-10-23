import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Stats endpoint
export async function GET() {
  try {
    // Get platform statistics
    const [
      totalRaised,
      totalCampaigns,
      totalDonations,
      totalUsers,
      completedCampaigns
    ] = await Promise.all([
      prisma.donation.aggregate({
        _sum: { amount: true }
      }),
      prisma.campaign.count(),
      prisma.donation.count(),
      prisma.user.count(),
      prisma.campaign.count({
        where: { status: 'COMPLETED' }
      })
    ]);

    const successRate = totalCampaigns > 0 ? (completedCampaigns / totalCampaigns) * 100 : 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          totalRaised: totalRaised._sum.amount || 0,
          totalCampaigns,
          totalDonations,
          totalUsers,
          successRate: Math.round(successRate)
        }
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
