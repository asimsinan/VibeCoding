import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Toast } from '@/components/ui/Toast';

describe('Toast Component', () => {
  it('should render toast with message', () => {
    render(<Toast message="Test message" isVisible={true} onClose={() => {}} />);
    expect(screen.getByText(/test message/i)).toBeInTheDocument();
  });

  it('should render toast with Turkish message', () => {
    render(<Toast message="Test mesajı" isVisible={true} onClose={() => {}} />);
    expect(screen.getByText(/test mesajı/i)).toBeInTheDocument();
  });

  it('should render toast with different variants', () => {
    const { container, rerender } = render(<Toast message="Success" variant="success" isVisible={true} onClose={() => {}} />);
    let toast = container.querySelector('.bg-green-50');
    expect(toast).toHaveClass('bg-green-50');
    expect(toast).toHaveClass('border-green-500');

    rerender(<Toast message="Error" variant="error" isVisible={true} onClose={() => {}} />);
    toast = container.querySelector('.bg-red-50');
    expect(toast).toHaveClass('bg-red-50');
    expect(toast).toHaveClass('border-red-500');

    rerender(<Toast message="Warning" variant="warning" isVisible={true} onClose={() => {}} />);
    toast = container.querySelector('.bg-yellow-50');
    expect(toast).toHaveClass('bg-yellow-50');
    expect(toast).toHaveClass('border-yellow-500');

    rerender(<Toast message="Info" variant="info" isVisible={true} onClose={() => {}} />);
    toast = container.querySelector('.bg-blue-50');
    expect(toast).toHaveClass('bg-blue-50');
    expect(toast).toHaveClass('border-blue-500');
  });

  it('should apply position styles', () => {
    const { container, rerender } = render(<Toast message="Top" position="top" isVisible={true} onClose={() => {}} />);
    let outerDiv = container.querySelector('.top-4');
    expect(outerDiv).toHaveClass('top-4');

    rerender(<Toast message="Bottom" position="bottom" isVisible={true} onClose={() => {}} />);
    outerDiv = container.querySelector('.bottom-4');
    expect(outerDiv).toHaveClass('bottom-4');

    rerender(<Toast message="Center" position="center" isVisible={true} onClose={() => {}} />);
    outerDiv = container.querySelector('.top-1\\/2');
    expect(outerDiv).toHaveClass('top-1/2');
  });

  it('should apply animation classes', () => {
    const { container } = render(<Toast message="Animated" isVisible={true} onClose={() => {}} />);
    const toast = container.querySelector('.animate-slide-down');
    expect(toast).toHaveClass('animate-slide-down');
  });

  it('should auto-close after duration', async () => {
    const handleClose = jest.fn();
    render(<Toast message="Auto close" duration={100} isVisible={true} onClose={handleClose} />);
    await waitFor(() => {
      expect(handleClose).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('should close when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<Toast message="Closable" isVisible={true} onClose={handleClose} />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    closeButton.click();
    expect(handleClose).toHaveBeenCalled();
  });

  it('should apply shadow styles', () => {
    const { container } = render(<Toast message="Shadow" isVisible={true} onClose={() => {}} />);
    const toast = container.querySelector('.shadow-lg');
    expect(toast).toHaveClass('shadow-lg');
  });

  it('should render with icon when provided', () => {
    render(<Toast message="With icon" icon={<span>✓</span>} isVisible={true} onClose={() => {}} />);
    expect(screen.getByText(/✓/i)).toBeInTheDocument();
  });

  it('should apply Turkish blue border for info variant', () => {
    const { container } = render(<Toast message="Info" variant="info" isVisible={true} onClose={() => {}} />);
    const toast = container.querySelector('.border-blue-500');
    expect(toast).toHaveClass('border-blue-500');
  });

  it('should have proper z-index for overlay', () => {
    const { container } = render(<Toast message="Overlay" isVisible={true} onClose={() => {}} />);
    const outerDiv = container.querySelector('.z-50');
    expect(outerDiv).toHaveClass('z-50');
  });

  it('should render toast title when provided', () => {
    render(<Toast message="Toast" title="Title" isVisible={true} onClose={() => {}} />);
    expect(screen.getByText(/title/i)).toBeInTheDocument();
  });

  it('should apply max-width constraint', () => {
    const { container } = render(<Toast message="Constraint" isVisible={true} onClose={() => {}} />);
    const toast = container.querySelector('.max-w-md');
    expect(toast).toHaveClass('max-w-md');
  });
});

