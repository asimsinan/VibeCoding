'use client';

// Stripe Payment Form Component
// Component for handling Stripe payments

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '../ui/Button/Button';
import { ErrorMessage } from '../ui/ErrorMessage';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripePaymentFormProps {
  amount: number;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

function PaymentForm({ amount, onSuccess, onError, disabled }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).accessToken : ''}`
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create payment intent');
      }

      const { paymentIntent } = responseData;

      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          }
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (confirmedPayment.status === 'succeeded') {
        onSuccess(confirmedPayment);
      } else {
        throw new Error('Payment was not successful');
      }

    } catch (err) {
      let errorMessage = 'Payment failed';
      
      if (err instanceof Error) {
        // Provide more helpful error messages
        if (err.message.includes('Your card number is invalid')) {
          errorMessage = 'Please check your card number and try again. Use test card: 4242 4242 4242 4242';
        } else if (err.message.includes('Your card has expired')) {
          errorMessage = 'Please check your card expiry date and try again.';
        } else if (err.message.includes('Your card\'s security code is incorrect')) {
          errorMessage = 'Please check your CVC code and try again.';
        } else if (err.message.includes('Your card was declined')) {
          errorMessage = 'Your card was declined. Please try a different card or contact your bank.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-300 rounded-md">
        <CardElement options={cardElementOptions} />
      </div>
      
      {error && <ErrorMessage error={error} />}
      
      <Button
        type="submit"
        variant="primary"
        disabled={!stripe || isProcessing || (disabled ?? false)}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Processing Payment...
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}

export function StripePaymentForm({ amount, onSuccess, onError, disabled }: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        disabled={disabled ?? false}
      />
    </Elements>
  );
}
