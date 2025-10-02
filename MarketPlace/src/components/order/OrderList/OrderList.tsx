// OrderList component
// Order list component for displaying multiple orders

import React from 'react';
import { OrderCard } from '../OrderCard/OrderCard';
import { Spinner } from '../../ui/Spinner/Spinner';

interface Order {
  id: string;
  product: {
    id: string;
    title: string;
    images: string[];
  };
  buyer: {
    id: string;
    username: string;
  };
  seller: {
    id: string;
    username: string;
  };
  amount: number;
  status: string;
  createdAt: string;
}

interface OrderListProps {
  orders: Order[];
  loading?: boolean;
  onViewDetails?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, status: string) => void;
  className?: string;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  loading = false,
  onViewDetails,
  onUpdateStatus,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500 text-lg mb-4">No orders found</div>
        <p className="text-gray-400">You haven&apos;t made any orders yet.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          {...(onViewDetails && { onViewDetails })}
          {...(onUpdateStatus && { onUpdateStatus })}
        />
      ))}
    </div>
  );
};
