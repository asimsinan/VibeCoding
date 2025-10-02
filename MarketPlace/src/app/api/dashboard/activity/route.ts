// Dashboard Activity API
// API endpoint for fetching recent activity for dashboard

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

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: { sellerId: userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { title: true } }
      }
    });

    // Get recent messages
    const recentMessages = await prisma.contactMessage.findMany({
      where: { sellerId: userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { title: true } }
      }
    });

    // Get recent products (user's own products)
    const recentProducts = await prisma.product.findMany({
      where: { sellerId: userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, createdAt: true }
    });

    // Combine and format activities
    const activities: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: Date;
      icon: string;
      color: string;
    }> = [];

    // Add order activities
    recentOrders.forEach(order => {
      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        title: `Order ${order.status.toLowerCase()}`,
        description: order.status === 'DELIVERED' 
          ? `Payment received for ${order.product.title}`
          : order.status === 'SHIPPED'
          ? `${order.product.title} has been shipped`
          : `New order received for ${order.product.title}`,
        timestamp: order.createdAt,
        icon: order.status === 'DELIVERED' ? '✓' : order.status === 'SHIPPED' ? '📦' : '📋',
        color: order.status === 'DELIVERED' ? 'green' : order.status === 'SHIPPED' ? 'blue' : 'yellow'
      });
    });

    // Add message activities
    recentMessages.forEach(message => {
      activities.push({
        id: `message-${message.id}`,
        type: 'message',
        title: 'New message received',
        description: message.product 
          ? `Question about ${message.product.title}`
          : `General inquiry: ${message.subject}`,
        timestamp: message.createdAt,
        icon: '💬',
        color: 'purple'
      });
    });

    // Add product activities
    recentProducts.forEach(product => {
      activities.push({
        id: `product-${product.id}`,
        type: 'product',
        title: 'New listing published',
        description: `${product.title} is now live`,
        timestamp: product.createdAt,
        icon: '📦',
        color: 'blue'
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({ success: true, data: limitedActivities });
  } catch (error) {
    console.error('Failed to fetch dashboard activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
