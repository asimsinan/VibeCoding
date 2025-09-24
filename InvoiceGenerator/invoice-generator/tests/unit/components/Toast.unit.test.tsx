import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Toast, ToastProps } from '../../../src/components/Toast/Toast';

const defaultProps: ToastProps = {
  id: 'test-toast',
  type: 'info',
  title: 'Test Toast',
  onClose: jest.fn(),
};

describe('Toast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(<Toast {...defaultProps} />);
    
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders with message when provided', () => {
    render(<Toast {...defaultProps} message="Test message" />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders correct icon for each type', () => {
    const { rerender } = render(<Toast {...defaultProps} type="success" />);
    expect(screen.getByText('✅')).toBeInTheDocument();

    rerender(<Toast {...defaultProps} type="error" />);
    expect(screen.getByText('❌')).toBeInTheDocument();

    rerender(<Toast {...defaultProps} type="warning" />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();

    rerender(<Toast {...defaultProps} type="info" />);
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('applies correct CSS classes for each type', () => {
    const { rerender } = render(<Toast {...defaultProps} type="success" />);
    expect(screen.getByRole('alert')).toHaveClass('toast--success');

    rerender(<Toast {...defaultProps} type="error" />);
    expect(screen.getByRole('alert')).toHaveClass('toast--error');

    rerender(<Toast {...defaultProps} type="warning" />);
    expect(screen.getByRole('alert')).toHaveClass('toast--warning');

    rerender(<Toast {...defaultProps} type="info" />);
    expect(screen.getByRole('alert')).toHaveClass('toast--info');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<Toast {...defaultProps} onClose={onClose} />);
    
    fireEvent.click(screen.getByLabelText('Close notification'));
    expect(onClose).toHaveBeenCalledWith('test-toast');
  });

  it('calls onClose when duration expires', async () => {
    const onClose = jest.fn();
    render(<Toast {...defaultProps} onClose={onClose} duration={100} />);
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledWith('test-toast');
    }, { timeout: 200 });
  });

  it('does not auto-close when duration is 0', async () => {
    const onClose = jest.fn();
    render(<Toast {...defaultProps} onClose={onClose} duration={0} />);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders action button when provided', () => {
    const action = {
      label: 'Retry',
      onClick: jest.fn(),
    };
    
    render(<Toast {...defaultProps} action={action} />);
    
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls action onClick when action button is clicked', () => {
    const action = {
      label: 'Retry',
      onClick: jest.fn(),
    };
    
    render(<Toast {...defaultProps} action={action} />);
    
    fireEvent.click(screen.getByText('Retry'));
    expect(action.onClick).toHaveBeenCalled();
  });

  it('has correct ARIA attributes', () => {
    render(<Toast {...defaultProps} />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('applies visible class after mount', async () => {
    render(<Toast {...defaultProps} />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('toast--visible');
  });

  it('applies leaving class when closing', () => {
    const onClose = jest.fn();
    render(<Toast {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('toast--leaving');
  });
});
