'use client';

import React from 'react';
import { Loader2, FileText, Brain, CheckCircle } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 
      className={`animate-spin text-blue-500 ${sizeClasses[size]} ${className}`} 
    />
  );
};

interface ProcessingStepsProps {
  currentStep: number;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
  }>;
  className?: string;
}

export const ProcessingSteps: React.FC<ProcessingStepsProps> = ({
  currentStep,
  steps,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Brain className="w-8 h-8 text-blue-600 animate-pulse" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Analyzing Your Resume
        </h3>
        <p className="text-gray-600">
          Our AI is carefully reviewing your resume to provide detailed feedback
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div
              key={step.id}
              className={`
                flex items-center space-x-4 p-4 rounded-lg transition-all duration-300
                ${isCompleted ? 'bg-green-50 border border-green-200' : ''}
                ${isCurrent ? 'bg-blue-50 border border-blue-200 shadow-sm' : ''}
                ${isPending ? 'bg-gray-50 border border-gray-200' : ''}
              `}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-gray-500 rounded-full" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h4 className={`
                  font-medium transition-colors
                  ${isCompleted ? 'text-green-900' : ''}
                  ${isCurrent ? 'text-blue-900' : ''}
                  ${isPending ? 'text-gray-500' : ''}
                `}>
                  {step.title}
                </h4>
                <p className={`
                  text-sm transition-colors
                  ${isCompleted ? 'text-green-700' : ''}
                  ${isCurrent ? 'text-blue-700' : ''}
                  ${isPending ? 'text-gray-400' : ''}
                `}>
                  {step.description}
                </p>
              </div>

              <div className="flex-shrink-0">
                {step.icon}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>This usually takes 30-60 seconds</span>
        </div>
      </div>
    </div>
  );
};

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className = '' 
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Processing</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

interface LoadingCardProps {
  title: string;
  description: string;
  progress?: number;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title,
  description,
  progress,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      
      {progress !== undefined && (
        <ProgressBar progress={progress} />
      )}
      
      <div className="mt-4 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
};
