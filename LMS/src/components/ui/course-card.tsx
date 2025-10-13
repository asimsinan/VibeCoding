import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { ProgressBar } from './progress-bar';

export interface CourseCardProps {
  course: {
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
    organizationName?: string;
    isEnrolled?: boolean;
  };
  onEdit?: (course: CourseCardProps['course']) => void;
  onDelete?: (course: CourseCardProps['course']) => void;
  onView?: (course: CourseCardProps['course']) => void;
  onEnroll?: (course: CourseCardProps['course']) => void;
  showActions?: boolean;
  userRole?: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onEdit,
  onDelete,
  onView,
  onEnroll,
  showActions = true,
  userRole = 'STUDENT',
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DRAFT':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ARCHIVED':
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INTERMEDIATE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ADVANCED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card className="h-full flex flex-col group hover-lift transition-all duration-300 border border-neutral-200 hover:border-primary-300 hover:shadow-card-hover">
      {/* Thumbnail Section */}
      {course.thumbnail ? (
        <div className="aspect-video bg-gradient-to-br from-primary-50 to-primary-100 rounded-t-2xl overflow-hidden relative">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <Badge className={`${getStatusColor(course.status)} border font-medium px-3 py-1`}>
              {course.status}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-primary-50 to-primary-100 rounded-t-2xl flex items-center justify-center relative">
          <div className="text-primary-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="absolute top-3 right-3">
            <Badge className={`${getStatusColor(course.status)} border font-medium px-3 py-1`}>
              {course.status}
            </Badge>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <CardTitle className="text-xl font-bold text-neutral-900 line-clamp-2 group-hover:text-primary-700 transition-colors">
            {course.title}
          </CardTitle>
          {course.instructor && (
            <div className="flex items-center text-sm text-neutral-600">
              <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              by {course.instructor}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <p className="text-neutral-600 text-sm line-clamp-3 mb-4 leading-relaxed">
          {course.description}
        </p>

        {/* Course Metadata */}
        <div className="space-y-3">
          {course.difficulty && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Difficulty
              </span>
              <Badge className={`${getDifficultyColor(course.difficulty)} border text-xs font-medium px-2 py-1`}>
                {course.difficulty}
              </Badge>
            </div>
          )}

          {course.duration && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Duration
              </span>
              <span className="text-sm font-medium text-neutral-900">{formatDuration(course.duration)}</span>
            </div>
          )}

          {course.studentCount !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Students
              </span>
              <span className="text-sm font-medium text-neutral-900">{course.studentCount}</span>
            </div>
          )}

          {course.rating !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Rating
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-neutral-900">{course.rating.toFixed(1)}</span>
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          )}

          {course.price !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Price
              </span>
              <span className="text-sm font-bold text-primary-600">
                {course.price === 0 ? 'Free' : `$${course.price}`}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-neutral-100">
        <div className="w-full space-y-3">
          {/* Date Information */}
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Created {formatDate(course.createdAt)}
            </span>
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Updated {formatDate(course.updatedAt)}
            </span>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex justify-center space-x-2 w-full">
              {userRole === 'STUDENT' && onEnroll && !course.isEnrolled && (
                <Button
                  onClick={() => onEnroll(course)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 hover:border-red-700 font-semibold"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Enroll
                </Button>
              )}
              
              {onView && (
                <Button
                  onClick={() => onView(course)}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 font-semibold"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </Button>
              )}

              {(userRole === 'ADMIN' || userRole === 'INSTRUCTOR') && onEdit && (
                <Button
                  onClick={() => onEdit(course)}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 hover:text-red-700 font-semibold"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Course
                </Button>
              )}

              {(userRole === 'ADMIN' || userRole === 'INSTRUCTOR') && onDelete && (
                <Button
                  onClick={() => onDelete(course)}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-semibold"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};


