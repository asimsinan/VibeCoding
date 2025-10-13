import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';
import { Button } from './button';
import { Badge } from './badge';

export interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    description: string;
    courseTitle?: string;
    questionCount: number;
    timeLimit?: number;
    maxAttempts?: number;
    passingScore: number;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    totalAttempts?: number;
    averageScore?: number;
  };
  onEdit?: (quiz: QuizCardProps['quiz']) => void;
  onDelete?: (quiz: QuizCardProps['quiz']) => void;
  onView?: (quiz: QuizCardProps['quiz']) => void;
  onTake?: (quiz: QuizCardProps['quiz']) => void;
  showActions?: boolean;
  userRole?: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

export const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  onEdit,
  onDelete,
  onView,
  onTake,
  showActions = true,
  userRole = 'STUDENT',
}) => {
  const getStatusColor = (isPublished: boolean) => {
    return isPublished 
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
      : 'bg-amber-100 text-amber-800 border-amber-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimeLimit = (minutes?: number) => {
    if (!minutes) return 'No limit';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card className="h-full flex flex-col group hover-lift transition-all duration-300 border border-neutral-200 hover:border-primary-300 hover:shadow-card-hover">
      {/* Quiz Header Section */}
      <div className="aspect-video bg-gradient-to-br from-primary-50 to-primary-100 rounded-t-2xl flex items-center justify-center relative">
        <div className="text-primary-400">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="absolute top-3 right-3">
          <Badge className={`${getStatusColor(quiz.isPublished)} border font-medium px-3 py-1`}>
            {quiz.isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <CardTitle className="text-xl font-bold text-neutral-900 line-clamp-2 group-hover:text-primary-700 transition-colors">
            {quiz.title}
          </CardTitle>
          {quiz.courseTitle && (
            <div className="flex items-center text-sm text-neutral-600">
              <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Course: {quiz.courseTitle}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <p className="text-neutral-600 text-sm line-clamp-3 mb-4 leading-relaxed">
          {quiz.description}
        </p>

        {/* Quiz Metadata */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Questions
            </span>
            <span className="text-sm font-medium text-neutral-900">{quiz.questionCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Time Limit
            </span>
            <span className="text-sm font-medium text-neutral-900">{formatTimeLimit(quiz.timeLimit)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500 flex items-center">
              <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Passing Score
            </span>
            <span className="text-sm font-bold text-primary-600">{quiz.passingScore}%</span>
          </div>

          {quiz.maxAttempts && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Max Attempts
              </span>
              <span className="text-sm font-medium text-neutral-900">{quiz.maxAttempts}</span>
            </div>
          )}

          {quiz.totalAttempts !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Total Attempts
              </span>
              <span className="text-sm font-medium text-neutral-900">{quiz.totalAttempts}</span>
            </div>
          )}

          {quiz.averageScore !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 flex items-center">
                <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Average Score
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium text-neutral-900">{quiz.averageScore.toFixed(1)}%</span>
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
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
              Created {formatDate(quiz.createdAt)}
            </span>
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Updated {formatDate(quiz.updatedAt)}
            </span>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex space-x-2 w-full">
              {userRole === 'STUDENT' && onTake && (
                <Button
                  onClick={() => onTake(quiz)}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white border-2 border-primary-600 hover:border-primary-700 disabled:bg-neutral-300 disabled:border-neutral-300"
                  size="sm"
                  disabled={!quiz.isPublished}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Take Quiz
                </Button>
              )}
              
              {onView && (
                <Button
                  onClick={() => onView(quiz)}
                  variant="outline"
                  className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400"
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
                  onClick={() => onEdit(quiz)}
                  variant="outline"
                  className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400"
                  size="sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Button>
              )}

              {(userRole === 'ADMIN' || userRole === 'INSTRUCTOR') && onDelete && (
                <Button
                  onClick={() => onDelete(quiz)}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
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


