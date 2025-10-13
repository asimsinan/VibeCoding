'use client';

import React, { useState, useEffect } from 'react';
import { StatCard, DataTable, ActivityFeed, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  activeUsers: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  studentCount: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: 'course' | 'user' | 'quiz' | 'enrollment' | 'system';
  action: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsData = await apiClient.get('/api/admin/dashboard/stats') as DashboardStats;
      setStats(statsData);

      // Fetch recent users
      const usersData = await apiClient.get('/api/admin/users?limit=5') as User[];
      setRecentUsers(usersData);

      // Fetch recent courses
      const coursesData = await apiClient.get('/api/admin/courses?limit=5') as Course[];
      setRecentCourses(coursesData);

      // Generate mock activities
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'user',
          action: 'created',
          description: 'New user registered',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          user: { name: 'John Doe', email: 'john@example.com' }
        },
        {
          id: '2',
          type: 'course',
          action: 'published',
          description: 'Course "Web Development" was published',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          user: { name: 'Jane Smith', email: 'jane@example.com' }
        },
        {
          id: '3',
          type: 'enrollment',
          action: 'completed',
          description: 'Student completed course enrollment',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
        }
      ];
      setActivities(mockActivities);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to view this page.</p>
          <Button onClick={() => signOut({ callbackUrl: '/auth/signin' })} className="bg-red-600 hover:bg-red-700">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const userColumns = [
    { key: 'firstName' as keyof User, label: 'Name', render: (value: string, item: User) => `${item.firstName} ${item.lastName}` },
    { key: 'email' as keyof User, label: 'Email' },
    { key: 'role' as keyof User, label: 'Role', render: (value: string) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        value === 'ADMIN' ? 'bg-red-100 text-red-800' :
        value === 'INSTRUCTOR' ? 'bg-blue-100 text-blue-800' :
        'bg-green-100 text-green-800'
      }`}>
        {value}
      </span>
    )},
    { key: 'createdAt' as keyof User, label: 'Joined', render: (value: string) => new Date(value).toLocaleDateString() }
  ];

  const courseColumns = [
    { key: 'title' as keyof Course, label: 'Title' },
    { key: 'instructor' as keyof Course, label: 'Instructor' },
    { key: 'studentCount' as keyof Course, label: 'Students' },
    { key: 'status' as keyof Course, label: 'Status', render: (value: string) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        value === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
        value === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {value}
      </span>
    )}
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-red-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white/90 backdrop-blur-sm border-r border-red-200 shadow-lg">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">ASY LMS</h1>
              <p className="text-xs text-gray-500">Admin Portal</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <Link href="/admin/dashboard" className="flex items-center px-4 py-3 text-sm font-medium text-red-700 bg-red-100 rounded-xl hover:bg-red-200 transition-all duration-200 group">
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              Dashboard
            </Link>
            <Link href="/admin/users" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 group">
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Users
            </Link>
            <Link href="/admin/courses" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 group">
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Courses
            </Link>
            <Link href="/admin/organizations" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 group">
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Organizations
            </Link>
            <Link href="/admin/analytics" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 group">
              <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </Link>
          </nav>
        </div>
      </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-red-200 sticky top-0 z-30">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 font-medium">Welcome back, {(session as any)?.user?.name}! 👑</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-red-700 bg-red-100 px-3 py-1 rounded-full font-medium">
                  {session?.user?.organization?.name}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon="👥"
            />
            <StatCard
              title="Total Courses"
              value={stats?.totalCourses || 0}
              icon="📚"
            />
            <StatCard
              title="Total Enrollments"
              value={stats?.totalEnrollments || 0}
              icon="🎓"
            />
            <StatCard
              title="Active Users"
              value={stats?.activeUsers || 0}
              icon="🟢"
            />
          </div>

          {/* Data Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card hover>
              <CardHeader className="bg-red-50 border-b border-red-200">
                <CardTitle className="text-red-700">Recent Users</CardTitle>
                <p className="text-red-600 text-sm">Latest registered users</p>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={recentUsers}
                  columns={userColumns}
                  onRowClick={(user) => console.log('User clicked:', user)}
                />
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader className="bg-red-50 border-b border-red-200">
                <CardTitle className="text-red-700">Recent Courses</CardTitle>
                <p className="text-red-600 text-sm">Latest created courses</p>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={recentCourses}
                  columns={courseColumns}
                  onRowClick={(course) => console.log('Course clicked:', course)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card hover>
            <CardHeader className="bg-red-50 border-b border-red-200">
              <CardTitle className="text-red-700">Recent Activity</CardTitle>
              <p className="text-red-600 text-sm">System-wide activity overview</p>
            </CardHeader>
            <CardContent>
              <ActivityFeed
                activities={activities}
                maxItems={10}
              />
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}