import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

describe('Modal Component', () => {
  it('should render modal when isOpen is true', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Test Modal">Content</Modal>);
    expect(screen.getByText(/test modal/i)).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(<Modal isOpen={false} onClose={() => {}} title="Test Modal">Content</Modal>);
    expect(screen.queryByText(/test modal/i)).not.toBeInTheDocument();
  });

  it('should render modal with Turkish title', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Test Modali">İçerik</Modal>);
    expect(screen.getByText('Test Modali')).toBeInTheDocument();
    expect(screen.getByText('İçerik')).toBeInTheDocument();
  });

  it('should render modal children', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Modal">Content</Modal>);
    expect(screen.getByText(/content/i)).toBeInTheDocument();
  });

  it('should apply backdrop styles', () => {
    const { container } = render(<Modal isOpen={true} onClose={() => {}} title="Modal">Content</Modal>);
    const backdrop = container.querySelector('.bg-black');
    expect(backdrop).toHaveClass('bg-black');
    expect(backdrop).toHaveClass('bg-opacity-50');
  });

  it('should apply modal container styles', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Modal">Content</Modal>);
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('bg-white');
    expect(modal).toHaveClass('rounded-xl');
    expect(modal).toHaveClass('shadow-2xl');
  });

  it('should close when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<Modal isOpen={true} onClose={handleClose} title="Modal">Content</Modal>);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should close when backdrop is clicked', () => {
    const handleClose = jest.fn();
    render(<Modal isOpen={true} onClose={handleClose} title="Modal">Content</Modal>);
    const backdrop = screen.getByRole('dialog').parentElement;
    fireEvent.click(backdrop!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should not close when modal content is clicked', () => {
    const handleClose = jest.fn();
    render(<Modal isOpen={true} onClose={handleClose} title="Modal">Content</Modal>);
    const modal = screen.getByRole('dialog');
    fireEvent.click(modal);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('should apply animation classes', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Modal">Content</Modal>);
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('animate-slide-up');
  });

  it('should have title styling', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Modal">Content</Modal>);
    expect(screen.getByText(/modal/i)).toHaveClass('text-2xl');
    expect(screen.getByText(/modal/i)).toHaveClass('font-bold');
    expect(screen.getByText(/modal/i)).toHaveClass('text-turkish-blue');
  });

  it('should render with custom size', () => {
    const { rerender } = render(<Modal isOpen={true} onClose={() => {}} title="Modal" size="sm">Content</Modal>);
    let modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-md');

    rerender(<Modal isOpen={true} onClose={() => {}} title="Modal" size="md">Content</Modal>);
    modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-lg');

    rerender(<Modal isOpen={true} onClose={() => {}} title="Modal" size="lg">Content</Modal>);
    modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-2xl');
  });

  it('should have proper accessibility attributes', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Modal">Content</Modal>);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
  });

  it('should apply Turkish blue close button styles', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Modal">Content</Modal>);
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toHaveClass('text-gray-400');
    expect(closeButton).toHaveClass('hover:text-turkish-blue');
  });
});

