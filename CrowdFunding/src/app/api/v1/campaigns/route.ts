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

// Create campaign endpoint
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401, headers: corsHeaders });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const userId = decoded.userId;

    // Get request body
    const body = await request.json();
    const { title, description, goal, deadline, category, images } = body;

    // Validate required fields
    if (!title || !description || !goal || !deadline || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        goal: parseFloat(goal),
        deadline: new Date(deadline),
        category,
        images: images || [],
        ownerId: userId,
        status: 'DRAFT',
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
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
    console.error('Create campaign error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Get campaigns endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get campaigns with pagination
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
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
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.campaign.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: campaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Campaigns error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
