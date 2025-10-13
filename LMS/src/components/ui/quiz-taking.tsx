import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { RadioGroup, RadioItem } from './radio-group';
import { Checkbox } from './checkbox';
import { ProgressBar } from './progress-bar';
import { Alert, AlertDescription } from './alert';

export interface QuizQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  question: string;
  options?: string[];
  points: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, string | string[]>;
  score?: number;
  maxScore?: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'GRADED';
  startedAt: string;
  submittedAt?: string;
  timeSpent?: number;
}

export interface QuizTakingProps {
  quiz: {
    id: string;
    title: string;
    description: string;
    timeLimit?: number;
    maxAttempts?: number;
    passingScore: number;
    questions: QuizQuestion[];
  };
  attempt?: QuizAttempt;
  onSubmit: (answers: Record<string, string | string[]>) => void;
  onSave: (answers: Record<string, string | string[]>) => void;
  loading?: boolean;
  error?: string;
}

export const QuizTaking: React.FC<QuizTakingProps> = ({
  quiz,
  attempt,
  onSubmit,
  onSave,
  loading = false,
  error,
}) => {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>(
    attempt?.answers || {}
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  useEffect(() => {
    console.log('Timer useEffect triggered:', { 
      timeLimit: quiz.timeLimit, 
      submittedAt: attempt?.submittedAt,
      startedAt: attempt?.startedAt 
    });
    
    if (quiz.timeLimit && !attempt?.submittedAt) {
      const startTime = new Date(attempt?.startedAt || new Date()).getTime();
      const timeLimitMs = quiz.timeLimit * 60 * 1000;
      
      console.log('Starting timer:', { startTime, timeLimitMs });
      
      const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, timeLimitMs - elapsed);
        
        console.log('Timer tick:', { elapsed, remaining, timeRemaining: Math.floor(remaining / 1000) });
        
        if (remaining === 0) {
          handleSubmit();
        } else {
          setTimeRemaining(Math.floor(remaining / 1000));
        }
      }, 1000);

      return () => clearInterval(timer);
    } else {
      console.log('Timer not started:', { 
        hasTimeLimit: !!quiz.timeLimit, 
        isSubmitted: !!attempt?.submittedAt 
      });
    }
  }, [quiz.timeLimit, attempt?.startedAt, attempt?.submittedAt]);

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    try {
      await onSave(answers);
    } catch (error) {
      console.error('Failed to save answers:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const currentAnswer = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <RadioGroup label="Select your answer:">
            {currentQuestion.options?.map((option, index) => (
              <RadioItem
                key={index}
                value={option}
                label={option}
                checked={currentAnswer === option}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              />
            ))}
          </RadioGroup>
        );

      case 'TRUE_FALSE':
        return (
          <RadioGroup label="Select your answer:">
            <RadioItem 
              value="true" 
              label="True" 
              checked={currentAnswer === 'true'}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            />
            <RadioItem 
              value="false" 
              label="False" 
              checked={currentAnswer === 'false'}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            />
          </RadioGroup>
        );

      case 'SHORT_ANSWER':
        return (
          <Input
            label="Your answer:"
            value={currentAnswer as string || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder="Enter your answer"
          />
        );

      case 'ESSAY':
        return (
          <Textarea
            label="Your answer:"
            value={currentAnswer as string || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder="Enter your detailed answer"
            rows={6}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {quiz.title}
                {attempt && Object.keys(attempt.answers || {}).length > 0 && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                    Continue Quiz
                  </span>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
            </div>
            <div className="text-right">
              {timeRemaining !== null && (
                <div className="text-lg font-mono font-bold text-primary-600">
                  {formatTime(timeRemaining)}
                </div>
              )}
              <div className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attempt && Object.keys(attempt.answers || {}).length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Resuming your quiz</span>
                <span className="text-blue-600">
                  ({Object.keys(attempt.answers || {}).length} question{Object.keys(attempt.answers || {}).length !== 1 ? 's' : ''} answered)
                </span>
              </div>
            </div>
          )}
          <ProgressBar value={progress} className="w-full" />
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion?.question}
          </CardTitle>
          <div className="text-sm text-gray-500">
            {currentQuestion?.points} point{currentQuestion?.points !== 1 ? 's' : ''}
          </div>
        </CardHeader>
        <CardContent>
          {renderQuestion()}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              Save Progress
            </Button>
            
            {currentQuestionIndex === totalQuestions - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === totalQuestions - 1}
              >
                Next
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Question Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Question Navigation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {quiz.questions.map((question, index) => (
              <Button
                key={question.id}
                variant={index === currentQuestionIndex ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-full ${
                  answers[question.id] ? 'bg-green-100 text-green-800' : ''
                }`}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
