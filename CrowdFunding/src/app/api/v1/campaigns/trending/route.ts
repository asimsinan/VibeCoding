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

// Trending campaigns endpoint
export async function GET() {
  try {
    // Get trending campaigns (campaigns with most donations in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        donations: {
          some: {
            createdAt: {
              gte: sevenDaysAgo
            }
          }
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            donations: true
          }
        }
      },
      orderBy: [
        { current: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 6
    });

    return NextResponse.json(
      {
        success: true,
        data: trendingCampaigns
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Trending campaigns error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
