// Shipping Page
// Shipping and delivery information page

'use client';

import React from 'react';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';

export default function ShippingPage() {
  const shippingOptions = [
    {
      name: 'Standard Shipping',
      description: 'Regular delivery within 5-7 business days',
      price: '$4.99',
      timeframe: '5-7 business days',
      features: ['Tracking included', 'Insurance up to $100', 'Delivery confirmation']
    },
    {
      name: 'Express Shipping',
      description: 'Fast delivery within 2-3 business days',
      price: '$9.99',
      timeframe: '2-3 business days',
      features: ['Priority handling', 'Insurance up to $500', 'Signature required']
    },
    {
      name: 'Overnight Shipping',
      description: 'Next business day delivery',
      price: '$19.99',
      timeframe: '1 business day',
      features: ['Express processing', 'Full insurance', 'Guaranteed delivery']
    },
    {
      name: 'International Shipping',
      description: 'Worldwide delivery options',
      price: 'Varies by destination',
      timeframe: '7-21 business days',
      features: ['Customs handling', 'International tracking', 'Duty calculation']
    }
  ];

  const shippingZones = [
    {
      zone: 'Domestic',
      countries: ['United States', 'Canada'],
      timeframe: '3-7 business days',
      cost: 'Starting at $4.99'
    },
    {
      zone: 'North America',
      countries: ['Mexico', 'Central America'],
      timeframe: '5-10 business days',
      cost: 'Starting at $12.99'
    },
    {
      zone: 'Europe',
      countries: ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain'],
      timeframe: '7-14 business days',
      cost: 'Starting at $15.99'
    },
    {
      zone: 'Asia Pacific',
      countries: ['Japan', 'Australia', 'South Korea', 'Singapore'],
      timeframe: '10-21 business days',
      cost: 'Starting at $18.99'
    },
    {
      zone: 'Rest of World',
      countries: ['All other countries'],
      timeframe: '14-28 business days',
      cost: 'Starting at $22.99'
    }
  ];

  const trackingSteps = [
    {
      step: 1,
      title: 'Order Confirmed',
      description: 'Your order is received and payment is processed',
      icon: '📦'
    },
    {
      step: 2,
      title: 'Item Prepared',
      description: 'Seller prepares your item for shipment',
      icon: '📋'
    },
    {
      step: 3,
      title: 'Shipped',
      description: 'Package is picked up and tracking number is provided',
      icon: '🚚'
    },
    {
      step: 4,
      title: 'In Transit',
      description: 'Your package is on its way to you',
      icon: '✈️'
    },
    {
      step: 5,
      title: 'Delivered',
      description: 'Package arrives at your specified address',
      icon: '🏠'
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="container-main py-8">
          <div className="text-center">
            <h1 className="text-responsive-2xl font-bold text-gray-900 mb-4">
              Shipping & Delivery
            </h1>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Fast, reliable shipping options to get your purchases delivered safely and on time
            </p>
          </div>
        </div>
      </section>

      <div className="container-main py-8">
        {/* Shipping Options */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-4">
              Shipping Options
            </h2>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Choose the shipping method that best fits your needs and budget
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shippingOptions.map((option, index) => (
              <Card key={index} className="h-full">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {option.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {option.description}
                  </p>
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {option.price}
                    </div>
                    <div className="text-sm text-gray-500">
                      {option.timeframe}
                    </div>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    {option.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Shipping Zones */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-4">
              International Shipping
            </h2>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              We ship worldwide with competitive rates and reliable delivery times
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shippingZones.map((zone, index) => (
              <Card key={index}>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {zone.zone}
                  </h3>
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Countries:</h4>
                    <p className="text-sm text-gray-600">
                      {zone.countries.join(', ')}
                    </p>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-1">Delivery Time:</h4>
                    <p className="text-sm text-gray-600">{zone.timeframe}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Cost:</h4>
                    <p className="text-sm text-gray-600">{zone.cost}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Tracking Process */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-4">
              Order Tracking
            </h2>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Track your order from confirmation to delivery with real-time updates
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {trackingSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">{step.icon}</span>
                    </div>
                    {index < trackingSteps.length - 1 && (
                      <div className="hidden md:block absolute top-8 left-16 w-full h-0.5 bg-gray-300"></div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shipping Policies */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-4">
              Shipping Policies
            </h2>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Important information about our shipping terms and conditions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Shipping Terms">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Processing Time</h4>
                  <p className="text-sm text-gray-600">
                    Most orders are processed within 1-2 business days. Custom or handmade items may take longer.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Confirmation</h4>
                  <p className="text-sm text-gray-600">
                    All packages include delivery confirmation. Signature may be required for high-value items.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Address Changes</h4>
                  <p className="text-sm text-gray-600">
                    Address changes must be made before shipment. Contact support immediately if needed.
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Lost or Damaged Packages">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Package Protection</h4>
                  <p className="text-sm text-gray-600">
                    All packages are insured. Contact us within 48 hours if your package is lost or damaged.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Claims Process</h4>
                  <p className="text-sm text-gray-600">
                    We'll investigate and provide a replacement or full refund for covered incidents.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Weather Delays</h4>
                  <p className="text-sm text-gray-600">
                    Severe weather may cause delays. We'll keep you updated on any significant delays.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Contact Support */}
        <section>
          <Card className="bg-blue-50 border-blue-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Need Help with Shipping?
              </h3>
              <p className="text-blue-700 mb-4">
                Have questions about shipping options, tracking, or delivery issues? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="primary"
                  size="lg"
                  onClick={() => window.location.href = '/contact'}
                >
                  Contact Support
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => window.location.href = '/faq'}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  View FAQ
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
