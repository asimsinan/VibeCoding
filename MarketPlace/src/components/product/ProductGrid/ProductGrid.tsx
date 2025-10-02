// ProductGrid component
// Product grid component for displaying products in a grid layout

import React from 'react';
import { ProductCard } from '../ProductCard/ProductCard';
import { Spinner } from '../../ui/Spinner/Spinner';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  seller: {
    id: string;
    username: string;
  };
  isAvailable: boolean;
  createdAt: string;
}

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  onAddToCart,
  onViewDetails,
  columns = 4,
  className = '',
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500 text-lg mb-4">No products found</div>
        <p className="text-gray-400">Try adjusting your search criteria or check back later.</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          {...(onAddToCart && { onAddToCart })}
          {...(onViewDetails && { onViewDetails })}
        />
      ))}
    </div>
  );
};
