// Payments API - Create Intent
// API route for creating payment intents

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const CreatePaymentIntentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3).default('usd'),
  orderId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('Payment intent creation request received');
    
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
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate request body
    const validation = CreatePaymentIntentSchema.safeParse(body);
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

    const { amount, currency, orderId, metadata } = validation.data;
    console.log('Validated data:', { amount, currency, orderId, metadata });

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('STRIPE_SECRET_KEY not configured');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    // For now, create a simple payment intent directly with Stripe
    // This bypasses the complex PaymentManager for debugging
    console.log('Creating payment intent directly with Stripe...');
    
    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          ...metadata,
          userId: decodedToken.userId,
          ...(orderId && { orderId })
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      console.log('Payment intent created successfully:', paymentIntent.id);

      return NextResponse.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: amount,
          currency: currency,
          status: paymentIntent.status
        },
      });

    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      return NextResponse.json(
        { error: 'Failed to create payment intent: ' + (stripeError.message || 'Unknown error') },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}