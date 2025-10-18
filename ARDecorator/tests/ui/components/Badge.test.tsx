import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../../apps/web/src/components/Badge';

describe('Badge Component', () => {
  it('should render badge with text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeDefined();
  });

  it('should support different variants', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toBeDefined();
    
    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toBeDefined();
    
    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error')).toBeDefined();
  });

  it('should support different sizes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toBeDefined();
    
    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText('Large')).toBeDefined();
  });
});

