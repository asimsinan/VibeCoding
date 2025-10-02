// OrderSummary component
// Order summary component for displaying order summary information

import React from 'react';
import { Badge } from '../../ui/Badge/Badge';

interface OrderSummaryProps {
  order: {
    id: string;
    product: {
      title: string;
      price: number;
      images: string[];
    };
    amount: number;
    status: string;
    createdAt: string;
  };
  onViewDetails?: (orderId: string) => void;
  className?: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  order,
  onViewDetails,
  className = '',
}) => {
  const formatPrice = (amount: string | number) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numericAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'paid':
        return 'info';
      case 'shipped':
        return 'info';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'refunded':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {order.product.images.length > 0 ? (
            <img
              src={order.product.images[0]}
              alt={order.product.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">No image</span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {order.product.title}
            </h3>
            <p className="text-sm text-gray-500">
              Order #{order.id.slice(-8)}
            </p>
          </div>
        </div>
        <Badge variant={getStatusVariant(order.status)}>
          {order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Product Price</p>
          <p className="font-medium text-gray-900">
            {formatPrice(order.product.price)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="font-medium text-gray-900">
            {formatPrice(order.amount)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Order Date</p>
          <p className="font-medium text-gray-900">
            {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      {onViewDetails && (
        <button
          onClick={() => onViewDetails(order.id)}
          className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          View Full Details
        </button>
      )}
    </div>
  );
};
