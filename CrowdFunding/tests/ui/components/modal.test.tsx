import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js components
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}));

// Modal Component Tests
function ModalTest() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  return (
    <div className="p-8 space-y-4">
      <h2 className="heading-2 mb-6">Modal Components</h2>
      
      {/* Modal Trigger Buttons */}
      <div className="flex gap-4 mb-6">
        <button 
          className="btn-primary" 
          onClick={() => setIsOpen(true)}
          data-testid="open-modal-button"
        >
          Open Modal
        </button>
        <button 
          className="btn-danger" 
          onClick={() => setIsConfirmOpen(true)}
          data-testid="open-confirm-button"
        >
          Delete Item
        </button>
      </div>
      
      {/* Basic Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="modal-overlay">
          <div className="bg-white rounded-xl shadow-strong max-w-md w-full mx-4" data-testid="basic-modal">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="heading-3">Modal Title</h3>
                <button 
                  className="text-neutral-400 hover:text-neutral-600 text-xl"
                  onClick={() => setIsOpen(false)}
                  data-testid="close-modal-button"
                >
                  ×
                </button>
              </div>
              <p className="text-body mb-6">
                This is a basic modal with some content. You can add any content here.
              </p>
              <div className="flex gap-3 justify-end">
                <button 
                  className="btn-outline" 
                  onClick={() => setIsOpen(false)}
                  data-testid="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => setIsOpen(false)}
                  data-testid="confirm-button"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="confirm-overlay">
          <div className="bg-white rounded-xl shadow-strong max-w-sm w-full mx-4" data-testid="confirm-modal">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-accent-600 text-xl">⚠</span>
              </div>
              <h3 className="heading-3 mb-2">Confirm Deletion</h3>
              <p className="text-body mb-6">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  className="btn-outline" 
                  onClick={() => setIsConfirmOpen(false)}
                  data-testid="cancel-delete-button"
                >
                  Cancel
                </button>
                <button 
                  className="btn-danger" 
                  onClick={() => setIsConfirmOpen(false)}
                  data-testid="delete-button"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Form Modal */}
      <div className="card p-6" data-testid="form-modal-preview">
        <h3 className="heading-3 mb-4">Form Modal Preview</h3>
        <p className="text-body mb-4">
          This shows how a form would look inside a modal:
        </p>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Campaign Title</label>
            <input type="text" className="input" placeholder="Enter campaign title" />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Enter description"></textarea>
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-outline">Cancel</button>
            <button className="btn-primary">Create Campaign</button>
          </div>
        </div>
      </div>
      
      {/* Loading Modal */}
      <div className="card p-6" data-testid="loading-modal-preview">
        <h3 className="heading-3 mb-4">Loading Modal Preview</h3>
        <div className="text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin text-primary-600">⟳</div>
          </div>
          <p className="text-body">Processing your request...</p>
        </div>
      </div>
    </div>
  );
}

describe('Modal Components', () => {
  it('should render modal trigger buttons', () => {
    render(<ModalTest />);
    
    expect(screen.getByTestId('open-modal-button')).toBeInTheDocument();
    expect(screen.getByTestId('open-confirm-button')).toBeInTheDocument();
    expect(screen.getByText('Open Modal')).toBeInTheDocument();
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
  });

  it('should open basic modal when trigger is clicked', () => {
    render(<ModalTest />);
    
    const openButton = screen.getByTestId('open-modal-button');
    fireEvent.click(openButton);
    
    expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('basic-modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
  });

  it('should open confirmation modal when delete button is clicked', () => {
    render(<ModalTest />);
    
    const deleteButton = screen.getByTestId('open-confirm-button');
    fireEvent.click(deleteButton);
    
    expect(screen.getByTestId('confirm-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    render(<ModalTest />);
    
    const openButton = screen.getByTestId('open-modal-button');
    fireEvent.click(openButton);
    
    expect(screen.getByTestId('basic-modal')).toBeInTheDocument();
    
    const closeButton = screen.getByTestId('close-modal-button');
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('basic-modal')).not.toBeInTheDocument();
  });

  it('should close modal when cancel button is clicked', () => {
    render(<ModalTest />);
    
    const openButton = screen.getByTestId('open-modal-button');
    fireEvent.click(openButton);
    
    expect(screen.getByTestId('basic-modal')).toBeInTheDocument();
    
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByTestId('basic-modal')).not.toBeInTheDocument();
  });

  it('should close modal when confirm button is clicked', () => {
    render(<ModalTest />);
    
    const openButton = screen.getByTestId('open-modal-button');
    fireEvent.click(openButton);
    
    expect(screen.getByTestId('basic-modal')).toBeInTheDocument();
    
    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);
    
    expect(screen.queryByTestId('basic-modal')).not.toBeInTheDocument();
  });

  it('should close confirmation modal when cancel is clicked', () => {
    render(<ModalTest />);
    
    const deleteButton = screen.getByTestId('open-confirm-button');
    fireEvent.click(deleteButton);
    
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    
    const cancelButton = screen.getByTestId('cancel-delete-button');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  it('should close confirmation modal when delete is clicked', () => {
    render(<ModalTest />);
    
    const deleteButton = screen.getByTestId('open-confirm-button');
    fireEvent.click(deleteButton);
    
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    
    const confirmDeleteButton = screen.getByTestId('delete-button');
    fireEvent.click(confirmDeleteButton);
    
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  it('should render modal overlay with correct styling', () => {
    render(<ModalTest />);
    
    const openButton = screen.getByTestId('open-modal-button');
    fireEvent.click(openButton);
    
    const overlay = screen.getByTestId('modal-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
  });

  it('should render modal content with correct styling', () => {
    render(<ModalTest />);
    
    const openButton = screen.getByTestId('open-modal-button');
    fireEvent.click(openButton);
    
    const modal = screen.getByTestId('basic-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveClass('bg-white', 'rounded-xl', 'shadow-strong');
  });

  it('should render form modal preview', () => {
    render(<ModalTest />);
    
    expect(screen.getByTestId('form-modal-preview')).toBeInTheDocument();
    expect(screen.getByText('Form Modal Preview')).toBeInTheDocument();
    expect(screen.getByText('Campaign Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('should render loading modal preview', () => {
    render(<ModalTest />);
    
    expect(screen.getByTestId('loading-modal-preview')).toBeInTheDocument();
    expect(screen.getByText('Loading Modal Preview')).toBeInTheDocument();
    expect(screen.getByText('Processing your request...')).toBeInTheDocument();
  });

  it('should render warning icon in confirmation modal', () => {
    render(<ModalTest />);
    
    const deleteButton = screen.getByTestId('open-confirm-button');
    fireEvent.click(deleteButton);
    
    const warningIcon = screen.getByText('⚠');
    expect(warningIcon).toBeInTheDocument();
  });

  it('should render loading spinner in loading modal', () => {
    render(<ModalTest />);
    
    const loadingModal = screen.getByTestId('loading-modal-preview');
    const spinner = loadingModal.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should handle multiple modal interactions', () => {
    render(<ModalTest />);
    
    // Open basic modal
    const openButton = screen.getByTestId('open-modal-button');
    fireEvent.click(openButton);
    expect(screen.getByTestId('basic-modal')).toBeInTheDocument();
    
    // Close basic modal
    const closeButton = screen.getByTestId('close-modal-button');
    fireEvent.click(closeButton);
    expect(screen.queryByTestId('basic-modal')).not.toBeInTheDocument();
    
    // Open confirmation modal
    const deleteButton = screen.getByTestId('open-confirm-button');
    fireEvent.click(deleteButton);
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    
    // Close confirmation modal
    const cancelButton = screen.getByTestId('cancel-delete-button');
    fireEvent.click(cancelButton);
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });
});
