import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loading } from '../../../apps/web/src/components/Loading';

describe('Loading Component', () => {
  it('should render loading spinner', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('.spinner')).toBeDefined();
  });

  it('should render with text', () => {
    render(<Loading text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('should support different sizes', () => {
    const { rerender, container } = render(<Loading size="sm" />);
    expect(container.firstChild).toBeDefined();
    
    rerender(<Loading size="lg" />);
    expect(container.firstChild).toBeDefined();
  });

  it('should support fullscreen mode', () => {
    const { container } = render(<Loading fullscreen />);
    expect(container.firstChild).toBeDefined();
  });
});

