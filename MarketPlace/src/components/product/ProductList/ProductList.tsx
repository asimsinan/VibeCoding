// ProductList component
// Product list component for displaying multiple products

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

interface ProductListProps {
  products: Product[];
  loading?: boolean;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  className?: string;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  loading = false,
  onAddToCart,
  onViewDetails,
  className = '',
}) => {
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
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
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
