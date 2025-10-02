// OrderStatus component
// Order status component for displaying and updating order status

import React from 'react';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';

interface OrderStatusProps {
  status: string;
  onStatusChange?: (newStatus: string) => void;
  canUpdate?: boolean;
  className?: string;
}

export const OrderStatus: React.FC<OrderStatusProps> = ({
  status,
  onStatusChange,
  canUpdate = false,
  className = '',
}) => {
  // Status options for future use

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

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus.toLowerCase()) {
      case 'pending':
        return 'paid';
      case 'paid':
        return 'shipped';
      case 'shipped':
        return 'delivered';
      case 'delivered':
        return null;
      case 'cancelled':
        return null;
      case 'refunded':
        return null;
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus(status);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <Badge variant={getStatusVariant(status)}>
          {status}
        </Badge>
        <span className="text-sm text-gray-600">
          {getStatusDescription(status)}
        </span>
      </div>

      {canUpdate && nextStatus && (
        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onStatusChange?.(nextStatus)}
          >
            Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange?.('cancelled')}
          >
            Cancel Order
          </Button>
        </div>
      )}

      {canUpdate && !nextStatus && status.toLowerCase() === 'delivered' && (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange?.('refunded')}
          >
            Process Refund
          </Button>
        </div>
      )}
    </div>
  );
};
