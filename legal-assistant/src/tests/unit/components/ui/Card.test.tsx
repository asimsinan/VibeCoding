import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card Component', () => {
  it('should render card with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText(/card content/i)).toBeInTheDocument();
  });

  it('should render card with Turkish text', () => {
    render(<Card>Kart İçeriği</Card>);
    expect(screen.getByText('Kart İçeriği')).toBeInTheDocument();
  });

  it('should apply default card styles', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('shadow-lg');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-gray-100');
  });

  it('should apply hover effects', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('hover:shadow-xl');
    expect(card).toHaveClass('transition-all');
    expect(card).toHaveClass('duration-300');
  });

  it('should apply elevation system correctly', () => {
    const { rerender } = render(<Card elevation="sm">Content</Card>);
    let card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('shadow-sm');

    rerender(<Card elevation="md">Content</Card>);
    card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('shadow-md');

    rerender(<Card elevation="lg">Content</Card>);
    card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('shadow-lg');

    rerender(<Card elevation="xl">Content</Card>);
    card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('shadow-xl');
  });

  it('should apply gradient background when gradient prop is true', () => {
    render(<Card gradient>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('bg-gradient-card');
  });

  it('should apply padding correctly', () => {
    const { rerender } = render(<Card padding="sm">Content</Card>);
    let card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('p-2');

    rerender(<Card padding="md">Content</Card>);
    card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('p-4');

    rerender(<Card padding="lg">Content</Card>);
    card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('p-6');
  });

  it('should render as clickable when onClick provided', () => {
    const handleClick = jest.fn();
    render(<Card onClick={handleClick}>Clickable</Card>);
    const card = screen.getByText('Clickable').closest('div');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('should have role when clickable', () => {
    const handleClick = jest.fn();
    render(<Card onClick={handleClick}>Clickable</Card>);
    const card = screen.getByText('Clickable').closest('div');
    expect(card).toHaveAttribute('role', 'button');
  });

  it('should apply border-turkish-blue when variant is primary', () => {
    render(<Card variant="primary">Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('border-turkish-blue');
  });

  it('should apply max-width when constrained prop is true', () => {
    render(<Card constrained>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('max-w-4xl');
  });

  it('should render with animation classes', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('animate-fade-in');
  });
});

