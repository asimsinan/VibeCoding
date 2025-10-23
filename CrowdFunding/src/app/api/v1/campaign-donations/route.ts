import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

// Get donations for a campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const skip = (page - 1) * limit;

    const donations = await prisma.donation.findMany({
      where: { campaignId },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.donation.count({
      where: { campaignId }
    });

    return NextResponse.json(
      {
        success: true,
        data: donations.map(donation => ({
          ...donation,
          amount: Number(donation.amount)
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Get donations error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Create a new donation
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401, headers: corsHeaders });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const donorId = decoded.userId;

    // Get request body
    const body = await request.json();
    const { amount, message, isAnonymous, paymentMethod } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid donation amount is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if campaign exists and is active
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { status: true, ownerId: true }
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Campaign is not active' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if user is trying to donate to their own campaign
    if (campaign.ownerId === donorId) {
      return NextResponse.json(
        { success: false, error: 'Cannot donate to your own campaign' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create donation
    const donation = await prisma.donation.create({
      data: {
        amount: parseFloat(amount),
        message: message || '',
        isAnonymous: isAnonymous || false,
        paymentMethod: paymentMethod || 'CREDIT_CARD',
        campaignId,
        donorId,
        status: 'COMPLETED'
      },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    // Update campaign current amount
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        current: {
          increment: parseFloat(amount)
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...donation,
          amount: Number(donation.amount)
        }
      },
      { status: 201, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Create donation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create donation' },
      { status: 500, headers: corsHeaders }
    );
  }
}
