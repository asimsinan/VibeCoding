import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
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

// Handle all campaign operations by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
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
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get unique donors count
    const uniqueDonorsCount = await prisma.donation.groupBy({
      by: ['donorId'],
      where: { campaignId: id },
      _count: { donorId: true }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...campaign,
          goal: Number(campaign.goal),
          current: Number(campaign.current),
          stats: {
            uniqueDonors: uniqueDonorsCount.length,
            totalDonations: campaign._count.donations
          }
        }
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Get campaign error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Update campaign endpoint
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
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
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    // Get request body
    const body = await request.json();
    const { status, title, description, goal, deadline, category, images } = body;

    console.log('Update campaign request:', { id, userId, body });

    // Check if campaign exists and user owns it
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (existingCampaign.ownerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (goal) updateData.goal = parseFloat(goal);
    if (deadline) updateData.deadline = new Date(deadline);
    if (category) updateData.category = category;
    if (images) updateData.images = images;

    console.log('Update data prepared:', updateData);

    // Update campaign
    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            donations: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        campaign: {
          ...campaign,
          goal: Number(campaign.goal),
          current: Number(campaign.current),
        },
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Update campaign error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update campaign' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Delete campaign endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
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
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    // Check if campaign exists and user owns it
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
      select: { ownerId: true }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (existingCampaign.ownerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Delete campaign
    await prisma.campaign.delete({
      where: { id }
    });

    return NextResponse.json(
      { success: true, message: 'Campaign deleted successfully' },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Delete campaign error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' },
      { status: 500, headers: corsHeaders }
    );
  }
}
