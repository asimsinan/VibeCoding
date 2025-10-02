// ProductDetail component
// Product detail component for displaying detailed product information

'use client';

import React from 'react';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';

interface ProductDetailProps {
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
      email: string;
    };
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
  };
  onAddToCart?: (productId: string) => void;
  onContactSeller?: (sellerId: string) => void;
  className?: string;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  onAddToCart,
  onContactSeller,
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
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}>
      {/* Product Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        <div className="space-y-4">
          {product.images.length > 0 ? (
            product.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${product.title} - Image ${index + 1}`}
                className="w-full h-64 object-cover rounded-lg"
              />
            ))
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-lg">No images available</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.title}
            </h1>
            <div className="flex items-center space-x-4 mb-4">
              <Badge variant={product.isAvailable ? 'success' : 'error'}>
                {product.isAvailable ? 'Available' : 'Sold'}
              </Badge>
              <Badge variant="info">{product.category}</Badge>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-4">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Seller Information</h3>
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-gray-700">
                  {product.seller.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{product.seller.username}</p>
                <p className="text-sm text-gray-500">{product.seller.email}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Details</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Listed:</span> {formatDate(product.createdAt)}</p>
              <p><span className="font-medium">Last Updated:</span> {formatDate(product.updatedAt)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex space-x-4">
              {product.isAvailable && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => onAddToCart?.(product.id)}
                  className="flex-1"
                >
                  Add to Cart
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={() => onContactSeller?.(product.seller.id)}
                className="flex-1"
              >
                Contact Seller
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
