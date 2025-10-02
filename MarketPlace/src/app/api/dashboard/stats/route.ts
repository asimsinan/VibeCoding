// Dashboard Stats API
// API endpoint for fetching dashboard statistics

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

    // Get user's products count
    const productCount = await prisma.product.count({
      where: { sellerId: userId }
    });

    // Get user's orders as seller
    const orders = await prisma.order.findMany({
      where: { sellerId: userId },
      select: { amount: true, status: true }
    });

    // Calculate total sales
    const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.amount.toString()), 0);

    // Count orders by status
    const completedOrders = orders.filter(order => order.status === 'DELIVERED').length;
    const pendingOrders = orders.filter(order => order.status === 'PENDING').length;
    const shippedOrders = orders.filter(order => order.status === 'SHIPPED').length;

    // Get user's messages count
    const messageCount = await prisma.contactMessage.count({
      where: { sellerId: userId }
    });

    // Get unread messages count
    const unreadMessageCount = await prisma.contactMessage.count({
      where: { 
        sellerId: userId,
        status: 'UNREAD'
      }
    });

    const stats = {
      totalSales: totalSales.toFixed(2),
      activeListings: productCount,
      ordersReceived: orders.length,
      completedOrders,
      pendingOrders,
      shippedOrders,
      messages: messageCount,
      unreadMessages: unreadMessageCount
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
