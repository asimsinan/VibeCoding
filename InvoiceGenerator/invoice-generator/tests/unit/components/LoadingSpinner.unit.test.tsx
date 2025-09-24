import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner } from '../../../src/components/LoadingSpinner/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('loading-spinner');
    expect(spinner).toHaveClass('loading-spinner--medium');
    expect(spinner).toHaveClass('loading-spinner--primary');
  });

  it('renders with custom size', () => {
    render(<LoadingSpinner size="large" />);
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('loading-spinner--large');
  });

  it('renders with custom color', () => {
    render(<LoadingSpinner color="secondary" />);
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('loading-spinner--secondary');
  });

  it('renders with text', () => {
    render(<LoadingSpinner text="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders as overlay when specified', () => {
    render(<LoadingSpinner overlay={true} />);
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner.parentElement).toHaveClass('loading-spinner__overlay');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />);
    
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toHaveClass('custom-spinner');
  });

  it('renders all size variants', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('loading-spinner--small');

    rerender(<LoadingSpinner size="medium" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('loading-spinner--medium');

    rerender(<LoadingSpinner size="large" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('loading-spinner--large');
  });

  it('renders all color variants', () => {
    const { rerender } = render(<LoadingSpinner color="primary" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('loading-spinner--primary');

    rerender(<LoadingSpinner color="secondary" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('loading-spinner--secondary');

    rerender(<LoadingSpinner color="white" />);
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('loading-spinner--white');
  });
});
