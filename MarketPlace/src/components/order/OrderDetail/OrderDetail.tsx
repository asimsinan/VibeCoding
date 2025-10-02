// OrderDetail component
// Order detail component for displaying detailed order information

import React from 'react';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';

interface OrderDetailProps {
  order: {
    id: string;
    product: {
      id: string;
      title: string;
      description: string;
      images: string[];
      category: string;
    };
    buyer: {
      id: string;
      username: string;
      email: string;
    };
    seller: {
      id: string;
      username: string;
      email: string;
    };
    amount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    paymentIntentId?: string;
  };
  onUpdateStatus?: (orderId: string, status: string) => void;
  onContactSeller?: (sellerId: string) => void;
  onContactBuyer?: (buyerId: string) => void;
  className?: string;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({
  order,
  onUpdateStatus,
  onContactSeller,
  onContactBuyer,
  className = '',
}) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const getStatusDescription = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Payment is pending';
      case 'paid':
        return 'Payment has been received';
      case 'shipped':
        return 'Order has been shipped';
      case 'delivered':
        return 'Order has been delivered';
      case 'cancelled':
        return 'Order has been cancelled';
      case 'refunded':
        return 'Order has been refunded';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}>
      {/* Order Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{order.id.slice(-8)}
            </h1>
            <p className="text-gray-500">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge variant={getStatusVariant(order.status)}>
            {order.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {getStatusDescription(order.status)}
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h2>
            <div className="space-y-4">
              {order.product.images.length > 0 && (
                <img
                  src={order.product.images[0]}
                  alt={order.product.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {order.product.title}
                </h3>
                <p className="text-gray-600 mt-2">
                  {order.product.description}
                </p>
                <div className="mt-4">
                  <Badge variant="info">{order.product.category}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="space-y-6">
            {/* Pricing */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(order.amount)}
                  </span>
                </div>
                {order.paymentIntentId && (
                  <p className="text-sm text-gray-500 mt-2">
                    Payment ID: {order.paymentIntentId}
                  </p>
                )}
              </div>
            </div>

            {/* Buyer Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Buyer Information</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {order.buyer.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.buyer.username}</p>
                    <p className="text-sm text-gray-500">{order.buyer.email}</p>
                  </div>
                </div>
                {onContactBuyer && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onContactBuyer(order.buyer.id)}
                    className="mt-3"
                  >
                    Contact Buyer
                  </Button>
                )}
              </div>
            </div>

            {/* Seller Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {order.seller.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{order.seller.username}</p>
                    <p className="text-sm text-gray-500">{order.seller.email}</p>
                  </div>
                </div>
                {onContactSeller && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onContactSeller(order.seller.id)}
                    className="mt-3"
                  >
                    Contact Seller
                  </Button>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Placed</p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-xs text-gray-500">{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {onUpdateStatus && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <Button
                variant="primary"
                onClick={() => onUpdateStatus(order.id, order.status)}
              >
                Update Status
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
