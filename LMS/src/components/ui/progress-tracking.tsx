import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { ProgressBar } from './progress-bar';

export interface CourseProgress {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail?: string;
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageQuizScore: number;
  progress: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  enrolledAt: string;
  lastAccessed: string;
  estimatedTimeRemaining: number;
}

export interface ProgressStats {
  totalCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  totalStudyTime: number;
  currentStreak: number;
  longestStreak: number;
}

export interface ProgressTrackingProps {
  courses: CourseProgress[];
  stats: ProgressStats;
  onViewCourse?: (course: CourseProgress) => void;
  loading?: boolean;
}

export const ProgressTracking: React.FC<ProgressTrackingProps> = ({
  courses,
  stats,
  onViewCourse,
  loading = false,
}) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Courses Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.completedCourses}/{stats.totalCourses}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalCourses > 0 ? Math.round((stats.completedCourses / stats.totalCourses) * 100) : 0}% completion rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Lessons Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.completedLessons}/{stats.totalLessons}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}% completion rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.averageScore.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Across all quizzes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Study Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(stats.totalStudyTime || 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Total time spent
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Streak */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">
                {stats.currentStreak}
              </div>
              <div className="text-sm text-gray-600">Current Streak (days)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {stats.longestStreak}
              </div>
              <div className="text-sm text-gray-600">Longest Streak (days)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Course Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No courses enrolled yet
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {course.thumbnail && (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">{course.title}</h3>
                          <p className="text-sm text-gray-600">by {course.instructor}</p>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(course.status)}>
                      {course.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Overall Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <ProgressBar 
                        value={course.progress} 
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Lessons</div>
                        <div className="font-medium">
                          {course.completedLessons}/{course.totalLessons}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Quizzes</div>
                        <div className="font-medium">
                          {course.completedQuizzes}/{course.totalQuizzes}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Avg Score</div>
                        <div className="font-medium">
                          {(course.averageQuizScore || 0).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Time Left</div>
                        <div className="font-medium">
                          {formatTime(course.estimatedTimeRemaining || 0)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Last accessed: {formatDate(course.lastAccessed || course.enrolledAt)}</span>
                      <span>Enrolled: {formatDate(course.enrolledAt)}</span>
                    </div>

                    {onViewCourse && (
                      <div className="pt-2">
                        <Button
                          onClick={() => onViewCourse(course)}
                          size="sm"
                          className="w-full"
                        >
                          Continue Learning
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


