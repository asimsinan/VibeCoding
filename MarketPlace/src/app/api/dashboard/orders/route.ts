// Dashboard Orders API
// API endpoint for fetching recent orders for dashboard

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decodedToken: any;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.userId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    // Get recent orders for the user as seller
    const orders = await prisma.order.findMany({
      where: { sellerId: userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            images: true
          }
        },
        buyer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: `ORD-${order.id.slice(-6).toUpperCase()}`,
      customer: order.buyer.username,
      customerEmail: order.buyer.email,
      item: order.product.title,
      itemImage: order.product.images[0] || null,
      amount: `$${parseFloat(order.amount.toString()).toFixed(2)}`,
      status: order.status,
      date: order.createdAt.toISOString().split('T')[0],
      createdAt: order.createdAt
    }));

    return NextResponse.json({ success: true, data: formattedOrders });
  } catch (error) {
    console.error('Failed to fetch dashboard orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
