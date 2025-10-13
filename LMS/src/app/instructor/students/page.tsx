'use client';

import React, { useState, useEffect } from 'react';
import { DataTable, Button, Input, Select, Alert, AlertDescription, Card, CardContent } from '@/components/ui';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  enrolledAt: string;
  progress: number;
  lastActivity: string;
  coursesEnrolled: number;
  completedCourses: number;
}

export default function InstructorStudentsPage() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [progressFilter, setProgressFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('NAME');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      // Only fetch data if we have a valid session
      if (!session) {
        return;
      }

      try {
        setLoading(true);
        const studentsData = await apiClient.get<Student[]>('/api/instructor/students');
        setStudents(studentsData);
      } catch (error) {
        if (error instanceof ApiError) {
          setError(error.message);
        } else {
          setError('Failed to fetch students');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [session]);

  // Show loading while session is being fetched
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600">You need to be signed in to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredAndSortedStudents = students
    .filter(student => {
      const matchesSearch = 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesProgress = true;
      if (progressFilter === 'LOW') {
        matchesProgress = student.progress < 30;
      } else if (progressFilter === 'MEDIUM') {
        matchesProgress = student.progress >= 30 && student.progress < 70;
      } else if (progressFilter === 'HIGH') {
        matchesProgress = student.progress >= 70;
      }
      
      return matchesSearch && matchesProgress;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'NAME':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'PROGRESS':
          return b.progress - a.progress;
        case 'ENROLLMENT':
          return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
        case 'ACTIVITY':
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        default:
          return 0;
      }
    });

  const progressOptions = [
    { value: 'ALL', label: 'All Progress Levels' },
    { value: 'LOW', label: 'Low Progress (<30%)' },
    { value: 'MEDIUM', label: 'Medium Progress (30-70%)' },
    { value: 'HIGH', label: 'High Progress (>70%)' },
  ];

  const sortOptions = [
    { value: 'NAME', label: 'Name' },
    { value: 'PROGRESS', label: 'Progress' },
    { value: 'ENROLLMENT', label: 'Enrollment Date' },
    { value: 'ACTIVITY', label: 'Last Activity' },
  ];

  const handleExportData = async (separator = ',') => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/instructor/students/export?separator=${separator}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const studentColumns = [
    { 
      key: 'name' as keyof Student, 
      label: 'Name', 
      render: (value: string, item: Student) => `${item.firstName} ${item.lastName}` 
    },
    { key: 'email' as keyof Student, label: 'Email' },
    { 
      key: 'progress' as keyof Student, 
      label: 'Progress', 
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-red-600 h-2 rounded-full" 
          style={{ width: `${value}%` }}
        ></div>
          </div>
          <span className="text-sm text-gray-600">{value}%</span>
        </div>
      )
    },
    { key: 'coursesEnrolled' as keyof Student, label: 'Courses' },
    { key: 'completedCourses' as keyof Student, label: 'Completed' },
    { 
      key: 'lastActivity' as keyof Student, 
      label: 'Last Activity', 
      render: (value: string) => {
        if (!value) return 'Never';
        try {
          const date = new Date(value);
          if (isNaN(date.getTime())) return 'Invalid Date';
          return date.toLocaleDateString();
        } catch {
          return 'Invalid Date';
        }
      }
    },
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
              <Link href="/instructor/students" className="flex items-center px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 group">
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
              <Link href="/instructor/analytics" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Students</h1>
              <p className="text-gray-600">Manage and track your students' progress</p>
            </div>

            <div className="space-y-8 animate-fade-in">
              {error && (
                <Alert className="mb-6 animate-slide-down">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Search and Filters */}
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <Card hover>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Search Students</label>
                        <Input
                          placeholder="Search by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Progress Filter</label>
                        <Select
                          value={progressFilter}
                          onChange={(e) => setProgressFilter(e.target.value)}
                          options={progressOptions}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Sort By</label>
                        <Select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          options={sortOptions}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results Summary */}
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm text-neutral-600">
                      Showing <span className="font-semibold text-gray-600">{filteredAndSortedStudents.length}</span> of <span className="font-semibold">{students.length}</span> students
                    </p>
                    <div className="h-4 w-px bg-neutral-300"></div>
                    <div className="text-sm text-success-600 font-medium">
                      {students.filter(s => s.progress >= 70).length} high performers
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportData(',')}
                      disabled={isExporting}
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      icon={
                        isExporting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )
                      }
                    >
                      {isExporting ? 'Exporting...' : 'CSV (Comma)'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportData(';')}
                      disabled={isExporting}
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      icon={
                        isExporting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )
                      }
                    >
                      {isExporting ? 'Exporting...' : 'CSV (Semicolon)'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                {filteredAndSortedStudents.length === 0 ? (
                  <Card hover>
                    <CardContent className="text-center py-16">
                      <div className="mx-auto h-16 w-16 text-neutral-400 mb-4">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">No students found</h3>
                      <p className="text-neutral-500 max-w-sm mx-auto">
                        {searchTerm || progressFilter !== 'ALL' 
                          ? 'Try adjusting your search or filter criteria to find students.'
                          : 'You don\'t have any students enrolled in your courses yet. Start by creating a course!'
                        }
                      </p>
                      {!searchTerm && progressFilter === 'ALL' && (
                        <Button
                          className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                          icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          }
                        >
                          Create Your First Course
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card hover>
                    <CardContent noPadding>
                      <DataTable
                        data={filteredAndSortedStudents}
                        columns={studentColumns}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
