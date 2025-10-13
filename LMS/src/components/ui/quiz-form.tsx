import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select } from './select';
import { Checkbox } from './checkbox';
import { RadioGroup, RadioItem } from './radio-group';

export interface Question {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
}

export interface QuizFormData {
  title: string;
  description: string;
  courseId: string;
  timeLimit?: number;
  maxAttempts?: number;
  passingScore: number;
  isPublished: boolean;
  questions: Question[];
}

export interface QuizFormProps {
  initialData?: Partial<QuizFormData>;
  onSubmit: (data: QuizFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  title?: string;
  courses?: Array<{ id: string; title: string }>;
}

export const QuizForm: React.FC<QuizFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
  title = 'Create Quiz',
  courses = [],
}) => {
  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    description: '',
    courseId: '',
    timeLimit: 0,
    maxAttempts: 0,
    passingScore: 70,
    isPublished: false,
    questions: [],
    ...initialData,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'MULTIPLE_CHOICE',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'timeLimit' || name === 'maxAttempts' || name === 'passingScore') {
      setFormData(prev => ({ ...prev, [name]: Number(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleQuestionChange = (field: keyof Question, value: any) => {
    setNewQuestion(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const options = [...(newQuestion.options || [])];
    options[index] = value;
    setNewQuestion(prev => ({ ...prev, options }));
  };

  const addQuestion = () => {
    if (!newQuestion.question?.trim()) return;

    const question: Question = {
      id: Date.now().toString(),
      type: newQuestion.type || 'MULTIPLE_CHOICE',
      question: newQuestion.question,
      options: newQuestion.type === 'MULTIPLE_CHOICE' ? newQuestion.options : undefined,
      correctAnswer: newQuestion.correctAnswer,
      points: newQuestion.points || 1,
      explanation: newQuestion.explanation,
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, question]
    }));

    // Reset new question form
    setNewQuestion({
      type: 'MULTIPLE_CHOICE',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
    });
  };

  const removeQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const questions = [...formData.questions];
    const index = questions.findIndex(q => q.id === questionId);
    
    if (direction === 'up' && index > 0) {
      [questions[index], questions[index - 1]] = [questions[index - 1], questions[index]];
    } else if (direction === 'down' && index < questions.length - 1) {
      [questions[index], questions[index + 1]] = [questions[index + 1], questions[index]];
    }
    
    setFormData(prev => ({ ...prev, questions }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.courseId) {
      errors.courseId = 'Course is required';
    }
    
    if (formData.questions.length === 0) {
      errors.questions = 'At least one question is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSubmit(formData);
  };

  const courseOptions = [
    { value: '', label: 'Select a course' },
    ...courses.map(course => ({ value: course.id, label: course.title }))
  ];

  const questionTypeOptions = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
    { value: 'TRUE_FALSE', label: 'True/False' },
    { value: 'SHORT_ANSWER', label: 'Short Answer' },
    { value: 'ESSAY', label: 'Essay' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Quiz Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            error={formErrors.title}
            placeholder="Enter quiz title"
            required
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            error={formErrors.description}
            placeholder="Enter quiz description"
            rows={3}
            required
          />

          <Select
            label="Course"
            name="courseId"
            value={formData.courseId}
            onChange={handleInputChange}
            error={formErrors.courseId}
            options={courseOptions}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Time Limit (minutes)"
              name="timeLimit"
              type="number"
              value={formData.timeLimit}
              onChange={handleInputChange}
              placeholder="0 for no limit"
              min="0"
            />

            <Input
              label="Max Attempts"
              name="maxAttempts"
              type="number"
              value={formData.maxAttempts}
              onChange={handleInputChange}
              placeholder="0 for unlimited"
              min="0"
            />

            <Input
              label="Passing Score (%)"
              name="passingScore"
              type="number"
              value={formData.passingScore}
              onChange={handleInputChange}
              placeholder="70"
              min="0"
              max="100"
            />
          </div>

          <Checkbox
            label="Publish quiz immediately"
            name="isPublished"
            checked={formData.isPublished}
            onChange={handleInputChange}
          />

          {/* Questions Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Questions
            </label>
            
            {formErrors.questions && (
              <p className="text-sm text-red-600 mb-4">{formErrors.questions}</p>
            )}

            {/* Existing Questions */}
            {formData.questions.map((question, index) => (
              <Card key={question.id} className="mb-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Question {index + 1}</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moveQuestion(question.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moveQuestion(question.id, 'down')}
                        disabled={index === formData.questions.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-2">{question.question}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Type: {question.type.replace('_', ' ')}</span>
                    <span>Points: {question.points}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Question */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">Add New Question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Question Type"
                    value={newQuestion.type}
                    onChange={(e) => handleQuestionChange('type', e.target.value)}
                    options={questionTypeOptions}
                  />
                  <Input
                    label="Points"
                    type="number"
                    value={newQuestion.points}
                    onChange={(e) => handleQuestionChange('points', Number(e.target.value))}
                    min="1"
                  />
                </div>

                <Textarea
                  label="Question"
                  value={newQuestion.question}
                  onChange={(e) => handleQuestionChange('question', e.target.value)}
                  placeholder="Enter your question"
                  rows={2}
                />

                {newQuestion.type === 'MULTIPLE_CHOICE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    {newQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                        <RadioGroup>
                          <RadioItem
                            value={option}
                            label=""
                            checked={newQuestion.correctAnswer === option}
                            onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                          />
                        </RadioGroup>
                      </div>
                    ))}
                  </div>
                )}

                {newQuestion.type === 'TRUE_FALSE' && (
                  <RadioGroup label="Correct Answer">
                    <RadioItem 
                      value="true" 
                      label="True" 
                      checked={newQuestion.correctAnswer === 'true'}
                      onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                    />
                    <RadioItem 
                      value="false" 
                      label="False" 
                      checked={newQuestion.correctAnswer === 'false'}
                      onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                    />
                  </RadioGroup>
                )}

                {(newQuestion.type === 'SHORT_ANSWER' || newQuestion.type === 'ESSAY') && (
                  <Input
                    label="Correct Answer (Optional)"
                    value={newQuestion.correctAnswer}
                    onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                    placeholder="Enter correct answer"
                  />
                )}

                <Textarea
                  label="Explanation (Optional)"
                  value={newQuestion.explanation}
                  onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                  placeholder="Explain why this is the correct answer"
                  rows={2}
                />

                <Button
                  type="button"
                  onClick={addQuestion}
                  disabled={!newQuestion.question?.trim()}
                >
                  Add Question
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Quiz'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
