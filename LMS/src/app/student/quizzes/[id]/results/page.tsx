'use client';

import Link from 'next/link';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Container, Header, Sidebar, Main } from '@/components/layout';
import { QuizResults, Alert, AlertDescription, LoadingSpinner, Button } from '@/components/ui';
import { useSession, signOut } from 'next-auth/react';
import { apiClient, ApiError } from '@/lib/api';
import { QuizResult } from '@/components/ui/quiz-results';

export default function QuizResultsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.id as string;
  const attemptId = searchParams.get('attempt');
  const { data: session, status } = useSession();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Quiz Results Page - quizId:', quizId);
    console.log('Quiz Results Page - attemptId:', attemptId);
    console.log('Quiz Results Page - session:', session);
    
    if (quizId && attemptId && session) {
      fetchQuizResults();
    } else if (quizId && session && !attemptId) {
      // If no attemptId provided, try to get the latest attempt
      fetchLatestAttempt();
    }
  }, [quizId, attemptId, session]);

  const fetchLatestAttempt = async () => {
    try {
      setLoading(true);
      console.log('Fetching latest attempt for quiz:', quizId);
      
      // Get the latest attempt for this quiz
      const attempts = await apiClient.get(`/api/student/quizzes/${quizId}/attempts`) as any;
      
      if (attempts && attempts.length > 0) {
        // Use the latest attempt
        const latestAttempt = attempts[0];
        console.log('Latest attempt found:', latestAttempt.id);
        
        // Redirect to results with the attempt ID
        router.push(`/student/quizzes/${quizId}/results?attempt=${latestAttempt.id}`);
      } else {
        setError('No quiz attempts found. Please take the quiz first.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching latest attempt:', error);
      setError('Failed to fetch quiz attempts');
      setLoading(false);
    }
  };

  const fetchQuizResults = async () => {
    try {
      setLoading(true);
      console.log('Fetching quiz results for attempt:', attemptId);
      
      // Fetch quiz details
      const quizData = await apiClient.get(`/api/student/quizzes/${quizId}`) as any;
      
      // Transform quiz data to match QuizResults component expectations
      const transformedQuiz = {
        id: quizData.id,
        title: quizData.title,
        description: `${quizData.courseTitle} - ${quizData.lessonTitle}`,
        courseId: quizData.courseId,
        passingScore: 70, // Default passing score
        questions: quizData.questions.map((q: any) => ({
          id: q.id,
          question: q.text,
          type: q.type,
          points: 1
        }))
      };
      
      setQuiz(transformedQuiz);

      // Fetch quiz results
      const resultData = await apiClient.get(`/api/student/quizzes/${quizId}/results/${attemptId}`) as any;
      
      // Transform the API data to match QuizResults component expectations
      const transformedResult: QuizResult = {
        id: resultData.attemptId,
        quizId: resultData.quizId,
        userId: session?.user?.id || '',
        score: resultData.score,
        maxScore: resultData.maxScore,
        percentage: resultData.percentage,
        status: resultData.passed ? 'PASSED' : 'FAILED',
        submittedAt: resultData.submittedAt,
        timeSpent: resultData.timeSpent || 0,
        answers: resultData.questionResults.reduce((acc: any, question: any, index: number) => {
          acc[question.questionId] = {
            question: question.questionText,
            userAnswer: question.userAnswer || 'No answer provided',
            correctAnswer: question.correctAnswer || 'No correct answer',
            isCorrect: question.isCorrect,
            points: question.isCorrect ? 1 : 0,
            explanation: question.isCorrect ? 'Correct!' : 'Incorrect answer'
          };
          return acc;
        }, {})
      };
      
      setResult(transformedResult);

    } catch (error) {
      console.error('Error fetching quiz results:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to fetch quiz results');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    router.push(`/student/quizzes/${quizId}/take?retake=true`);
  };

  const handleBack = () => {
    if (quiz && quiz.courseId) {
      router.push(`/student/courses/${quiz.courseId}`);
    } else {
      router.push('/student/courses');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading quiz results...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Access Denied</h1>
          <p className="text-neutral-600 mb-6">You need to be logged in to view quiz results.</p>
          <Button onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
        <Container>
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </Container>
      </div>
    );
  }

  if (!quiz || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Results not found</h3>
              <p className="text-gray-600">
                {!attemptId 
                  ? "No quiz attempts found. Please take the quiz first to see results."
                  : "The quiz results you're looking for don't exist."
                }
              </p>
              <div className="mt-4 space-x-4">
                <button
                  onClick={() => router.push(`/student/quizzes/${quizId}/take`)}
                  className="text-gray-600 hover:text-primary-500"
                >
                  Take Quiz
                </button>
                <button
                  onClick={() => router.push('/student/courses')}
                  className="text-gray-600 hover:text-primary-500"
                >
                  Back to courses
                </button>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
      <Container>
        <Header variant="default" sticky>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-red-600">Quiz Results</h1>
              <p className="text-gray-600 font-medium">{quiz.title}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-full font-medium">
                {session?.user?.organization?.name}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Header>

        <div className="flex">
          <Sidebar variant="glass">
            <nav className="space-y-3">
              <Link href="/student/dashboard" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Course Catalog
              </Link>
              <Link href="/student/quizzes" className="flex items-center px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 group">
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
          </Sidebar>

          <Main background="gradient">
            {error && (
              <Alert className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <QuizResults
              quiz={quiz}
              result={result}
              onRetake={handleRetake}
              onBack={handleBack}
            />
          </Main>
        </div>
      </Container>
    </div>
  );
}
