import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../../../apps/web/src/components/Modal';

describe('Modal Component', () => {
  it('should render modal when open', () => {
    render(<Modal isOpen={true} onClose={() => {}}>Modal content</Modal>);
    expect(screen.getByText('Modal content')).toBeDefined();
  });

  it('should not render modal when closed', () => {
    const { container } = render(<Modal isOpen={false} onClose={() => {}}>Modal content</Modal>);
    expect(container.textContent).toBe('');
  });

  it('should call onClose when close button clicked', () => {
    let closed = false;
    render(<Modal isOpen={true} onClose={() => { closed = true; }}>Content</Modal>);
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(closed).toBe(true);
  });

  it('should render modal with title', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Modal Title">Content</Modal>);
    expect(screen.getByText('Modal Title')).toBeDefined();
  });

  it('should support different sizes', () => {
    const { rerender } = render(<Modal isOpen={true} onClose={() => {}} size="sm">Small</Modal>);
    expect(screen.getByText('Small')).toBeDefined();
    
    rerender(<Modal isOpen={true} onClose={() => {}} size="lg">Large</Modal>);
    expect(screen.getByText('Large')).toBeDefined();
  });
});

