// Checkout Page
// Checkout page for processing orders

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../lib/contexts/CartContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { Input } from '../../components/ui/Input/Input';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StripePaymentForm } from '../../components/payment/StripePaymentForm';

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, totalItems, totalPrice, isLoading: cartLoading, clearCart } = useCart();
  const { isAuthenticated, isLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, isLoading, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      setIsProcessing(true);
      setError(null);

      // Create orders for each item in cart
      const orderPromises = cartItems.map(async (item) => {
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).accessToken : ''}`
          },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
            amount: item.price * item.quantity,
            currency: 'usd',
            paymentIntentId: paymentIntent.id,
            billingInfo: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode,
              country: formData.country,
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create order');
        }

        return response.json();
      });

      // Wait for all orders to be created
      const orders = await Promise.all(orderPromises);
      console.log('Orders created:', orders);

      // Here you would typically:
      // 1. Send confirmation emails
      // 2. Update inventory
      // 3. Send notifications to sellers
      
      // Set success state first, then clear cart and redirect
      setSuccess(true);
      
      // Clear cart and redirect after a short delay to show success message
      setTimeout(() => {
        clearCart();
        router.push('/order-success');
      }, 2000); // Reduced from 3 seconds to 2 seconds
    } catch (err) {
      console.error('Error creating orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to process order. Please try again.');
      setIsProcessing(false); // Only set processing to false on error
    }
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  // Show loading while checking authentication, loading cart, or processing payment
  if (isLoading || cartLoading || isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {isProcessing ? 'Processing your order...' : 'Loading checkout...'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Redirect if cart is empty
  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
          <Button
            variant="primary"
            onClick={() => router.push('/')}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-main">
          <div className="max-w-2xl mx-auto text-center">
            <Card title="Order Successful!">
              <div className="py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you for your order!</h2>
                <p className="text-gray-600 mb-6">
                  Your payment has been processed successfully and your order has been created. You will receive a confirmation email shortly.
                </p>
                <div className="flex items-center justify-center mb-6">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <p className="text-sm text-gray-500">
                    Redirecting to order confirmation...
                  </p>
                </div>
                <div className="mt-6 flex justify-center space-x-4">
                  <Button variant="primary" onClick={() => {
                    clearCart();
                    router.push('/');
                  }}>
                    Continue Shopping
                  </Button>
                  <Button variant="outline" onClick={() => {
                    clearCart();
                    router.push('/contact');
                  }}>
                    Contact Support
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-main">
          <div className="max-w-2xl mx-auto text-center">
            <Card title="Your cart is empty">
              <div className="py-12">
                <p className="text-gray-600 mb-6">
                  You need to add items to your cart before proceeding to checkout.
                </p>
                <Button variant="primary" onClick={() => router.push('/products')}>
                  Continue Shopping
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-main">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div>
            <Card title="Billing Information">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.firstName}
                      onChange={(value) => handleInputChange('firstName', value)}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.lastName}
                      onChange={(value) => handleInputChange('lastName', value)}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(value) => handleInputChange('email', value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(value) => handleInputChange('phone', value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <Input
                    type="text"
                    value={formData.address}
                    onChange={(value) => handleInputChange('address', value)}
                    placeholder="Enter street address"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <Input
                      type="text"
                      value={formData.city}
                      onChange={(value) => handleInputChange('city', value)}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <Input
                      type="text"
                      value={formData.state}
                      onChange={(value) => handleInputChange('state', value)}
                      placeholder="State"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <Input
                      type="text"
                      value={formData.zipCode}
                      onChange={(value) => handleInputChange('zipCode', value)}
                      placeholder="ZIP"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Information
                  </label>
                  <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
                    <p className="text-sm text-gray-600 mb-3">
                      Secure payment powered by Stripe
                    </p>
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-800 font-medium mb-2">Test Card Numbers:</p>
                      <div className="text-xs text-blue-700 space-y-1">
                        <div>Visa: 4242 4242 4242 4242</div>
                        <div>Mastercard: 5555 5555 5555 4444</div>
                        <div>Expiry: Any future date | CVC: Any 3 digits</div>
                      </div>
                    </div>
                    <StripePaymentForm
                      amount={totalPrice}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <ErrorMessage error={error} onDismiss={() => setError(null)} />
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card title="Order Summary">
              <div className="space-y-4">
                <div className="space-y-3">
                  {cartItems?.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">No Image</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="border-gray-200" />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{formatPrice(totalPrice * 0.08)}</span>
                  </div>
                </div>

                <hr className="border-gray-200" />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice * 1.08)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
