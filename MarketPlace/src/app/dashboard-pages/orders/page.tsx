// Orders Dashboard Page
// Orders management page for dashboard

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/hooks/useAuth';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  customerEmail: string;
  item: string;
  itemImage: string | null;
  amount: string;
  status: string;
  date: string;
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !user) return;

      try {
        setDataLoading(true);
        setError(null);

        const token = localStorage.getItem('auth_tokens');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const authData = JSON.parse(token);
        const authHeader = `Bearer ${authData.accessToken}`;

        const response = await fetch('/api/dashboard/orders?limit=50', {
          headers: { Authorization: authHeader }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data.data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setDataLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'PAID':
        return 'bg-purple-100 text-purple-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Orders</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-main py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Manage orders from your customers</p>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center min-w-[60px]">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Order</span>
                      <span className="text-sm font-mono font-semibold text-gray-700">
                        {order.orderNumber.split('-')[1]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{order.item}</h3>
                      <p className="text-sm text-gray-600">Customer: {order.customer}</p>
                      <p className="text-sm text-gray-600">Email: {order.customerEmail}</p>
                      <p className="text-xs text-gray-500">{order.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium text-gray-900">{order.amount}</p>
                    <span className={`inline-block px-3 py-1 text-sm rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600 mb-6">You haven't received any orders yet. Start selling to see orders here!</p>
              <Button 
                variant="primary"
                onClick={() => router.push('/dashboard-pages/add-product')}
              >
                Add Your First Product
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
