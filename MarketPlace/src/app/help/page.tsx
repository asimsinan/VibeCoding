// Help Page
// Help and support page

import React from 'react';
import { Card } from '../../components/ui/Card/Card';

export default function HelpPage() {
  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Click the "Register" button in the top right corner and fill out the registration form with your details.',
    },
    {
      question: 'How do I list a product?',
      answer: 'After logging in, go to your dashboard and click "Add New Product" to create a listing.',
    },
    {
      question: 'How do I make a purchase?',
      answer: 'Browse products, click on one you like, and use the "Add to Cart" or "Buy Now" button.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and other secure payment methods through Stripe.',
    },
    {
      question: 'How do I contact a seller?',
      answer: 'Use the "Contact Seller" button on any product page to send a message to the seller.',
    },
    {
      question: 'What is your return policy?',
      answer: 'Returns are handled on a case-by-case basis. Contact the seller directly to discuss returns.',
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Help & Support</h1>
      
      <div className="max-w-4xl mx-auto">
        <Card title="Frequently Asked Questions" className="mb-8">
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Contact Support">
            <p className="text-gray-600 mb-4">
              Need more help? Contact our support team for assistance.
            </p>
            <a
              href="/contact"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Contact Us
            </a>
          </Card>

          <Card title="Documentation">
            <p className="text-gray-600 mb-4">
              Check out our comprehensive documentation for detailed guides.
            </p>
            <a
              href="#"
              className="inline-block px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              View Docs
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
