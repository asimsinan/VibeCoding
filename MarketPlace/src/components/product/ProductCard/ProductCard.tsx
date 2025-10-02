// ProductCard component
// Product card component for displaying product information

import React from 'react';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';

interface ProductCardProps {
  product: {
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
  };
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  className = '',
}) => {
  const formatPrice = (price: string | number) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericPrice);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 ${className}`}>
      {/* Product Image */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-200">
        {product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image available</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {product.title}
          </h3>
          <Badge variant={product.isAvailable ? 'success' : 'error'}>
            {product.isAvailable ? 'Available' : 'Sold'}
          </Badge>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-blue-600">
            {formatPrice(product.price)}
          </span>
          <span className="text-sm text-gray-500">
            {formatDate(product.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            by <span className="font-medium">{product.seller.username}</span>
          </span>
          <Badge variant="info">{product.category}</Badge>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(product.id)}
            className="flex-1"
          >
            View Details
          </Button>
          {product.isAvailable && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAddToCart?.(product.id)}
              className="flex-1"
            >
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
