'use client';

// Hero Section Component
// Client-side interactive hero section

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button/Button';

export function HeroSection() {
  const router = useRouter();

  const handleStartShopping = () => {
    // Navigate to products page
    router.push('/products');
  };

  const handleSellItems = () => {
    // Navigate to seller registration or product creation page
    router.push('/sell');
  };

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container-main py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-responsive-2xl font-bold mb-6">
            Welcome to MarketPlace
          </h1>
          <p className="text-responsive-lg mb-8 max-w-2xl mx-auto">
            Discover amazing products from sellers around the world. 
            Buy and sell with confidence in our secure marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleStartShopping}
            >
              Start Shopping
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleSellItems}
              className="bg-white text-blue-600 hover:bg-gray-50"
            >
              Sell Your Items
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
