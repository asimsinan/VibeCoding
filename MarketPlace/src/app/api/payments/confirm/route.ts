// Payments API - Confirm Payment
// API route for confirming payment intents

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
// import { PaymentManager } from '../../../../lib/libraries/payment-processing';
import { prisma } from '../../../../lib/prisma';

// Validation schema
const ConfirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required'),
  paymentMethodId: z.string().min(1, 'Payment method ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const jwt = require('jsonwebtoken');
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validation = ConfirmPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { paymentIntentId, paymentMethodId } = validation.data;

    // Initialize payment manager
    const paymentManager = new PaymentManager(prisma, {
      stripeConfig: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        currency: 'usd',
        paymentMethods: ['card'],
      },
      supportedCurrencies: ['usd', 'eur', 'gbp'],
      supportedPaymentMethods: ['card'],
      maxAmount: 10000,
      minAmount: 0.50,
    });

    // Confirm payment intent
    const result = await paymentManager.confirmPaymentIntent({
      paymentIntentId,
      paymentMethodId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to confirm payment' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentIntent: result.data,
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
