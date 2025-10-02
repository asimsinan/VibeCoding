'use client';

// Order Success Page
// Page shown after successful order completion

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Get order ID from URL params if available
    const id = searchParams.get('orderId');
    if (id) {
      setOrderId(id);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <div className="py-12 text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Successful!</h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your purchase. Your order has been processed successfully.
            </p>

            {/* Order ID */}
            {orderId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-500 mb-1">Order ID</p>
                <p className="text-lg font-mono text-gray-900">{orderId}</p>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">What's Next?</h3>
              <ul className="text-left text-blue-800 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">📧</span>
                  <span>You'll receive a confirmation email shortly</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">📦</span>
                  <span>Your order will be prepared and shipped</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">📱</span>
                  <span>You'll get tracking information via email</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                onClick={() => router.push('/')}
                className="px-8 py-3"
              >
                Continue Shopping
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/contact')}
                className="px-8 py-3"
              >
                Contact Support
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Need help? Contact our support team at{' '}
                <a href="mailto:support@marketplace.com" className="text-blue-600 hover:text-blue-800">
                  support@marketplace.com
                </a>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
