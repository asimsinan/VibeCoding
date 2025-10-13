'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert, AlertDescription, Input, Select } from '@/components/ui';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api';

interface Question {
  id?: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer?: string | string[];
}

interface QuizFormData {
  title: string;
  description: string;
  timeLimit?: number;
  maxAttempts?: number;
  passingScore: number;
  isPublished: boolean;
  questions: Question[];
}

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const { data: session, status } = useSession();
  
  const [quiz, setQuiz] = useState<QuizFormData>({
    title: '',
    description: '',
    timeLimit: undefined,
    maxAttempts: undefined,
    passingScore: 70,
    isPublished: false,
    questions: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!session) {
        return;
      }

      if (quizId) {
        try {
          setLoading(true);
          const quizData = await apiClient.get(`/api/instructor/quizzes/${quizId}`) as any;
          
          // Transform the quiz data to match QuizFormData format
          const formData: QuizFormData = {
            title: quizData.title || '',
            description: quizData.description || '',
            timeLimit: quizData.timeLimit || undefined,
            maxAttempts: quizData.maxAttempts || undefined,
            passingScore: quizData.passingScore || 70,
            isPublished: quizData.isPublished || false,
            questions: quizData.questions?.map((q: any) => ({
              id: q.id,
              question: q.text,
              type: q.type,
              options: q.options || [],
              correctAnswer: q.correctAnswer,
            })) || [],
          };
          
          setQuiz(formData);
        } catch (error) {
          if (error instanceof ApiError) {
            setError(error.message);
          } else {
            setError('Failed to fetch quiz');
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchQuiz();
  }, [session, quizId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const response = await apiClient.put(`/api/instructor/quizzes/${quizId}`, quiz);
      
      // Redirect to the quiz detail page
      router.push(`/instructor/quizzes/${quizId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError('Failed to update quiz');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/instructor/quizzes/${quizId}`);
  };

  const handleInputChange = (field: keyof QuizFormData, value: any) => {
    setQuiz(prev => ({ ...prev, [field]: value }));
  };

  const addQuestion = () => {
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question: '',
        type: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correctAnswer: '',
      }]
    }));
  };

  const removeQuestion = (index: number) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === questionIndex 
          ? { 
              ...q, 
              options: q.options?.map((opt, j) => j === optionIndex ? value : opt) || []
            } 
          : q
      )
    }));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading quiz editor...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Access Denied</h1>
          <p className="text-neutral-600 mb-6">You need to be logged in to edit quizzes.</p>
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
              <Link href="/instructor/quizzes" className="flex items-center px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 group">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Quiz</h1>
              <p className="text-gray-600">Update your quiz details</p>
            </div>
              {error && (
                <Alert className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card hover>
                <CardHeader className="bg-red-50 border-b border-red-200">
                  <CardTitle className="text-red-700">Quiz Information</CardTitle>
                </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Quiz Title
                      </label>
                      <Input
                        type="text"
                        value={quiz.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter quiz title"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={quiz.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Enter quiz description"
                        rows={4}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-neutral-900 placeholder-neutral-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Time Limit (minutes)
                        </label>
                        <Input
                          type="number"
                          value={quiz.timeLimit ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = value ? parseInt(value) : undefined;
                            handleInputChange('timeLimit', isNaN(numValue as number) ? undefined : numValue);
                          }}
                          placeholder="No limit"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Max Attempts
                        </label>
                        <Input
                          type="number"
                          value={quiz.maxAttempts ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = value ? parseInt(value) : undefined;
                            handleInputChange('maxAttempts', isNaN(numValue as number) ? undefined : numValue);
                          }}
                          placeholder="Unlimited"
                          min="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Passing Score (%)
                      </label>
                      <Input
                        type="number"
                        value={quiz.passingScore}
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = parseInt(value);
                          handleInputChange('passingScore', isNaN(numValue) ? 70 : numValue);
                        }}
                        placeholder="70"
                        min="0"
                        max="100"
                        required
                      />
                    </div>

                    <div>
                      <Select
                        label="Status"
                        value={quiz.isPublished ? 'published' : 'draft'}
                        onChange={(e) => handleInputChange('isPublished', e.target.value === 'published')}
                        options={[
                          { value: 'draft', label: 'Draft' },
                          { value: 'published', label: 'Published' }
                        ]}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Questions Section */}
                <Card hover>
                  <CardHeader className="bg-red-50 border-b border-red-200">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-red-700">Questions ({quiz.questions.length})</CardTitle>
                      <Button
                        type="button"
                        onClick={addQuestion}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Add Question
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {quiz.questions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No questions added yet. Click "Add Question" to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {quiz.questions.map((question, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                              <Button
                                type="button"
                                onClick={() => removeQuestion(index)}
                                className="text-red-600 hover:text-red-600 hover:bg-red-50"
                                variant="outline"
                                size="sm"
                              >
                                Remove
                              </Button>
                            </div>

                            <div className="space-y-4">
                              {/* Question Text */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Question Text
                                </label>
                                <textarea
                                  value={question.question}
                                  onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                  placeholder="Enter your question"
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 placeholder-gray-500"
                                />
                              </div>

                              {/* Question Type */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Question Type
                                </label>
                                <Select
                                  value={question.type}
                                  onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                                  options={[
                                    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
                                    { value: 'TRUE_FALSE', label: 'True/False' },
                                    { value: 'SHORT_ANSWER', label: 'Short Answer' },
                                    { value: 'ESSAY', label: 'Essay' }
                                  ]}
                                />
                              </div>

                              {/* Options for Multiple Choice */}
                              {question.type === 'MULTIPLE_CHOICE' && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Answer Options
                                  </label>
                                  <div className="space-y-2">
                                    {question.options?.map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center space-x-2">
                                        <span className="text-sm font-medium text-gray-600 w-6">
                                          {String.fromCharCode(65 + optionIndex)}
                                        </span>
                                        <Input
                                          value={option}
                                          onChange={(e) => updateQuestionOption(index, optionIndex, e.target.value)}
                                          placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Correct Answer */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Correct Answer
                                </label>
                                {question.type === 'MULTIPLE_CHOICE' ? (
                                  <Select
                                    value={question.correctAnswer as string || ''}
                                    onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                    options={question.options?.map((option, i) => ({
                                      value: String.fromCharCode(65 + i),
                                      label: `${String.fromCharCode(65 + i)}: ${option}`
                                    })) || []}
                                  />
                                ) : question.type === 'TRUE_FALSE' ? (
                                  <Select
                                    value={question.correctAnswer as string || ''}
                                    onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                    options={[
                                      { value: 'true', label: 'True' },
                                      { value: 'false', label: 'False' }
                                    ]}
                                  />
                                ) : (
                                  <Input
                                    value={question.correctAnswer as string || ''}
                                    onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                    placeholder="Enter correct answer"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 hover:border-red-700 font-semibold"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
