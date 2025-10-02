// API Route: POST /api/v1/payments/create-intent
// Payment intent creation endpoint

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
// import { PaymentManager } from '@/lib/libraries/payment-processing/PaymentManager';
// import { ProductModelValidator } from '../../../lib/model-validators';


// Request validation schema
const CreatePaymentIntentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('usd'),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'paypal', 'stripe']),
  metadata: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate request data
    const validationResult = CreatePaymentIntentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { orderId, amount, currency, metadata } = validationResult.data;

    // Additional validation
    const priceValidation = ProductModelValidator.validatePrice(amount);
    if (!priceValidation.success) {
      return NextResponse.json(
        { error: 'Invalid amount format', details: priceValidation.errors },
        { status: 400 }
      );
    }

    // Create payment intent using Stripe directly
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: {
        orderId,
        ...metadata,
      },
    });

    return NextResponse.json(
      {
        message: 'Payment intent created successfully',
        paymentIntent,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[API] Create payment intent error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create payment intent',
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
