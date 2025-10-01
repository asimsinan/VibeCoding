/**
 * Star Rating Component
 * 
 * Interactive star rating component for rating products
 */

import React, { useState, useEffect } from 'react';

export interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showValue?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  onRatingChange,
  maxRating = 5,
  size = 'md',
  interactive = true,
  showValue = false,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [displayRating, setDisplayRating] = useState(rating);

  useEffect(() => {
    setDisplayRating(rating);
  }, [rating]);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleMouseEnter = (starRating: number) => {
    if (interactive) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const handleClick = (starRating: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent event from bubbling up to parent elements
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
      // Don't update local state here - let the parent component handle the update
      // The displayRating will be updated via useEffect when the rating prop changes
    }
  };

  const currentRating = hoverRating || displayRating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex">
        {Array.from({ length: maxRating }, (_, index) => {
          const starRating = index + 1;
          const isFilled = starRating <= currentRating;
          
          return (
            <button
              key={index}
              type="button"
              className={`${sizeClasses[size]} transition-colors duration-150 ${
                interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              }`}
              onMouseEnter={() => handleMouseEnter(starRating)}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => handleClick(starRating, e)}
              disabled={!interactive}
            >
              <svg
                className={`w-full h-full ${
                  isFilled ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="ml-1 text-xs text-gray-600 whitespace-nowrap">
          {displayRating.toFixed(1)}/{maxRating}
        </span>
      )}
    </div>
  );
};

export default StarRating;
