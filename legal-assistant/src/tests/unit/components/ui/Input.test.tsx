import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input Component', () => {
  it('should render input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
  });

  it('should render input with Turkish placeholder', () => {
    render(<Input placeholder="Metin girin" />);
    expect(screen.getByPlaceholderText(/metin girin/i)).toBeInTheDocument();
  });

  it('should render input with label', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    expect(screen.getByText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter email/i)).toBeInTheDocument();
  });

  it('should render input with Turkish label', () => {
    render(<Input label="E-posta" placeholder="E-posta girin" />);
    expect(screen.getByText(/e-posta/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e-posta girin/i)).toBeInTheDocument();
  });

  it('should apply default input styles', () => {
    render(<Input placeholder="Text" />);
    const input = screen.getByPlaceholderText(/text/i);
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('px-4');
    expect(input).toHaveClass('py-3');
    expect(input).toHaveClass('rounded-lg');
    expect(input).toHaveClass('border');
    expect(input).toHaveClass('border-gray-300');
    expect(input).toHaveClass('focus:ring-2');
    expect(input).toHaveClass('focus:ring-turkish-blue');
  });

  it('should apply focus styles', () => {
    render(<Input placeholder="Text" />);
    const input = screen.getByPlaceholderText(/text/i);
    expect(input).toHaveClass('focus:outline-none');
    expect(input).toHaveClass('focus:border-turkish-blue');
  });

  it('should apply error state styles', () => {
    render(<Input error placeholder="Text" />);
    const input = screen.getByPlaceholderText(/text/i);
    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveClass('focus:ring-red-500');
  });

  it('should display error message when error prop provided', () => {
    render(<Input error errorMessage="This field is required" />);
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
  });

  it('should display Turkish error message', () => {
    render(<Input error errorMessage="Bu alan zorunludur" />);
    expect(screen.getByText(/bu alan zorunludur/i)).toBeInTheDocument();
  });

  it('should handle onChange events', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} placeholder="Text" />);
    const input = screen.getByPlaceholderText(/text/i);
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Text" />);
    const input = screen.getByPlaceholderText(/text/i) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input).toHaveClass('opacity-50');
    expect(input).toHaveClass('cursor-not-allowed');
  });

  it('should apply size variants', () => {
    const { rerender } = render(<Input size="sm" placeholder="Small" />);
    expect(screen.getByPlaceholderText(/small/i)).toHaveClass('py-2');
    expect(screen.getByPlaceholderText(/small/i)).toHaveClass('px-3');

    rerender(<Input size="md" placeholder="Medium" />);
    expect(screen.getByPlaceholderText(/medium/i)).toHaveClass('py-3');
    expect(screen.getByPlaceholderText(/medium/i)).toHaveClass('px-4');

    rerender(<Input size="lg" placeholder="Large" />);
    expect(screen.getByPlaceholderText(/large/i)).toHaveClass('py-4');
    expect(screen.getByPlaceholderText(/large/i)).toHaveClass('px-5');
  });

  it('should apply input type correctly', () => {
    const { rerender } = render(<Input type="text" placeholder="Text" />);
    expect(screen.getByPlaceholderText(/text/i)).toHaveAttribute('type', 'text');

    rerender(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText(/email/i)).toHaveAttribute('type', 'email');

    rerender(<Input type="password" placeholder="Password" />);
    expect(screen.getByPlaceholderText(/password/i)).toHaveAttribute('type', 'password');
  });

  it('should have aria-label for accessibility', () => {
    render(<Input aria-label="Email input" placeholder="Email" />);
    expect(screen.getByLabelText(/email input/i)).toBeInTheDocument();
  });

  it('should support Turkish characters', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} placeholder="Text" />);
    const input = screen.getByPlaceholderText(/text/i);
    fireEvent.change(input, { target: { value: 'Türkçe karakterler: üğışöç' } });
    expect(handleChange).toHaveBeenCalled();
  });
});

