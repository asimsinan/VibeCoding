'use client';

import React, { useEffect, useState } from 'react';

interface SafeModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const SafeModal: React.FC<SafeModalProps> = ({ isOpen, onClose, children, className = '' }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Delay unmounting to allow exit animation
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (shouldRender) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 ${
          isAnimating ? 'scale-100' : 'scale-95'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default SafeModal;
