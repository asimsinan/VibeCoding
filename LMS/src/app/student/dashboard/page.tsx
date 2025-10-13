'use client';

import React, { useState, useEffect } from 'react';
import { StatCard, DataTable, ActivityFeed, ProgressBar, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  totalQuizzes: number;
  averageScore: number;
}

interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  instructor: string;
  progress: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED';
  enrolledAt: string;
  lastAccessed: string;
}

interface QuizAttempt {
  id: string;
  quizTitle: string;
  courseTitle: string;
  score: number;
  maxScore: number;
  status: 'PASSED' | 'FAILED' | 'IN_PROGRESS';
  attemptedAt: string;
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

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [recentQuizAttempts, setRecentQuizAttempts] = useState<QuizAttempt[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Only fetch data if we have a valid session
      if (!session) {
        return;
      }

      try {
        setLoading(true);
        
        // Fetch student statistics
        const statsData = await apiClient.get<StudentStats>('/api/student/dashboard/stats');
        setStats(statsData);

        // Fetch enrolled courses
        const coursesData = await apiClient.get<EnrolledCourse[]>('/api/student/courses?limit=5');
        setEnrolledCourses(coursesData);

        // Fetch recent quiz attempts
        const quizData = await apiClient.get<QuizAttempt[]>('/api/student/quiz-attempts?limit=5');
        setRecentQuizAttempts(quizData);

        // Fetch recent activities
        const activitiesData = await apiClient.get<ActivityItem[]>('/api/student/activities?limit=10');
        setActivities(activitiesData.map(activity => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        })));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default values if API fails
        setStats({
          enrolledCourses: 3,
          completedCourses: 1,
          totalQuizzes: 5,
          averageScore: 85
        });
        setEnrolledCourses([
          {
            id: '1',
            title: 'Introduction to React',
            description: 'Learn the basics of React development',
            instructor: 'John Doe',
            progress: 75,
            status: 'IN_PROGRESS',
            enrolledAt: '2024-01-15',
            lastAccessed: '2024-01-20'
          },
          {
            id: '2',
            title: 'Advanced JavaScript',
            description: 'Master advanced JavaScript concepts',
            instructor: 'Jane Smith',
            progress: 100,
            status: 'COMPLETED',
            enrolledAt: '2024-01-10',
            lastAccessed: '2024-01-18'
          }
        ]);
        setRecentQuizAttempts([
          {
            id: '1',
            quizTitle: 'React Basics Quiz',
            courseTitle: 'Introduction to React',
            score: 85,
            maxScore: 100,
            status: 'PASSED',
            attemptedAt: '2024-01-20'
          },
          {
            id: '2',
            quizTitle: 'JavaScript Fundamentals',
            courseTitle: 'Advanced JavaScript',
            score: 92,
            maxScore: 100,
            status: 'PASSED',
            attemptedAt: '2024-01-18'
          }
        ]);
        setActivities([
          {
            id: '1',
            type: 'course',
            action: 'completed',
            description: 'Completed Advanced JavaScript course',
            timestamp: new Date('2024-01-18')
          },
          {
            id: '2',
            type: 'quiz',
            action: 'passed',
            description: 'Passed React Basics Quiz with 85%',
            timestamp: new Date('2024-01-20')
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session]);

  // Show loading while session is being fetched
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-red-100">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-red-100">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">You need to be signed in to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  const courseColumns = [
    { key: 'title' as keyof EnrolledCourse, label: 'Course' },
    { key: 'instructor' as keyof EnrolledCourse, label: 'Instructor' },
    { key: 'progress' as keyof EnrolledCourse, label: 'Progress', render: (value: number) => (
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-red-600 h-2 rounded-full" 
            style={{ width: `${value}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600">{value}%</span>
      </div>
    )},
    { key: 'status' as keyof EnrolledCourse, label: 'Status', render: (value: string) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        value === 'COMPLETED' ? 'bg-green-100 text-green-800' :
        value === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {value.replace('_', ' ')}
      </span>
    )},
    { key: 'lastAccessed' as keyof EnrolledCourse, label: 'Last Accessed', render: (value: string) => new Date(value).toLocaleDateString() },
  ];

  const quizColumns = [
    { key: 'quizTitle' as keyof QuizAttempt, label: 'Quiz' },
    { key: 'courseTitle' as keyof QuizAttempt, label: 'Course' },
    { key: 'score' as keyof QuizAttempt, label: 'Score', render: (value: number, item: QuizAttempt) => `${value}/${item.maxScore}` },
    { key: 'status' as keyof QuizAttempt, label: 'Status', render: (value: string) => (
      <span className={`px-2 py-1 text-xs rounded-full ${
        value === 'PASSED' ? 'bg-green-100 text-green-800' :
        value === 'FAILED' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {value}
      </span>
    )},
    { key: 'attemptedAt' as keyof QuizAttempt, label: 'Attempted', render: (value: string) => new Date(value).toLocaleDateString() },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-red-100">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-red-100">
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
                <p className="text-sm text-gray-600">Student</p>
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
              <Link href="/student/dashboard" className="flex items-center px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 group">
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                Dashboard
              </Link>
              <Link href="/student/courses" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                My Courses
              </Link>
              <Link href="/student/catalog" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Course Catalog
              </Link>
              <Link href="/student/quizzes" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Quizzes
              </Link>
              <Link href="/student/progress" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Progress
              </Link>
              <Link href="/student/certificates" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Certificates
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
              <p className="text-gray-600">Welcome back, {(session as any)?.user?.name}! 🎓</p>
            </div>

            <div className="space-y-8 animate-fade-in">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <StatCard
                    variant="default"
                    title="Enrolled Courses"
                    value={stats?.enrolledCourses || 0}
                    change={{ value: '+1', type: 'increase' }}
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    }
                  />
                </div>
                <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <StatCard
                    variant="default"
                    title="Completed Courses"
                    value={stats?.completedCourses || 0}
                    change={{ value: '+1', type: 'increase' }}
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                </div>
                <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <StatCard
                    variant="default"
                    title="Quiz Attempts"
                    value={stats?.totalQuizzes || 0}
                    change={{ value: '+3', type: 'increase' }}
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                  />
                </div>
                <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                  <StatCard
                    variant="default"
                    title="Average Score"
                    value={stats?.averageScore ? `${stats.averageScore.toFixed(1)}%` : 'N/A'}
                    change={{ value: '+2.5%', type: 'increase' }}
                    icon={
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    }
                  />
                </div>
              </div>

              {/* Enrolled Courses and Recent Quiz Attempts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
                  <Card hover className="h-full">
                    <CardHeader className="bg-red-50 border-b border-red-200">
                      <CardTitle size="lg" className="text-red-700">My Courses</CardTitle>
                      <p className="text-red-600">Courses you're enrolled in</p>
                    </CardHeader>
                    <CardContent>
                      <DataTable
                        data={enrolledCourses}
                        columns={courseColumns}
                        onRowClick={(course) => console.log('Course clicked:', course)}
                      />
                    </CardContent>
                  </Card>
                </div>
                <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
                  <Card hover className="h-full">
                    <CardHeader className="bg-red-50 border-b border-red-200">
                      <CardTitle size="lg" className="text-red-700">Recent Quiz Attempts</CardTitle>
                      <p className="text-red-600">Your recent quiz performance</p>
                    </CardHeader>
                    <CardContent>
                      <DataTable
                        data={recentQuizAttempts}
                        columns={quizColumns}
                        onRowClick={(quiz) => console.log('Quiz clicked:', quiz)}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="animate-slide-up" style={{ animationDelay: '0.7s' }}>
                <Card hover>
                  <CardHeader gradient>
                    <CardTitle size="lg" className="text-red-700">Recent Activity</CardTitle>
                    <p className="text-red-600">Your latest learning activities</p>
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
      </div>
    </div>
  );
}


