import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { ProgressBar } from './progress-bar';

export interface QuizResult {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'PASSED' | 'FAILED';
  submittedAt: string;
  timeSpent: number;
  answers: Record<string, {
    question: string;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    points: number;
    explanation?: string;
  }>;
}

export interface QuizResultsProps {
  quiz: {
    id: string;
    title: string;
    description: string;
    passingScore: number;
    questions: Array<{
      id: string;
      question: string;
      type: string;
      points: number;
    }>;
  };
  result: QuizResult;
  onRetake?: () => void;
  onBack?: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  quiz,
  result,
  onRetake,
  onBack,
}) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    return status === 'PASSED' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getScoreColor = (percentage: number, passingScore: number) => {
    if (percentage >= passingScore) {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Results Summary */}
      <Card>
        <CardHeader>
          <div className="text-center">
            <CardTitle className="text-2xl mb-2">Quiz Results</CardTitle>
            <Badge className={getStatusColor(result.status)}>
              {result.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(result.percentage, quiz.passingScore)}`}>
                {result.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Final Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {result.score}/{result.maxScore}
              </div>
              <div className="text-sm text-gray-600">Points Earned</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {formatTime(result.timeSpent)}
              </div>
              <div className="text-sm text-gray-600">Time Spent</div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Passing Score: {quiz.passingScore}%</span>
              <span>Your Score: {result.percentage.toFixed(1)}%</span>
            </div>
            <ProgressBar 
              value={result.percentage} 
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiz Details */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700">Quiz Title</div>
              <div className="text-gray-900">{quiz.title}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Submitted At</div>
              <div className="text-gray-900">{formatDate(result.submittedAt)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Total Questions</div>
              <div className="text-gray-900">{quiz.questions.length}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Total Points</div>
              <div className="text-gray-900">{result.maxScore}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card>
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(result.answers).map(([questionId, answerData], index) => (
              <div key={questionId} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-2">
                      Question {index + 1}: {answerData.question}
                    </div>
                    <div className="text-sm text-gray-600">
                      {answerData.points} point{answerData.points !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Badge className={answerData.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {answerData.isCorrect ? 'Correct' : 'Incorrect'}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Your Answer:</div>
                    <div className="text-gray-900 bg-gray-50 p-2 rounded">
                      {Array.isArray(answerData.userAnswer) 
                        ? answerData.userAnswer.join(', ')
                        : answerData.userAnswer || 'No answer provided'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-700">Correct Answer:</div>
                    <div className="text-gray-900 bg-green-50 p-2 rounded">
                      {Array.isArray(answerData.correctAnswer) 
                        ? answerData.correctAnswer.join(', ')
                        : answerData.correctAnswer
                      }
                    </div>
                  </div>
                  
                  {answerData.explanation && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Explanation:</div>
                      <div className="text-gray-900 bg-blue-50 p-2 rounded">
                        {answerData.explanation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Course
          </Button>
        )}
        {onRetake && (
          <Button onClick={onRetake}>
            Retake Quiz
          </Button>
        )}
      </div>
    </div>
  );
};


