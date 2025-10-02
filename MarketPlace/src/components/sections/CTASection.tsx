'use client';

// CTA Section Component
// Client-side interactive CTA section

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button/Button';

export function CTASection() {
  const router = useRouter();

  const handleSignUp = () => {
    // Navigate to registration page
    router.push('/register');
  };

  const handleLearnMore = () => {
    // Navigate to about page or scroll to how it works section
    router.push('/about');
  };

  return (
    <section className="py-16 bg-blue-600 text-white">
      <div className="container-main text-center">
        <h2 className="text-responsive-xl font-bold mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-responsive mb-8 max-w-2xl mx-auto">
          Join thousands of buyers and sellers who trust our marketplace for their online transactions
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleSignUp}
            className="bg-white text-blue-600 hover:bg-gray-50"
          >
            Sign Up Free
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleLearnMore}
            className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
