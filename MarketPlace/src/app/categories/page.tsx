// Categories Page
// Browse all product categories

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/Button/Button';

export default function CategoriesPage() {
  const router = useRouter();
  const [categoryCounts, setCategoryCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch('/api/categories/counts');
        const data = await response.json();
        setCategoryCounts(data.counts);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching counts:', error);
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, []);

  const getCountForCategory = (categoryName) => {
    return categoryCounts[categoryName] || 0;
  };

  const categories = [
    { 
      name: 'Electronics', 
      icon: '📱', 
      description: 'Electronic devices and accessories',
      slug: 'electronics'
    },
    { 
      name: 'Clothing', 
      icon: '👕', 
      description: 'Fashion and apparel',
      slug: 'clothing'
    },
    { 
      name: 'Home & Garden', 
      icon: '🏠', 
      description: 'Home improvement and garden supplies',
      slug: 'home-garden'
    },
    { 
      name: 'Books', 
      icon: '📚', 
      description: 'Books and educational materials',
      slug: 'books'
    },
    { 
      name: 'Sports', 
      icon: '⚽', 
      description: 'Sports equipment and accessories',
      slug: 'sports'
    },
    { 
      name: 'Automotive', 
      icon: '🚗', 
      description: 'Car parts and accessories',
      slug: 'automotive'
    },
    { 
      name: 'Health & Beauty', 
      icon: '💄', 
      description: 'Health and beauty products',
      slug: 'health-beauty'
    },
    { 
      name: 'Toys & Games', 
      icon: '🎮', 
      description: 'Toys and gaming equipment',
      slug: 'toys-games'
    },
  ];

  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/products?category=${categorySlug}`);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="container-main py-8">
          <div className="text-center">
            <h1 className="text-responsive-2xl font-bold text-gray-900 mb-4">
              Product Categories
            </h1>
            <p className="text-responsive text-gray-600 max-w-2xl mx-auto">
              Browse products by category to find exactly what you're looking for
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="container-main">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <div 
                key={category.name}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => handleCategoryClick(category.slug)}
              >
                <div className="text-center">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {isLoading ? '...' : `${getCountForCategory(category.name).toLocaleString()} items`}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCategoryClick(category.slug)}
                    >
                      Browse
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container-main text-center">
          <h2 className="text-responsive-xl font-bold mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-responsive mb-8 max-w-2xl mx-auto">
            Browse all products or use our search to find exactly what you need
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/products')}
              className="bg-white text-blue-600 hover:bg-gray-50"
            >
              Browse All Products
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/sell')}
              className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent"
            >
              Sell Your Items
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
