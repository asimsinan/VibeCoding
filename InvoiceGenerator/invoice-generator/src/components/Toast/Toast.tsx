import React, { useEffect, useState } from 'react';
import './Toast.css';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      className={`toast toast--${type} ${isVisible ? 'toast--visible' : ''} ${isLeaving ? 'toast--leaving' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast__content">
        <div className="toast__icon">
          {getIcon()}
        </div>
        <div className="toast__body">
          <div className="toast__title">{title}</div>
          {message && (
            <div className="toast__message">{message}</div>
          )}
        </div>
        <button
          onClick={handleClose}
          className="toast__close"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
      {action && (
        <div className="toast__action">
          <button
            onClick={action.onClick}
            className="toast__action-button"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};
