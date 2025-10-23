import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const userId = decoded.userId;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { ownerId: userId };
    if (status && status !== '') {
      where.status = status;
    }

    // Get campaigns
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.campaign.count({ where }),
    ]);

    // Convert Decimal to number for JSON serialization
    const campaignsWithNumbers = campaigns.map(campaign => ({
      ...campaign,
      goal: Number(campaign.goal),
      current: Number(campaign.current),
    }));

    return NextResponse.json({
      success: true,
      data: campaignsWithNumbers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching user campaigns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
