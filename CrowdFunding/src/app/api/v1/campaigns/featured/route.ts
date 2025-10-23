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

// Featured campaigns endpoint
export async function GET() {
  try {
    // Get featured campaigns (campaigns marked as featured)
    const featuredCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
        isFeatured: true
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
        data: featuredCampaigns
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Featured campaigns error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
