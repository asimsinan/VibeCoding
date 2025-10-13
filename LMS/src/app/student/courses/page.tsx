'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CourseCard, CourseCardProps, Button, Input, Select, Alert, AlertDescription, ProgressBar } from '@/components/ui';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api';

interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  instructor?: string; 
  studentCount?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  duration?: number;
  difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  rating?: number;
  price?: number;
  progress: number;
  lastAccessed: string;
  enrollmentDate: string;
}

export default function StudentCoursesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [progressFilter, setProgressFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('RECENT');

  useEffect(() => {
    const fetchCourses = async () => {
      // Only fetch data if we have a valid session
      if (!session) {
        return;
      }

      try {
        setLoading(true);
        const coursesData = await apiClient.get<EnrolledCourse[]>('/api/student/courses');
        setCourses(coursesData);
      } catch (error) {
        if (error instanceof ApiError) {
          setError(error.message);
        } else {
          setError('Failed to fetch courses');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [session]);

  const handleViewCourse = (course: CourseCardProps['course']) => {
    // Use router.push for client-side navigation
    router.push(`/student/courses/${course.id}`);
  };

  const handleUnenrollCourse = async (course: EnrolledCourse) => {
    if (!confirm(`Are you sure you want to unenroll from "${course.title}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/student/courses/${course.id}/enroll`);
      setCourses(prev => prev.filter(c => c.id !== course.id));
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to unenroll from course');
      }
    }
  };

  const filteredAndSortedCourses = courses
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.instructor?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesProgress = true;
      if (progressFilter === 'NOT_STARTED') {
        matchesProgress = course.progress === 0;
      } else if (progressFilter === 'IN_PROGRESS') {
        matchesProgress = course.progress > 0 && course.progress < 100;
      } else if (progressFilter === 'COMPLETED') {
        matchesProgress = course.progress === 100;
      }
      
      return matchesSearch && matchesProgress;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'RECENT':
          return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
        case 'PROGRESS':
          return b.progress - a.progress;
        case 'ENROLLMENT':
          return new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime();
        case 'TITLE':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const progressOptions = [
    { value: 'ALL', label: 'All Progress' },
    { value: 'NOT_STARTED', label: 'Not Started' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  const sortOptions = [
    { value: 'RECENT', label: 'Recently Accessed' },
    { value: 'PROGRESS', label: 'Progress' },
    { value: 'ENROLLMENT', label: 'Enrollment Date' },
    { value: 'TITLE', label: 'Alphabetical' },
  ];

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress < 50) return 'bg-red-500';
    if (progress < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

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
              <Link href="/student/dashboard" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                Dashboard
              </Link>
              <Link href="/student/courses" className="flex items-center px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 group">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
              <p className="text-gray-600">Continue your learning journey</p>
            </div>

            <div className="space-y-6">
              {error && (
                <Alert className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Search and Filters */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Search my courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  <Select
                    value={progressFilter}
                    onChange={(e) => setProgressFilter(e.target.value)}
                    options={progressOptions}
                    className="w-full"
                  />
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    options={sortOptions}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {filteredAndSortedCourses.length} of {courses.length} enrolled courses
                </p>
                <div className="text-sm text-gray-500">
                  {filteredAndSortedCourses.filter(c => c.progress === 100).length} completed
                </div>
              </div>

              {/* Courses Grid */}
              {filteredAndSortedCourses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || progressFilter !== 'ALL' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'You haven\'t enrolled in any courses yet.'
                    }
                  </p>
                  {!searchTerm && progressFilter === 'ALL' && (
                    <div className="mt-6">
                      <Link href="/student/catalog">
                        <Button>Browse Course Catalog</Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedCourses.map((course) => (
                    <div key={course.id} className="relative">
                      <CourseCard
                        course={course}
                        onView={handleViewCourse}
                        showActions={true}
                        userRole="STUDENT"
                      />
                      
                      {/* Progress Overlay */}
                      <div className="absolute top-4 right-4">
                        <div className="bg-white rounded-full p-2 shadow-md">
                          <div className="w-8 h-8 relative">
                            <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-gray-200"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className={getProgressColor(course.progress)}
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${course.progress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">
                                {course.progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
