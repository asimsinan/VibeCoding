// Orders API - Create Order
// API route for creating orders after successful payment

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../lib/prisma';

// Validation schema
const CreateOrderSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('usd'),
  paymentIntentId: z.string().optional(),
  billingInfo: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
});

export async function POST(request: NextRequest) {
  try {
    console.log('Order creation request received');
    
    // Check authentication
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      console.log('No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decodedToken: any;
    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.log('Invalid token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate request body
    const validation = CreateOrderSchema.safeParse(body);
    if (!validation.success) {
      console.log('Validation failed:', validation.error.errors);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { productId, amount, currency, paymentIntentId } = validation.data;

    // Get product details to find seller
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        title: true,
        price: true,
        sellerId: true,
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        }
      }
    });

    if (!product) {
      console.log('Product not found:', productId);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Create order
    console.log('Creating order...');
    const order = await prisma.order.create({
      data: {
        buyerId: decodedToken.userId,
        sellerId: product.sellerId,
        productId: product.id,
        amount: amount,
        currency: currency,
        status: 'PENDING',
        paymentIntentId: paymentIntentId || null,
      },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        },
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
          }
        }
      }
    });

    console.log('Order created successfully:', order.id);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
        buyer: order.buyer,
        seller: order.seller,
        product: order.product,
        paymentIntentId: order.paymentIntentId,
      },
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
