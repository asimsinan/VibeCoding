// Returns Page
// Returns and refunds information page

'use client';

import React, { useState } from 'react';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';

export default function ReturnsPage() {
  const [selectedReason, setSelectedReason] = useState<string>('');

  const returnReasons = [
    {
      id: 'defective',
      title: 'Defective or Damaged Item',
      description: 'Item arrived broken, damaged, or not working properly',
      timeframe: '30 days',
      refundType: 'Full refund + return shipping'
    },
    {
      id: 'wrong-item',
      title: 'Wrong Item Received',
      description: 'Received a different item than what was ordered',
      timeframe: '30 days',
      refundType: 'Full refund + return shipping'
    },
    {
      id: 'not-as-described',
      title: 'Not as Described',
      description: 'Item significantly differs from the listing description',
      timeframe: '30 days',
      refundType: 'Full refund + return shipping'
    },
    {
      id: 'changed-mind',
      title: 'Changed My Mind',
      description: 'No longer want the item (must be in original condition)',
      timeframe: '14 days',
      refundType: 'Refund minus return shipping'
    },
    {
      id: 'size-issue',
      title: 'Size Doesn\'t Fit',
      description: 'Clothing or shoes don\'t fit as expected',
      timeframe: '14 days',
      refundType: 'Refund minus return shipping'
    },
    {
      id: 'late-delivery',
      title: 'Late Delivery',
      description: 'Item arrived significantly later than promised',
      timeframe: '7 days after expected delivery',
      refundType: 'Partial refund or full refund'
    }
  ];

  const returnSteps = [
    {
      step: 1,
      title: 'Initiate Return',
      description: 'Contact the seller or use our return portal to start the process',
      icon: '📝',
      timeframe: 'Immediately'
    },
    {
      step: 2,
      title: 'Get Return Authorization',
      description: 'Receive return instructions and authorization number',
      icon: '✅',
      timeframe: '1-2 business days'
    },
    {
      step: 3,
      title: 'Package Item',
      description: 'Pack the item securely with original packaging if possible',
      icon: '📦',
      timeframe: 'Same day'
    },
    {
      step: 4,
      title: 'Ship Return',
      description: 'Send the package using provided return label or method',
      icon: '🚚',
      timeframe: 'Within 5 days'
    },
    {
      step: 5,
      title: 'Receive Refund',
      description: 'Get your refund once the seller receives and processes the return',
      icon: '💰',
      timeframe: '3-5 business days'
    }
  ];

  const refundMethods = [
    {
      method: 'Original Payment Method',
      description: 'Refunded to the same card or account used for purchase',
      timeframe: '3-5 business days',
      icon: '💳'
    },
    {
      method: 'Store Credit',
      description: 'Credit added to your MarketPlace account balance',
      timeframe: 'Immediate',
      icon: '🎁'
    },
    {
      method: 'Bank Transfer',
      description: 'Direct transfer to your bank account',
      timeframe: '5-7 business days',
      icon: '🏦'
    },
    {
      method: 'PayPal',
      description: 'Refunded to your PayPal account',
      timeframe: '1-3 business days',
      icon: '💼'
    }
  ];

  const returnPolicies = [
    {
      category: 'Eligible Items',
      items: [
        'Items in original condition with tags',
        'Items within return timeframe',
        'Items with valid return reason',
        'Items from verified sellers'
      ]
    },
    {
      category: 'Non-Returnable Items',
      items: [
        'Personalized or custom items',
        'Perishable goods',
        'Digital products',
        'Items damaged by buyer',
        'Items returned after timeframe'
      ]
    },
    {
      category: 'Return Conditions',
      items: [
        'Original packaging preferred',
        'All accessories included',
        'No signs of wear or use',
        'Return label properly attached'
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="container-main py-8">
          <div className="text-center">
            <h1 className="text-responsive-2xl font-bold text-gray-900 mb-4">
              Returns & Refunds
            </h1>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Easy returns and fast refunds. We make it simple to return items that don't work for you.
            </p>
          </div>
        </div>
      </section>

      <div className="container-main py-8">
        {/* Return Reasons */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-4">
              Return Reasons
            </h2>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Select your reason for returning an item to see applicable policies and timeframes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {returnReasons.map((reason) => (
              <Card 
                key={reason.id} 
                className={`cursor-pointer transition-all ${
                  selectedReason === reason.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-lg'
                }`}
                onClick={() => setSelectedReason(reason.id)}
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {reason.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {reason.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Timeframe:</span>
                      <span className="text-sm text-gray-600">{reason.timeframe}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Refund:</span>
                      <span className="text-sm text-gray-600">{reason.refundType}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Return Process */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-4">
              How to Return an Item
            </h2>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Follow these simple steps to return your item and get your refund
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {returnSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">{step.icon}</span>
                    </div>
                    {index < returnSteps.length - 1 && (
                      <div className="hidden md:block absolute top-8 left-16 w-full h-0.5 bg-gray-300"></div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {step.description}
                  </p>
                  <div className="text-xs text-gray-500">
                    {step.timeframe}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Refund Methods */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-4">
              Refund Methods
            </h2>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Choose how you'd like to receive your refund
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {refundMethods.map((method, index) => (
              <Card key={index}>
                <div className="text-center">
                  <div className="text-3xl mb-3">{method.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {method.method}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {method.description}
                  </p>
                  <div className="text-sm text-gray-500">
                    {method.timeframe}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Return Policies */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-4">
              Return Policies
            </h2>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Important information about what can and cannot be returned
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {returnPolicies.map((policy, index) => (
              <Card key={index} title={policy.category}>
                <ul className="space-y-2">
                  {policy.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <svg 
                        className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${
                          policy.category === 'Non-Returnable Items' 
                            ? 'text-red-500' 
                            : 'text-green-500'
                        }`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        {policy.category === 'Non-Returnable Items' ? (
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        )}
                      </svg>
                      <span className="text-sm text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-4">
              Need to Return Something?
            </h2>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Start your return process or get help with any return-related questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Start a Return
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Initiate a return for any eligible item in your order history
              </p>
              <Button variant="primary" size="sm" className="w-full">
                Return Item
              </Button>
            </Card>

            <Card className="text-center">
              <div className="text-3xl mb-4">📞</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Contact Support
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Get help with returns, refunds, or any other questions
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.location.href = '/contact'}
              >
                Contact Us
              </Button>
            </Card>

            <Card className="text-center">
              <div className="text-3xl mb-4">❓</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                View FAQ
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Find answers to common return and refund questions
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.location.href = '/faq'}
              >
                View FAQ
              </Button>
            </Card>
          </div>
        </section>

        {/* Important Notes */}
        <section>
          <Card className="bg-yellow-50 border-yellow-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Important Return Information
              </h3>
              <div className="text-yellow-800 space-y-2">
                <p>• Returns must be initiated within the specified timeframe for your reason</p>
                <p>• Items must be in original condition with all accessories included</p>
                <p>• Return shipping costs may apply depending on the return reason</p>
                <p>• Refunds are processed within 3-5 business days after we receive your return</p>
                <p>• For defective items, we cover all return shipping costs</p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
