'use client';

import React, { useState, useEffect } from 'react';
import { StatCard, DataTable, Button, Select, Alert, AlertDescription } from '@/components/ui';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api';

interface AnalyticsStats {
  totalStudents: number;
  totalCourses: number;
  totalQuizzes: number;
  averageCompletionRate: number;
  totalEnrollments: number;
  activeStudents: number;
}

interface CourseAnalytics {
  id: string;
  title: string;
  enrollments: number;
  completions: number;
  averageScore: number;
  completionRate: number;
}

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  enrolledCourses: number;
  completedCourses: number;
  averageScore: number;
  lastActivity: string;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session) return;

      try {
        setLoading(true);
        
        // Fetch analytics stats
        const statsData = await apiClient.get<AnalyticsStats>('/api/instructor/analytics/stats');
        setStats(statsData);

        // Fetch course analytics
        const courseData = await apiClient.get<CourseAnalytics[]>('/api/instructor/analytics/courses');
        setCourseAnalytics(courseData);

        // Fetch student progress - use same API as students page
        const studentData = await apiClient.get<StudentProgress[]>('/api/instructor/students');
        setStudentProgress(studentData);

      } catch (error) {
        if (error instanceof ApiError) {
          setError(error.message);
        } else {
          setError('Failed to fetch analytics data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [session, timeRange]);

  const courseColumns = [
    { key: 'title' as keyof CourseAnalytics, label: 'Course Title' },
    { key: 'enrollments' as keyof CourseAnalytics, label: 'Enrollments', render: (value: number) => (
      <span className="text-sm font-medium text-gray-900">{value}</span>
    )},
    { key: 'completions' as keyof CourseAnalytics, label: 'Completions', render: (value: number) => (
      <span className="text-sm font-medium text-gray-900">{value}</span>
    )},
    { key: 'completionRate' as keyof CourseAnalytics, label: 'Completion Rate', render: (value: number) => (
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div className="bg-red-600 h-2 rounded-full" style={{ width: `${value}%` }}></div>
        </div>
        <span className="text-sm text-gray-600">{value}%</span>
      </div>
    )},
    { key: 'averageScore' as keyof CourseAnalytics, label: 'Avg Score', render: (value: number) => (
      <span className="text-sm font-medium text-gray-900">{value.toFixed(1)}%</span>
    )},
  ];

  const studentColumns = [
    { key: 'name' as keyof StudentProgress, label: 'Student Name', render: (value: any, row: any) => (
      <div>
        <div className="font-medium text-gray-900">{row.firstName} {row.lastName}</div>
        <div className="text-sm text-gray-500">{row.email}</div>
      </div>
    )},
    { key: 'coursesEnrolled' as keyof StudentProgress, label: 'Enrolled', render: (value: number) => (
      <span className="text-sm font-medium text-gray-900">{value}</span>
    )},
    { key: 'completedCourses' as keyof StudentProgress, label: 'Completed', render: (value: number) => (
      <span className="text-sm font-medium text-gray-900">{value}</span>
    )},
    { key: 'progress' as keyof StudentProgress, label: 'Progress', render: (value: number) => (
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div className="bg-red-600 h-2 rounded-full" style={{ width: `${value}%` }}></div>
        </div>
        <span className="text-sm text-gray-600">{value}%</span>
      </div>
    )},
    { key: 'lastActivity' as keyof StudentProgress, label: 'Last Activity', render: (value: string) => {
      if (!value) return 'Never';
      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString();
      } catch {
        return 'Invalid Date';
      }
    }},
  ];

  const timeRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '365', label: 'Last year' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white/80 backdrop-blur-lg border-r border-gray-200 shadow-lg">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{(session as any)?.user?.name}</h2>
                <p className="text-sm text-gray-600">Instructor</p>
              </div>
            </div>
            
            <Button
              onClick={() => signOut({ callbackUrl: '/' })}
              variant="outline"
              size="sm"
              className="w-full mb-6"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </Button>

            <nav className="space-y-3">
              <Link href="/instructor/dashboard" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                Dashboard
              </Link>
              <Link href="/instructor/courses" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                My Courses
              </Link>
              <Link href="/instructor/courses/new" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Course
              </Link>
              <Link href="/instructor/students" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Students
              </Link>
              <Link href="/instructor/quizzes" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Quizzes
              </Link>
              <Link href="/instructor/analytics" className="flex items-center px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 group">
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
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Track your teaching performance and student progress</p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert className="mb-6" variant="error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Time Range Filter */}
            <div className="mb-8">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Time Range:</label>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  options={timeRangeOptions}
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatCard
                variant="default"
                title="Total Students"
                value={stats?.totalStudents || 0}
                change={{ value: '+12', type: 'increase' }}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                }
              />
              <StatCard
                variant="default"
                title="Total Courses"
                value={stats?.totalCourses || 0}
                change={{ value: '+2', type: 'increase' }}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
              />
              <StatCard
                variant="default"
                title="Completion Rate"
                value={stats?.averageCompletionRate ? `${stats.averageCompletionRate.toFixed(1)}%` : 'N/A'}
                change={{ value: '+5.2%', type: 'increase' }}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Course Analytics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Course Performance</h3>
                  <Link href="/instructor/courses">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                <DataTable
                  data={courseAnalytics.slice(0, 5)}
                  columns={courseColumns}
                  emptyMessage="No course data available"
                />
              </div>

              {/* Student Progress */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Student Progress</h3>
                  <Link href="/instructor/students">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                <DataTable
                  data={studentProgress.slice(0, 5)}
                  columns={studentColumns}
                  emptyMessage="No student data available"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}