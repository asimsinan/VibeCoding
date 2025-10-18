import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../../../apps/web/src/components/Input';

describe('Input Component', () => {
  it('should render input with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeDefined();
  });

  it('should handle value changes', () => {
    let value = '';
    render(<Input onChange={(e) => { value = e.target.value; }} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });
    expect(value).toBe('test');
  });

  it('should show error message', () => {
    render(<Input error="Invalid input" />);
    expect(screen.getByText('Invalid input')).toBeDefined();
  });

  it('should show helper text', () => {
    render(<Input helperText="Enter your email" />);
    expect(screen.getByText('Enter your email')).toBeDefined();
  });

  it('should support different types', () => {
    const { rerender } = render(<Input type="email" />);
    let input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.type).toBe('email');
    
    rerender(<Input type="password" />);
    input = document.querySelector('input[type="password"]') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});

