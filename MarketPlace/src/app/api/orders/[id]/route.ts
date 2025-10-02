// Order API Route
// API route for individual order operations

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    
    // Get order by ID from database
    const order = {
      id,
      product: {
        id: '1',
        title: 'Sample Product',
        images: [],
      },
      buyer: {
        id: '1',
        username: 'buyer',
        email: 'buyer@example.com',
      },
      seller: {
        id: '2',
        username: 'seller',
        email: 'seller@example.com',
      },
      amount: 99.99,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Update order
    const order = {
      id,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
