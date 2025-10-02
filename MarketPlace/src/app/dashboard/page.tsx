// Dashboard Page
// Main dashboard for authenticated users

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/hooks/useAuth';
import { Card } from '../../components/ui/Card/Card';
import { Button } from '../../components/ui/Button/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface DashboardStats {
  totalSales: string;
  activeListings: number;
  ordersReceived: number;
  completedOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  messages: number;
  unreadMessages: number;
}

interface DashboardOrder {
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

interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([]);
  const [recentActivity, setRecentActivity] = useState<DashboardActivity[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
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

        // Fetch stats, orders, and activity in parallel
        const [statsResponse, ordersResponse, activityResponse] = await Promise.all([
          fetch('/api/dashboard/stats', {
            headers: { Authorization: authHeader }
          }),
          fetch('/api/dashboard/orders?limit=5', {
            headers: { Authorization: authHeader }
          }),
          fetch('/api/dashboard/activity?limit=5', {
            headers: { Authorization: authHeader }
          })
        ]);

        if (!statsResponse.ok || !ordersResponse.ok || !activityResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [statsData, ordersData, activityData] = await Promise.all([
          statsResponse.json(),
          ordersResponse.json(),
          activityResponse.json()
        ]);

        setStats(statsData.data);
        setRecentOrders(ordersData.data);
        setRecentActivity(activityData.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setDataLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user]);

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h1>
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

  const dashboardStats = stats ? [
    {
      title: 'Total Sales',
      value: `$${stats.totalSales}`,
      change: stats.completedOrders > 0 ? `+${stats.completedOrders} completed` : 'No sales yet',
      changeType: stats.completedOrders > 0 ? 'positive' : 'neutral',
      icon: '💰'
    },
    {
      title: 'Active Listings',
      value: stats.activeListings.toString(),
      change: stats.activeListings > 0 ? `${stats.activeListings} products` : 'No listings yet',
      changeType: stats.activeListings > 0 ? 'positive' : 'neutral',
      icon: '📦'
    },
    {
      title: 'Orders Received',
      value: stats.ordersReceived.toString(),
      change: stats.ordersReceived > 0 ? `${stats.pendingOrders} pending` : 'No orders yet',
      changeType: stats.ordersReceived > 0 ? 'positive' : 'neutral',
      icon: '📋'
    },
    {
      title: 'Messages',
      value: stats.messages.toString(),
      change: stats.unreadMessages > 0 ? `${stats.unreadMessages} unread` : 'No messages',
      changeType: stats.unreadMessages > 0 ? 'positive' : 'neutral',
      icon: '💬'
    }
  ] : [];


  const quickActions = [
    {
      title: 'Add New Product',
      description: 'List a new item for sale',
      icon: '➕',
      action: () => router.push('/dashboard-pages/add-product'),
      color: 'bg-blue-500'
    },
    {
      title: 'View Orders',
      description: 'Manage your orders',
      icon: '📋',
      action: () => router.push('/dashboard-pages/orders'),
      color: 'bg-green-500'
    },
    {
      title: 'My Products',
      description: 'Manage your listings',
      icon: '📦',
      action: () => router.push('/dashboard-pages/my-products'),
      color: 'bg-purple-500'
    },
    {
      title: 'Messages',
      description: 'View buyer messages',
      icon: '💬',
      action: () => router.push('/dashboard-pages/messages'),
      color: 'bg-indigo-500'
    },
    {
      title: 'Profile Settings',
      description: 'Update your profile',
      icon: '⚙️',
      action: () => router.push('/dashboard-pages/profile'),
      color: 'bg-orange-500'
    }
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="container-main py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-responsive-2xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.username || 'User'}!
              </h1>
              <p className="text-responsive text-gray-600">
                Here's what's happening with your marketplace activity
              </p>
            </div>
            <div className="flex space-x-4">
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard-pages/add-product')}
              >
                Add Product
              </Button>
              <Button 
                variant="primary"
                onClick={() => router.push('/products')}
              >
                Browse Products
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container-main py-8">
        {/* Stats Overview */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat, index) => (
              <Card key={index}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className={`text-sm ${
                      stat.changeType === 'positive' 
                        ? 'text-green-600' 
                        : stat.changeType === 'negative'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className="text-3xl">{stat.icon}</div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card title="Quick Actions">
              <div className="space-y-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="w-full p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-white text-lg`}>
                        {action.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card title="Recent Orders">
              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Order</span>
                          <span className="text-sm font-mono font-semibold text-gray-700">
                            {order.orderNumber.split('-')[1]}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{order.item}</h4>
                          <p className="text-sm text-gray-600">Customer: {order.customer}</p>
                          <p className="text-xs text-gray-500">{order.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{order.amount}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          order.status === 'DELIVERED' 
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No orders yet</p>
                    <p className="text-sm">Start selling to see your orders here</p>
                  </div>
                )}
                <div className="text-center pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/dashboard-pages/orders')}
                  >
                    View All Orders
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <section className="mt-8">
          <Card title="Recent Activity">
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 ${
                      activity.color === 'green' ? 'bg-green-100' :
                      activity.color === 'blue' ? 'bg-blue-100' :
                      activity.color === 'purple' ? 'bg-purple-100' :
                      'bg-yellow-100'
                    } rounded-full flex items-center justify-center`}>
                      <span className={`text-sm ${
                        activity.color === 'green' ? 'text-green-600' :
                        activity.color === 'blue' ? 'text-blue-600' :
                        activity.color === 'purple' ? 'text-purple-600' :
                        'text-yellow-600'
                      }`}>
                        {activity.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.title}</span> - {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity</p>
                  <p className="text-sm">Start selling to see your activity here</p>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Tips & Resources */}
        <section className="mt-8">
          <Card className="bg-blue-50 border-blue-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Seller Tips & Resources
              </h3>
              <p className="text-blue-700 mb-4">
                Improve your selling performance with these helpful resources
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/help')}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Seller Guide
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/faq')}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  FAQ
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/contact')}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
