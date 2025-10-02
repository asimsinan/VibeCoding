'use client';

// Categories Section Component
// Client-side interactive categories section

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCategoryCounts } from '../../lib/hooks/useCategoryCounts';

export function CategoriesSection() {
  const router = useRouter();
  const { isLoading, getCountForCategory } = useCategoryCounts();

  const categories = [
    { name: 'Electronics', icon: '📱', slug: 'Electronics' },
    { name: 'Clothing', icon: '👕', slug: 'Clothing' },
    { name: 'Home & Garden', icon: '🏠', slug: 'Home & Garden' },
    { name: 'Books', icon: '📚', slug: 'Books' },
    { name: 'Sports', icon: '⚽', slug: 'Sports' },
    { name: 'Automotive', icon: '🚗', slug: 'Automotive' },
    { name: 'Toys & Games', icon: '🎮', slug: 'Toys & Games' },
    { name: 'Health & Beauty', icon: '💄', slug: 'Health & Beauty' },
  ];

  const handleCategoryClick = (categorySlug: string) => {
    // Navigate to products page with category filter
    router.push(`/products?category=${categorySlug}`);
  };

  return (
    <section className="py-16 bg-white">
      <div className="container-main">
        <div className="text-center mb-12">
          <h2 className="text-responsive-xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
            Browse products by category to find exactly what you&apos;re looking for
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => {
            const count = getCountForCategory(category.name);
            return (
              <div 
                key={category.name} 
                className="text-center p-6 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleCategoryClick(category.slug)}
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500">
                  {isLoading ? '...' : `${count.toLocaleString()} items`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
