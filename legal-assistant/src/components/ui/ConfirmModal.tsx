'use client';

import { Button } from './Button';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

export function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  variant = 'danger',
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        <div className="p-6">
          <h3 className="text-xl font-bold text-[#1A237E] mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button 
              variant={variant === 'danger' ? 'primary' : 'primary'}
              onClick={onConfirm}
              className={
                variant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-yellow-500 hover:bg-yellow-600'
              }
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

