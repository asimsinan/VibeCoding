import React from 'react';
import { Modal } from '../Modal/Modal';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className={`confirmation-modal confirmation-modal--${variant}`}>
        <div className="confirmation-modal__icon">
          {variant === 'danger' && '⚠️'}
          {variant === 'warning' && '⚠️'}
          {variant === 'info' && 'ℹ️'}
        </div>
        
        <div className="confirmation-modal__content">
          <p className="confirmation-modal__message">{message}</p>
        </div>

        <div className="confirmation-modal__actions">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn btn--secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`btn btn--${variant === 'danger' ? 'danger' : 'primary'}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
