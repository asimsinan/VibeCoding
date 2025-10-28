import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '@/components/features/ChatInterface';

describe('ChatInterface Component Integration', () => {
  it('should render chat interface', () => {
    render(<ChatInterface sessionId="test-session" />);
    expect(screen.getByPlaceholderText(/mesaj yaz/i)).toBeInTheDocument();
  });

  it('should render send button', () => {
    render(<ChatInterface sessionId="test-session" />);
    expect(screen.getByRole('button', { name: /gönder/i })).toBeInTheDocument();
  });

  it('should handle message input', () => {
    render(<ChatInterface sessionId="test-session" />);
    const input = screen.getByPlaceholderText(/mesaj yaz/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input).toHaveValue('Test message');
  });

  it('should send message when send button clicked', async () => {
    render(<ChatInterface sessionId="test-session" />);
    const input = screen.getByPlaceholderText(/mesaj yaz/i);
    const button = screen.getByRole('button', { name: /gönder/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/test message/i)).toBeInTheDocument();
    });
  });

  it('should send message with Enter key', async () => {
    render(<ChatInterface sessionId="test-session" />);
    const input = screen.getByPlaceholderText(/mesaj yaz/i);
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/test message/i)).toBeInTheDocument();
    });
  });

  it('should display AI response', async () => {
    render(<ChatInterface sessionId="test-session" />);
    const input = screen.getByPlaceholderText(/mesaj yaz/i);
    const button = screen.getByRole('button', { name: /gönder/i });
    
    fireEvent.change(input, { target: { value: 'Soru' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/cevap/i)).toBeInTheDocument();
    });
  });

  it('should show typing indicator', async () => {
    render(<ChatInterface sessionId="test-session" />);
    const input = screen.getByPlaceholderText(/mesaj yaz/i);
    const button = screen.getByRole('button', { name: /gönder/i });
    
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(button);
    
    expect(screen.getByText(/yazıyor/i)).toBeInTheDocument();
  });

  it('should handle Turkish characters in messages', async () => {
    render(<ChatInterface sessionId="test-session" />);
    const input = screen.getByPlaceholderText(/mesaj yaz/i);
    const button = screen.getByRole('button', { name: /gönder/i });
    
    fireEvent.change(input, { target: { value: 'Türkçe karakterler: üğışöç' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/türkçe karakterler/i)).toBeInTheDocument();
    });
  });

  it('should clear input after sending message', async () => {
    render(<ChatInterface sessionId="test-session" />);
    const input = screen.getByPlaceholderText(/mesaj yaz/i);
    const button = screen.getByRole('button', { name: /gönder/i });
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should not send empty messages', () => {
    render(<ChatInterface sessionId="test-session" />);
    const button = screen.getByRole('button', { name: /gönder/i });
    
    expect(button).toBeDisabled();
  });
});

