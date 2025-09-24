import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  overlay?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  text,
  overlay = false,
  className = '',
}) => {
  const spinnerClasses = [
    'loading-spinner',
    `loading-spinner--${size}`,
    `loading-spinner--${color}`,
    className,
  ].filter(Boolean).join(' ');

  const content = (
    <div className={spinnerClasses}>
      <div className="loading-spinner__circle">
        <div className="loading-spinner__inner"></div>
      </div>
      {text && (
        <div className="loading-spinner__text">
          {text}
        </div>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-spinner__overlay">
        {content}
      </div>
    );
  }

  return content;
};
