// FAQ Page
// Frequently Asked Questions page

'use client';

import React, { useState } from 'react';
import { Card } from '../../components/ui/Card/Card';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqData: FAQItem[] = [
    // General Questions
    {
      id: 'general-1',
      question: 'What is MarketPlace?',
      answer: 'MarketPlace is a modern online marketplace platform where users can buy and sell products safely and securely. We provide a trusted environment for transactions with buyer and seller protection.',
      category: 'general'
    },
    {
      id: 'general-2',
      question: 'How do I create an account?',
      answer: 'Creating an account is free and easy. Click the "Register" button in the top navigation, fill out the registration form with your email and password, and verify your email address.',
      category: 'general'
    },
    {
      id: 'general-3',
      question: 'Is it free to use MarketPlace?',
      answer: 'Yes, creating an account and browsing products is completely free. We only charge small transaction fees when you make a sale, which helps us maintain the platform and provide customer support.',
      category: 'general'
    },

    // Buying Questions
    {
      id: 'buying-1',
      question: 'How do I buy a product?',
      answer: 'Browse our product listings, click on any item you\'re interested in, review the details and seller information, then click "Buy Now" to proceed with the purchase. You\'ll be guided through the secure checkout process.',
      category: 'buying'
    },
    {
      id: 'buying-2',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All payments are processed securely through our encrypted payment system.',
      category: 'buying'
    },
    {
      id: 'buying-3',
      question: 'How do I track my order?',
      answer: 'Once your order is confirmed, you\'ll receive a tracking number via email. You can also view your order status in your account dashboard under "My Orders".',
      category: 'buying'
    },
    {
      id: 'buying-4',
      question: 'What if I want to return a product?',
      answer: 'We offer a 30-day return policy for most items. Contact the seller first to discuss the return, then initiate a return request through your order history. The seller will provide return instructions.',
      category: 'buying'
    },

    // Selling Questions
    {
      id: 'selling-1',
      question: 'How do I sell my products?',
      answer: 'First, create a seller account and verify your identity. Then click "Sell Your Items" to list your first product. Add photos, descriptions, pricing, and shipping information. Your listing will go live after review.',
      category: 'selling'
    },
    {
      id: 'selling-2',
      question: 'What fees do sellers pay?',
      answer: 'We charge a small commission fee (typically 5-10%) only when you make a sale. There are no listing fees, monthly fees, or hidden charges. You only pay when you earn.',
      category: 'selling'
    },
    {
      id: 'selling-3',
      question: 'How do I get paid?',
      answer: 'Payments are processed automatically after the buyer confirms receipt of their order. You can choose to receive payments via bank transfer, PayPal, or check. Most payments are processed within 2-3 business days.',
      category: 'selling'
    },
    {
      id: 'selling-4',
      question: 'What if a buyer doesn\'t pay?',
      answer: 'We have automated payment collection systems in place. If a buyer doesn\'t complete payment within 48 hours, the order is automatically cancelled and your item remains available for other buyers.',
      category: 'selling'
    },

    // Safety & Security
    {
      id: 'safety-1',
      question: 'How do you protect buyers and sellers?',
      answer: 'We use encrypted payment processing, identity verification, and dispute resolution services. All transactions are monitored for suspicious activity, and we provide buyer and seller protection programs.',
      category: 'safety'
    },
    {
      id: 'safety-2',
      question: 'Is my personal information secure?',
      answer: 'Yes, we use industry-standard encryption to protect your personal and financial information. We never share your data with third parties without your consent, and we comply with all privacy regulations.',
      category: 'safety'
    },
    {
      id: 'safety-3',
      question: 'What should I do if I have a problem with a transaction?',
      answer: 'Contact our customer support team immediately. We have a dedicated dispute resolution process and will work with both parties to resolve any issues fairly and quickly.',
      category: 'safety'
    },

    // Shipping & Delivery
    {
      id: 'shipping-1',
      question: 'How does shipping work?',
      answer: 'Shipping is handled by individual sellers. Each product listing shows shipping options, costs, and estimated delivery times. Buyers can choose their preferred shipping method during checkout.',
      category: 'shipping'
    },
    {
      id: 'shipping-2',
      question: 'Do you ship internationally?',
      answer: 'Yes, many sellers offer international shipping. Check the product listing for shipping options to your country. International orders may take longer and have additional customs fees.',
      category: 'shipping'
    },
    {
      id: 'shipping-3',
      question: 'What if my package is lost or damaged?',
      answer: 'Contact the seller first to resolve the issue. If the seller doesn\'t respond or resolve the problem, contact our support team. We have insurance coverage for lost or damaged packages.',
      category: 'shipping'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Questions', count: faqData.length },
    { id: 'general', name: 'General', count: faqData.filter(item => item.category === 'general').length },
    { id: 'buying', name: 'Buying', count: faqData.filter(item => item.category === 'buying').length },
    { id: 'selling', name: 'Selling', count: faqData.filter(item => item.category === 'selling').length },
    { id: 'safety', name: 'Safety & Security', count: faqData.filter(item => item.category === 'safety').length },
    { id: 'shipping', name: 'Shipping & Delivery', count: faqData.filter(item => item.category === 'shipping').length },
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const categoryNames: { [key: string]: string } = {
    general: 'General Questions',
    buying: 'Buying',
    selling: 'Selling',
    safety: 'Safety & Security',
    shipping: 'Shipping & Delivery'
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="container-main py-8">
          <div className="text-center">
            <h1 className="text-responsive-2xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about buying, selling, and using our marketplace
            </p>
          </div>
        </div>
      </section>

      <div className="container-main py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card title="Categories">
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {filteredFAQs.map((item) => (
                <Card key={item.id} className="cursor-pointer" onClick={() => toggleItem(item.id)}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.question}
                      </h3>
                      {openItems.has(item.id) && (
                        <div className="mt-3">
                          <p className="text-gray-600 leading-relaxed">
                            {item.answer}
                          </p>
                          <div className="mt-2">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                              {categoryNames[item.category]}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          openItems.has(item.id) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* No results */}
            {filteredFAQs.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try selecting a different category.</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12">
          <Card className="bg-blue-50 border-blue-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Still have questions?
              </h3>
              <p className="text-blue-700 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-6 py-3 text-lg"
                >
                  Contact Support
                </a>
                <a
                  href="/help"
                  className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 focus:ring-blue-500 px-6 py-3 text-lg"
                >
                  Help Center
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
