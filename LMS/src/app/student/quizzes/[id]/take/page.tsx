'use client';

import Link from 'next/link';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Container, Header, Sidebar, Main } from '@/components/layout';
import { QuizTaking, Alert, AlertDescription, LoadingSpinner, Button } from '@/components/ui';
import { useSession, signOut } from 'next-auth/react';
import { apiClient, ApiError } from '@/lib/api';
import { QuizQuestion, QuizAttempt } from '@/components/ui/quiz-taking';

export default function TakeQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const { data: session, status } = useSession();
  
  // Get retake parameter from URL
  const [isRetake, setIsRetake] = useState(false);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setIsRetake(urlParams.get('retake') === 'true');
  }, []);
  
  const [quiz, setQuiz] = useState<any>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('TakeQuizPage useEffect:', { quizId, session: !!session, isRetake });
    if (quizId && session && isRetake !== null) {
      fetchQuizData();
    }
  }, [quizId, session, isRetake]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      
      // Fetch quiz details
      const quizData = await apiClient.get(`/api/student/quizzes/${quizId}`) as any;
      
      // Transform quiz data to match QuizTaking component expectations
      const transformedQuiz = {
        id: quizData.id,
        title: quizData.title,
        description: `${quizData.courseTitle} - ${quizData.lessonTitle}`,
        timeLimit: quizData.timeLimit,
        maxAttempts: 3, // Default max attempts
        passingScore: 70, // Default passing score
        questions: quizData.questions.map((q: any) => ({
          id: q.id,
          type: q.type,
          question: q.text,
          options: q.options.map((opt: any) => opt.text),
          points: 1,
          explanation: ''
        }))
      };
      
      console.log('Transformed quiz:', transformedQuiz);
      setQuiz(transformedQuiz);

      // Check for existing attempt (skip if retaking)
      console.log('Attempt logic:', { isRetake, willCheckExisting: !isRetake });
      if (!isRetake) {
        try {
          console.log('Fetching existing attempt...');
          const attemptData = await apiClient.get(`/api/student/quizzes/${quizId}/attempt`) as any;
          
          // Transform attempt data to match QuizAttempt interface
          const transformedAttempt: QuizAttempt = {
            id: attemptData.id,
            quizId: attemptData.quizId,
            userId: attemptData.userId,
            answers: attemptData.answers || {},
            score: undefined,
            maxScore: undefined,
            status: 'IN_PROGRESS',
            startedAt: attemptData.createdAt?.toISOString() || new Date().toISOString(),
            submittedAt: attemptData.submittedAt,
            timeSpent: undefined
          };
          
          setAttempt(transformedAttempt);
        } catch (error) {
          // No existing attempt, create a new one
          await createNewAttempt();
        }
      } else {
        // For retakes, always create a new attempt
        console.log('Creating new attempt for retake...');
        await createNewAttempt();
      }

      async function createNewAttempt() {
        try {
          const newAttemptData = await apiClient.post(`/api/student/quizzes/${quizId}/attempt`, {}) as any;
          
          const transformedAttempt: QuizAttempt = {
            id: newAttemptData.id,
            quizId: newAttemptData.quizId,
            userId: newAttemptData.userId,
            answers: newAttemptData.answers || {},
            score: undefined,
            maxScore: undefined,
            status: 'IN_PROGRESS',
            startedAt: newAttemptData.createdAt?.toISOString() || new Date().toISOString(),
            submittedAt: undefined, // Always undefined for new attempts
            timeSpent: undefined
          };
          
          setAttempt(transformedAttempt);
        } catch (createError) {
          console.log('Failed to create new attempt:', createError);
        }
      }

    } catch (error) {
      console.error('Error fetching quiz data:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to fetch quiz data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (answers: Record<string, string | string[]>) => {
    try {
      setError(null);
      
      const response = await apiClient.post(`/api/student/quizzes/${quizId}/submit`, {
        answers,
        attemptId: attempt?.id,
      }) as { id: string };
      
      // Redirect to results page
      router.push(`/student/quizzes/${quizId}/results?attempt=${response.id}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to submit quiz');
      }
    }
  };

  const handleSave = async (answers: Record<string, string | string[]>) => {
    try {
      console.log('Saving progress:', { quizId, attemptId: attempt?.id, answers });
      await apiClient.post(`/api/student/quizzes/${quizId}/save`, {
        answers,
        attemptId: attempt?.id,
      });
      console.log('Progress saved successfully');
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Access Denied</h1>
          <p className="text-neutral-600 mb-6">You need to be logged in to take quizzes.</p>
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

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Quiz not found</h3>
              <p className="text-gray-600">The quiz you're looking for doesn't exist.</p>
              <button
                onClick={() => router.push('/student/courses')}
                className="mt-4 text-gray-600 hover:text-primary-500"
              >
                Back to courses
              </button>
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
              <h1 className="text-3xl font-bold text-red-600">Take Quiz</h1>
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
            <QuizTaking
              quiz={quiz}
              attempt={attempt || undefined}
              onSubmit={handleSubmit}
              onSave={handleSave}
              loading={loading}
              error={error || undefined}
            />
          </Main>
        </div>
      </Container>
    </div>
  );
}
